import '../models/dashboard.dart';
import '../models/note_perception.dart';
import '../models/pagination.dart';
import 'api_client.dart';
import 'parse.dart';

class NotePerceptionService {
  NotePerceptionService._();
  static final NotePerceptionService instance = NotePerceptionService._();
  factory NotePerceptionService() => instance;
  final _api = ApiClient();

  Future<Paginated<NotePerception>> list(
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/notes',
            query: {'page': page, 'per_page': perPage}),
        NotePerception.fromJson,
      );

  Future<Paginated<NotePerception>> listByCentre(int centreId,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/note-centre/$centreId',
            query: {'page': page, 'per_page': perPage}),
        NotePerception.fromJson,
      );

  Future<Paginated<NotePerception>> search(String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.post('/notes/search',
            data: {'search': search, 'page': page, 'per_page': perPage}),
        NotePerception.fromJson,
      );

  Future<Paginated<NotePerception>> searchByCentre(int centreId, String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.post('/search-note/$centreId',
            query: {'page': page, 'per_page': perPage},
            data: {'search': search}),
        NotePerception.fromJson,
      );

  Future<NotePerception> getById(int id) async =>
      NotePerception.fromJson(parseObject(await _api.get('/notes/$id')));

  Future<void> create(Map<String, dynamic> data) =>
      _api.post('/notes', data: data);

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/notes/$id', data: data);

  Future<void> remove(int id) => _api.delete('/notes/$id');

  /// Recherche avancée OCR des notes de perception.
  Future<Paginated<NoteSearchResult>> advancedSearch(
    Map<String, dynamic> filters,
  ) async =>
      parseWrappedPaginated(
        await _api.post('/notes-perception/advanced-search', data: filters),
        NoteSearchResult.fromJson,
      );

  String noteDocumentDownloadUrl(int docId) =>
      '${_api.baseUrl}/notes/downloads/$docId';

  String noteDownloadUrl(int noteId) => '${_api.baseUrl}/notes/downloads/$noteId';
}

class AssujettiService {
  AssujettiService._();
  static final AssujettiService instance = AssujettiService._();
  factory AssujettiService() => instance;
  final _api = ApiClient();

  Future<Paginated<Assujetti>> list(
          {int page = 1, int perPage = 20, String? search}) async =>
      parsePaginated(
        await _api.get('/assujettis', query: {
          'page': page,
          'per_page': perPage,
          if (search != null && search.isNotEmpty) 'search': search,
        }),
        Assujetti.fromJson,
      );

  Future<List<Assujetti>> search(String search) async => parseList(
      await _api.get('/assujettis/search', query: {'search': search}),
      Assujetti.fromJson);

  Future<Assujetti> getById(int id) async =>
      Assujetti.fromJson(parseObject(await _api.get('/assujettis/$id')));

  Future<void> create(Map<String, dynamic> data) =>
      _api.post('/assujettis', data: data);

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/assujettis/$id', data: data);

  Future<void> remove(int id) => _api.delete('/assujettis/$id');
}

/// Journal / audit.
class JournalService {
  JournalService._();
  static final JournalService instance = JournalService._();
  factory JournalService() => instance;
  final _api = ApiClient();

  Future<Paginated<LogEntry>> list({
    int page = 1,
    int perPage = 20,
    String? action,
    String? table,
    String? search,
  }) async =>
      parsePaginated(
        await _api.get('/journal', query: {
          'page': page,
          'per_page': perPage,
          if (action != null && action.isNotEmpty) 'action': action,
          if (table != null && table.isNotEmpty) 'table': table,
          if (search != null && search.isNotEmpty) 'search': search,
        }),
        LogEntry.fromJson,
      );

  Future<Map<String, dynamic>> stats() async =>
      parseObject(await _api.get('/journal/stats'));

  Future<List<String>> tables() async {
    final raw = await _api.get('/journal/tables');
    if (raw is List) return raw.map((e) => e.toString()).toList();
    return const [];
  }
}
