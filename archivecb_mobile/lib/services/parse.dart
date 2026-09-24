import '../models/pagination.dart';
import '../utils/json_utils.dart';

/// Extrait une liste paginée quelle que soit l'enveloppe du backend.
///
/// Gère :
/// - `{data: [...], current_page, last_page, ...}` (paginator direct)
/// - `{success: true, data: {data: [...], current_page, ...}}` (enveloppe)
/// - `[...]` (liste simple)
/// - `{data: [...]}` (liste enveloppée)
Paginated<T> parsePaginated<T>(
  dynamic body,
  T Function(Map<String, dynamic>) fromItem,
) {
  dynamic b = body;

  if (b is Map && b['success'] == true && b['data'] != null) {
    b = b['data'];
  }

  if (b is Map) {
    final map = b.cast<String, dynamic>();
    if (map['data'] is List) {
      return Paginated.fromJson(map, fromItem);
    }
    if (map['data'] is Map) {
      final nested = asMap(map['data'])!;
      if (nested['data'] is List) {
        return Paginated.fromJson(nested, fromItem);
      }
    }
  }

  if (b is List) {
    final items = b.whereType<Map<String, dynamic>>().map(fromItem).toList();
    return Paginated(
      data: items,
      currentPage: 1,
      lastPage: 1,
      perPage: items.length,
      total: items.length,
    );
  }

  return const Paginated(
    data: [],
    currentPage: 1,
    lastPage: 1,
    perPage: 0,
    total: 0,
  );
}

/// Extrait une liste simple (non paginée).
List<T> parseList<T>(dynamic body, T Function(Map<String, dynamic>) fromItem) {
  dynamic b = body;
  if (b is Map && b['success'] == true && b['data'] != null) b = b['data'];
  if (b is Map && b['data'] is List) b = b['data'];
  if (b is List) {
    return b.whereType<Map<String, dynamic>>().map(fromItem).toList();
  }
  return const [];
}

/// Extrait un objet unique d'une enveloppe éventuelle.
Map<String, dynamic> parseObject(dynamic body) {
  if (body is Map) {
    final map = body.cast<String, dynamic>();
    final data = map['data'];
    if (data is Map) return data.cast<String, dynamic>();
    return map;
  }
  return const {};
}

/// Extrait `{success, data: [...], pagination: {...}}` (recherches avancées).
Paginated<T> parseWrappedPaginated<T>(
  dynamic body,
  T Function(Map<String, dynamic>) fromItem,
) {
  if (body is Map) {
    final map = body.cast<String, dynamic>();
    final data = map['data'];
    if (data is List) {
      final items =
          data.whereType<Map<String, dynamic>>().map(fromItem).toList();
      final pag = asMap(map['pagination']);
      if (pag != null) {
        return Paginated(
          data: items,
          currentPage: asInt(pag['current_page']) ?? 1,
          lastPage: asInt(pag['last_page']) ?? 1,
          perPage: asInt(pag['per_page']) ?? items.length,
          total: asInt(pag['total']) ?? items.length,
        );
      }
      return Paginated(
        data: items,
        currentPage: 1,
        lastPage: 1,
        perPage: items.length,
        total: items.length,
      );
    }
  }
  return parsePaginated(body, fromItem);
}
