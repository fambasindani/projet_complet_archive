/// Pagination générique (miroir de `PaginatedResponse<T>` du front web).
class Paginated<T> {
  final List<T> data;
  final int currentPage;
  final int lastPage;
  final int perPage;
  final int total;

  const Paginated({
    required this.data,
    required this.currentPage,
    required this.lastPage,
    required this.perPage,
    required this.total,
  });

  factory Paginated.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromItem,
  ) {
    final raw = json['data'];
    final items = <T>[];
    if (raw is List) {
      for (final e in raw) {
        if (e is Map<String, dynamic>) items.add(fromItem(e));
      }
    }
    return Paginated(
      data: items,
      currentPage: _int(json['current_page']) ?? 1,
      lastPage: _int(json['last_page']) ?? 1,
      perPage: _int(json['per_page']) ?? items.length,
      total: _int(json['total']) ?? items.length,
    );
  }

  static int? _int(dynamic v) =>
      v is int ? v : (v is String ? int.tryParse(v) : null);

  bool get hasMore => currentPage < lastPage;
  int get from => total == 0 ? 0 : (currentPage - 1) * perPage + 1;
  int get to => (currentPage * perPage).clamp(0, total);
}

/// Paramètres de pagination/recherche envoyés à l'API.
class PaginationParams {
  final int? page;
  final int? perPage;
  final String? search;
  final String? sort;
  final String? order;

  const PaginationParams({
    this.page,
    this.perPage,
    this.search,
    this.sort,
    this.order,
  });

  Map<String, dynamic> toQuery() => {
        if (page != null) 'page': page,
        if (perPage != null) 'per_page': perPage,
        if (search != null && search!.isNotEmpty) 'search': search,
        if (sort != null) 'sort': sort,
        if (order != null) 'order': order,
      };

  PaginationParams copyWith({
    int? page,
    int? perPage,
    String? search,
    String? sort,
    String? order,
  }) =>
      PaginationParams(
        page: page ?? this.page,
        perPage: perPage ?? this.perPage,
        search: search ?? this.search,
        sort: sort ?? this.sort,
        order: order ?? this.order,
      );
}
