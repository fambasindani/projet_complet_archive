/// Helpers de désérialisation tolérante (l'API peut renvoyer des types variés).
library;

int? asInt(dynamic v) {
  if (v == null) return null;
  if (v is int) return v;
  if (v is double) return v.toInt();
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v);
  return null;
}

double? asDouble(dynamic v) {
  if (v == null) return null;
  if (v is double) return v;
  if (v is int) return v.toDouble();
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v);
  return null;
}

bool asBool(dynamic v, [bool fallback = false]) {
  if (v == null) return fallback;
  if (v is bool) return v;
  if (v is num) return v != 0;
  if (v is String) {
    final s = v.toLowerCase();
    return s == '1' || s == 'true' || s == 'oui' || s == 'yes';
  }
  return fallback;
}

String? asString(dynamic v) {
  if (v == null) return null;
  if (v is String) return v;
  return v.toString();
}

String asStringOr(dynamic v, [String fallback = '']) => asString(v) ?? fallback;

DateTime? asDate(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
  return null;
}

Map<String, dynamic>? asMap(dynamic v) =>
    v is Map<String, dynamic> ? v : null;

List<Map<String, dynamic>> asMapList(dynamic v) {
  if (v is! List) return const [];
  return v.whereType<Map<String, dynamic>>().toList();
}
