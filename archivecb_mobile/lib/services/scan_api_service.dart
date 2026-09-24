import 'package:dio/dio.dart';

import '../models/note_perception.dart';
import 'api_client.dart';
import 'parse.dart';

/// Envoi des documents numérisés vers le backend (`/scans/*`).
class ScanApiService {
  ScanApiService._();
  static final ScanApiService instance = ScanApiService._();
  factory ScanApiService() => instance;
  final _api = ApiClient();

  Future<Map<String, dynamic>> upload(
    String filePath, {
    String? scanDate,
    String? scannerSource,
  }) async {
    final form = FormData.fromMap({
      'scan_file': await MultipartFile.fromFile(filePath),
      if (scanDate != null) 'scan_date': scanDate,
      if (scannerSource != null) 'scanner_source': scannerSource,
    });
    return parseObject(await _api.upload('/scans/upload', form));
  }

  Future<List<DocumentScanne>> uploadMultiple(
    List<String> filePaths, {
    int? idClasseur,
  }) async {
    final form = FormData();
    for (final path in filePaths) {
      form.files.add(MapEntry('files[]', await MultipartFile.fromFile(path)));
    }
    if (idClasseur != null) {
      form.fields.add(MapEntry('id_classeur', idClasseur.toString()));
    }
    return parseList(
        await _api.upload('/scans/upload-multiple', form), DocumentScanne.fromJson);
  }

  Future<List<DocumentScanne>> list() async =>
      parseList(await _api.get('/scans/list'), DocumentScanne.fromJson);

  Future<List<DocumentScanne>> listAll() async =>
      parseList(await _api.get('/scans'), DocumentScanne.fromJson);

  Future<List<DocumentScanne>> search(String query) async => parseList(
      await _api.get('/scans/search', query: {'q': query}),
      DocumentScanne.fromJson);

  String downloadUrl(String filename) =>
      '${_api.baseUrl}/scans/download/${Uri.encodeComponent(filename)}';

  Future<void> remove(String filename) =>
      _api.delete('/scans/delete/${Uri.encodeComponent(filename)}');
}
