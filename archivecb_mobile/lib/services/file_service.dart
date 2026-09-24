import 'dart:io';

import 'package:dio/dio.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import 'api_client.dart';

/// Téléchargement et ouverture de fichiers protégés (PDF, textes...).
///
/// `open_filex` ne gère pas les URL http et ne peut pas envoyer le token ;
/// on télécharge donc le fichier (avec l'en-tête Authorization) vers le
/// stockage temporaire, puis on l'ouvre avec l'application système.
class FileService {
  FileService._();
  static final FileService instance = FileService._();
  factory FileService() => FileService();

  final _dio = Dio();
  final _api = ApiClient();

  /// Télécharge [url] et retourne le fichier local.
  Future<File> download(String url, {String? filename}) async {
    final dir = await getTemporaryDirectory();
    final name = _safeName(filename ?? _nameFromUrl(url));
    final file = File('${dir.path}/$name');

    final token = await _api.getToken();
    await _dio.download(
      url,
      file.path,
      options: Options(
        headers: {
          if (token != null && token.isNotEmpty)
            'Authorization': 'Bearer $token',
          'Accept': '*/*',
        },
      ),
    );
    return file;
  }

  /// Télécharge puis ouvre le fichier.
  Future<void> openRemote(String url, {String? filename}) async {
    final file = await download(url, filename: filename);
    await OpenFilex.open(file.path);
  }

  String _nameFromUrl(String url) {
    final clean = url.split('?').first;
    final last = clean.split('/').last;
    return last.isEmpty ? 'document.pdf' : last;
  }

  String _safeName(String name) {
    var n = name.replaceAll(RegExp(r'[^A-Za-z0-9_.\-]'), '_');
    if (!n.toLowerCase().endsWith('.pdf')) n = '$n.pdf';
    return n;
  }
}
