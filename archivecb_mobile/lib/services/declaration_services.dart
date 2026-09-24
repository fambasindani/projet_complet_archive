import 'package:dio/dio.dart';

import '../models/archivage.dart';
import '../models/dashboard.dart';
import '../models/pagination.dart';
import 'api_client.dart';
import 'parse.dart';

class DeclarationService {
  DeclarationService._();
  static final DeclarationService instance = DeclarationService._();
  factory DeclarationService() => instance;
  final _api = ApiClient();

  Future<Paginated<Declaration>> list({
    int page = 1,
    int perPage = 10,
    String? directionIds,
    int? idClasseur,
    int? idDirection,
  }) async =>
      parsePaginated(
        await _api.get('/declarations', query: {
          'page': page,
          'per_page': perPage,
          if (directionIds != null && directionIds.isNotEmpty)
            'direction_ids': directionIds,
          if (idClasseur != null) 'id_classeur': idClasseur,
          if (idDirection != null) 'id_direction': idDirection,
        }),
        Declaration.fromJson,
      );

  Future<Paginated<Declaration>> search(String search,
          {int page = 1, int perPage = 10, String? directionIds}) async =>
      parsePaginated(
        await _api.post('/declarations/search', data: {
          'search': search,
          'page': page,
          'per_page': perPage,
          if (directionIds != null && directionIds.isNotEmpty)
            'direction_ids': directionIds,
        }),
        Declaration.fromJson,
      );

  Future<Declaration> getById(int id) async => Declaration.fromJson(
      parseObject(await _api.get('/editdeclaration/$id')));

  Future<Map<String, dynamic>> detail(int id) async =>
      parseObject(await _api.get('/details/$id'));

  /// Retourne l'id créé (le backend renvoie {success, declaration, id}).
  Future<int?> create(Map<String, dynamic> data) async {
    final body = await _api.post('/declarations', data: data);
    if (body is Map) {
      final id = body['id'];
      if (id is int) return id;
      final decl = body['declaration'];
      if (decl is Map && decl['id'] is int) return decl['id'] as int;
      final obj = parseObject(body);
      if (obj['id'] is int) return obj['id'] as int;
    }
    return null;
  }

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/declarations/$id', data: data);

  Future<void> remove(int id) => _api.delete('/declarations/$id');

  Future<Paginated<Declaration>> listByClasseur(int classeurId,
          {int page = 1, String? directionIds}) async =>
      parsePaginated(
        await _api.get('/listedeclaration/$classeurId', query: {
          'page': page,
          if (directionIds != null && directionIds.isNotEmpty)
            'direction_ids': directionIds,
        }),
        Declaration.fromJson,
      );
}

class DocumentDeclarationService {
  DocumentDeclarationService._();
  static final DocumentDeclarationService instance =
      DocumentDeclarationService._();
  factory DocumentDeclarationService() => instance;
  final _api = ApiClient();

  Future<List<DocumentDeclaration>> getByDeclaration(int declarationId) async =>
      parseList(await _api.get('/documents/$declarationId'),
          DocumentDeclaration.fromJson);

  Future<List<DocumentDeclaration>> uploadMultiple({
    required int declarationId,
    required int classeurId,
    required List<String> filePaths,
  }) async {
    final form = FormData();
    form.fields.add(MapEntry('id_declaration', declarationId.toString()));
    form.fields.add(MapEntry('id_classeur', classeurId.toString()));
    for (final path in filePaths) {
      form.files.add(MapEntry('files[]', await MultipartFile.fromFile(path)));
    }
    final raw = await _api.upload('/documents-declaration/upload-multiple', form);
    return parseList(raw, DocumentDeclaration.fromJson);
  }

  Future<String?> getText(int id) async {
    final obj = parseObject(await _api.get('/documents-declaration/$id/text'));
    return obj['montext']?.toString();
  }

  Future<void> updateText(int id, String montext) =>
      _api.put('/documents-declaration/$id/update-text',
          data: {'montext': montext});

  String downloadUrl(int id) =>
      '${_api.baseUrl}/documents-declaration/download/$id';

  Future<OcrStats> ocrStats({int? idDeclaration}) async => OcrStats.fromJson(
      parseObject(await _api.get('/documents-declaration/ocr-stats', query: {
        if (idDeclaration != null) 'id_declaration': idDeclaration,
      })));

  Future<void> deleteDocument(int id) => _api.delete('/delete-document/$id');

  /// Recherche avancée OCR des documents d'une direction.
  Future<Paginated<DocumentDeclaration>> advancedSearch(
    int directionId,
    Map<String, dynamic> filters,
  ) async =>
      parseWrappedPaginated(
        await _api.post('/documents-declaration/advanced-search/$directionId',
            data: filters),
        DocumentDeclaration.fromJson,
      );
}
