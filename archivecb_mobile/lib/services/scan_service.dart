import 'dart:io';
import 'dart:typed_data';

import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Service de numérisation de documents.
///
/// Méthode principale : `cunning_document_scanner` (détection et recadrage
/// automatiques). En cas d'échec (ex. Google Play Services absent sur certains
/// terminaux), un repli caméra via `image_picker` permet de capturer les pages
/// une à une.
class ScanService {
  ScanService._();
  static final ScanService instance = ScanService._();
  factory ScanService() => instance;

  final _picker = ImagePicker();

  /// Ouvre le scanner natif et retourne les chemins des images.
  Future<List<String>> scanDocuments({
    int noOfPages = 20,
    bool galleryImportAllowed = true,
  }) async {
    try {
      final pictures = await CunningDocumentScanner.getPictures(
        noOfPages: noOfPages,
        scannerSource: galleryImportAllowed
            ? ScannerSource.cameraAndGallery
            : ScannerSource.camera,
      );
      if (pictures == null || pictures.isEmpty) {
        throw const ScanException('Aucun document scanné');
      }
      return pictures;
    } on ScanException {
      rethrow;
    } on CunningDocumentScannerException catch (e) {
      throw ScanException(e.message);
    } catch (e) {
      throw ScanException('Erreur lors du scan: $e');
    }
  }

  /// Scan complet : essaie le scanner natif puis bascule sur la caméra simple
  /// si nécessaire. [onContinue] est appelé après chaque photo (repli) pour
  /// demander à l'utilisateur s'il souhaite ajouter une page.
  Future<File> scanToPdf({
    int noOfPages = 20,
    bool galleryImportAllowed = true,
    String outputName = 'scan',
    Future<bool> Function(int pagesSoFar)? onContinue,
  }) async {
    try {
      final images = await scanDocuments(
        noOfPages: noOfPages,
        galleryImportAllowed: galleryImportAllowed,
      );
      return imagesToPdf(images, outputName: outputName);
    } on ScanException catch (nativeError) {
      final images = await _captureWithCamera(onContinue);
      if (images.isEmpty) throw ScanException(nativeError.message);
      return imagesToPdf(images, outputName: outputName);
    }
  }

  /// Repli : capture une ou plusieurs pages avec l'appareil photo du téléphone.
  Future<List<String>> _captureWithCamera(
    Future<bool> Function(int pagesSoFar)? onContinue,
  ) async {
    final paths = <String>[];
    while (true) {
      final shot = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 92,
      );
      if (shot == null) break;
      paths.add(shot.path);

      if (onContinue == null) break;
      final more = await onContinue(paths.length);
      if (!more) break;
    }
    return paths;
  }

  /// Sélection de plusieurs images depuis la galerie (repli secondaire).
  Future<List<String>> pickFromGallery() async {
    final files = await _picker.pickMultiImage(imageQuality: 92);
    return files.map((f) => f.path).toList();
  }

  /// Assemble une liste d'images en un fichier PDF.
  Future<File> imagesToPdf(
    List<String> imagePaths, {
    String outputName = 'scan',
  }) async {
    if (imagePaths.isEmpty) {
      throw const ScanException('Aucune image à convertir');
    }

    final doc = pw.Document();
    var pages = 0;
    for (final path in imagePaths) {
      final file = File(path);
      if (!await file.exists()) continue;
      final raw = await file.readAsBytes();

      // Compression : redimensionne (max ~1654 px ≈ A4 à 200 dpi) et
      // ré-encode en JPEG qualité 72 pour un PDF léger.
      Uint8List bytes;
      try {
        final decoded = img.decodeImage(raw);
        if (decoded != null) {
          var image = decoded;
          if (image.width > 1654 || image.height > 1654) {
            image = image.width >= image.height
                ? img.copyResize(decoded, width: 1654, interpolation: img.Interpolation.average)
                : img.copyResize(decoded, height: 1654, interpolation: img.Interpolation.average);
          }
          bytes = Uint8List.fromList(img.encodeJpg(image, quality: 72));
        } else {
          bytes = raw;
        }
      } catch (_) {
        bytes = raw;
      }

      final memoryImage = pw.MemoryImage(bytes);
      doc.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(8),
          build: (context) => pw.Center(
            child: pw.Image(memoryImage, fit: pw.BoxFit.contain),
          ),
        ),
      );
      pages++;
    }
    if (pages == 0) {
      throw const ScanException('Aucune image valide à convertir');
    }

    final dir = await getApplicationDocumentsDirectory();
    final scansDir = Directory('${dir.path}/scans');
    if (!await scansDir.exists()) {
      await scansDir.create(recursive: true);
    }
    final safeName = outputName.replaceAll(RegExp(r'[^A-Za-z0-9_\-]'), '_');
    final file = File(
      '${scansDir.path}/${safeName}_${DateTime.now().millisecondsSinceEpoch}.pdf',
    );
    await file.writeAsBytes(await doc.save());
    return file;
  }
}

class ScanException implements Exception {
  final String message;
  const ScanException(this.message);

  @override
  String toString() => message;
}
