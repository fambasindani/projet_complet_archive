import '../models/archivage.dart';
import '../models/auth.dart';
import '../models/note_perception.dart';
import '../models/pagination.dart';
import 'api_client.dart';
import 'parse.dart';

// ─────────────────────── Départements / Directions ───────────────────────
class DepartementService {
  DepartementService._();
  static final DepartementService instance = DepartementService._();
  factory DepartementService() => instance;
  final _api = ApiClient();

  Future<Paginated<Departement>> list({int? page, int? perPage, String? search}) async =>
      parsePaginated(
        await _api.get('/departements', query: {
          if (page != null) 'page': page,
          if (perPage != null) 'per_page': perPage,
          if (search != null && search.isNotEmpty) 'search': search,
        }),
        Departement.fromJson,
      );

  Future<Departement> get(int id) async =>
      Departement.fromJson(parseObject(await _api.get('/departements/$id')));

  Future<Departement> create(Map<String, dynamic> data) async =>
      Departement.fromJson(parseObject(await _api.post('/departements', data: data)));

  Future<Departement> update(int id, Map<String, dynamic> data) async =>
      Departement.fromJson(
          parseObject(await _api.put('/departements/$id', data: data)));

  Future<void> delete(int id) => _api.delete('/departements/$id');
}

/// Direction (legacy) — utilisée par l'écran Direction.
class DirectionService {
  DirectionService._();
  static final DirectionService instance = DirectionService._();
  factory DirectionService() => instance;
  final _api = ApiClient();

  Future<Paginated<Direction>> list({int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/directions',
            query: {'page': page, 'per_page': perPage}),
        Direction.fromJson,
      );

  Future<Paginated<Direction>> search(String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.post('/directions/search',
            data: {'search': search, 'page': page, 'per_page': perPage}),
        Direction.fromJson,
      );

  Future<void> create(Map<String, dynamic> data) async {
    final dept = parseObject(await _api.post('/departements', data: data));
    if (dept.isEmpty) return;
  }

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/departements/$id', data: data);

  Future<void> remove(int id) => _api.delete('/item/$id');
}

// ─────────────────────── Classeurs ───────────────────────
class ClasseurService {
  ClasseurService._();
  static final ClasseurService instance = ClasseurService._();
  factory ClasseurService() => instance;
  final _api = ApiClient();

  Future<Paginated<Classeur>> list({int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/classeurs',
            query: {'page': page, 'per_page': perPage}),
        Classeur.fromJson,
      );

  Future<Paginated<Classeur>> search(String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/classeurs/search',
            query: {'search': search, 'page': page, 'per_page': perPage}),
        Classeur.fromJson,
      );

  Future<List<Classeur>> listAll() async =>
      parseList(await _api.get('/classeur'), Classeur.fromJson);

  Future<Classeur> get(int id) async =>
      Classeur.fromJson(parseObject(await _api.get('/classeurs/$id')));

  Future<void> create(Map<String, dynamic> data) =>
      _api.post('/classeurs', data: data);

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/classeurs/$id', data: data);

  Future<void> remove(int id) => _api.delete('/classeurs/$id');
}

// ─────────────────────── Emplacements ───────────────────────
class EmplacementService {
  EmplacementService._();
  static final EmplacementService instance = EmplacementService._();
  factory EmplacementService() => instance;
  final _api = ApiClient();

  Future<Paginated<Emplacement>> list({int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/emplacements',
            query: {'page': page, 'per_page': perPage}),
        Emplacement.fromJson,
      );

  Future<Paginated<Emplacement>> search(String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/emplacements/search',
            query: {'search': search, 'page': page, 'per_page': perPage}),
        Emplacement.fromJson,
      );

  Future<List<Emplacement>> listAll() async =>
      parseList(await _api.get('/emplacement'), Emplacement.fromJson);

  Future<void> create(Map<String, dynamic> data) =>
      _api.post('/emplacements', data: data);

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/emplacements/$id', data: data);

  Future<void> remove(int id) => _api.delete('/emplacements/$id');
}

// ─────────────────────── Centres d'ordonnancement ───────────────────────
class CentreService {
  CentreService._();
  static final CentreService instance = CentreService._();
  factory CentreService() => instance;
  final _api = ApiClient();

  Future<Paginated<CentreOrdonnancement>> list(
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/centre_ordonnancements/all',
            query: {'page': page, 'per_page': perPage}),
        CentreOrdonnancement.fromJson,
      );

  Future<Paginated<CentreOrdonnancement>> search(String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.post('/centre_ordonnancements/search',
            data: {'search': search, 'page': page, 'per_page': perPage}),
        CentreOrdonnancement.fromJson,
      );

  Future<List<CentreOrdonnancement>> listAll() async =>
      parseList(await _api.get('/centre_ordonnancements/all'),
          CentreOrdonnancement.fromJson);

  Future<void> create(Map<String, dynamic> data) =>
      _api.post('/centre_ordonnancements', data: data);

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/centre_ordonnancements/$id', data: data);

  Future<void> remove(int id) => _api.delete('/centre_ordonnancements/$id');
}

// ─────────────────────── Articles budgétaires ───────────────────────
class ArticleService {
  ArticleService._();
  static final ArticleService instance = ArticleService._();
  factory ArticleService() => instance;
  final _api = ApiClient();

  Future<Paginated<ArticleBudgetaire>> list(
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.get('/article',
            query: {'page': page, 'per_page': perPage}),
        ArticleBudgetaire.fromJson,
      );

  Future<List<ArticleBudgetaire>> listAll() async =>
      parseList(await _api.get('/articleall'), ArticleBudgetaire.fromJson);

  Future<Paginated<ArticleBudgetaire>> search(String search,
          {int page = 1, int perPage = 10}) async =>
      parsePaginated(
        await _api.post('/search-article',
            data: {'search': search, 'page': page, 'per_page': perPage}),
        ArticleBudgetaire.fromJson,
      );

  Future<ArticleBudgetaire> get(int id) async => ArticleBudgetaire.fromJson(
      parseObject(await _api.get('/edit-article/$id')));

  Future<void> create(Map<String, dynamic> data) =>
      _api.post('/create-article', data: data);

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/update-article/$id', data: data);

  Future<void> remove(int id) => _api.delete('/delete-article/$id');
}
