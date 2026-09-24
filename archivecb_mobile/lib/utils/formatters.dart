import 'package:intl/intl.dart';

/// Formatage des dates, montants et libellés (miroir de `utils/format.ts`).
class Fmt {
  Fmt._();

  static final _date = DateFormat('dd/MM/yyyy', 'fr_FR');
  static final _dateTime = DateFormat('dd/MM/yyyy HH:mm', 'fr_FR');
  static final _iso = DateFormat('yyyy-MM-dd');

  static String date(dynamic value) {
    final d = _parse(value);
    if (d == null) return '-';
    return _date.format(d);
  }

  static String dateTime(dynamic value) {
    final d = _parse(value);
    if (d == null) return '-';
    return _dateTime.format(d);
  }

  static String isoDate(DateTime? value) =>
      value == null ? '' : _iso.format(value);

  static DateTime? parse(dynamic value) => _parse(value);

  static DateTime? _parse(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value)?.toLocal();
    }
    return null;
  }

  static String _trimNumber(double n) {
    final rounded = (n * 10).round() / 10;
    final s = rounded.toStringAsFixed(1);
    return s.endsWith('.0') ? s.substring(0, s.length - 2) : s;
  }

  static final _thousands = NumberFormat('#,##0', 'fr_FR');

  /// Formate un montant en abrégeant les grandes valeurs.
  static String montant(dynamic value, [String devise = 'CDF']) {
    final n = (value is num) ? value.toDouble() : double.tryParse('$value') ?? 0;
    final abs = n.abs();
    if (abs >= 1000000000) return '${_trimNumber(n / 1000000000)} Md $devise';
    if (abs >= 1000000) return '${_trimNumber(n / 1000000)} M $devise';
    return '${_thousands.format(n)} $devise';
  }

  static String cdf(dynamic value) => montant(value, 'CDF');

  /// Version courte (axes de graphiques) : "1 Md", "1,5 M", "12 K", "500".
  static String cdfShort(dynamic value) {
    final n = (value is num) ? value.toDouble() : double.tryParse('$value') ?? 0;
    final abs = n.abs();
    if (abs >= 1000000000) return '${_trimNumber(n / 1000000000)} Md';
    if (abs >= 1000000) return '${_trimNumber(n / 1000000)} M';
    if (abs >= 1000) return '${_trimNumber(n / 1000)} K';
    return _thousands.format(n);
  }

  /// "il y a 5 min", "il y a 2h", "il y a 3j".
  static String timeAgo(dynamic value) {
    final d = _parse(value);
    if (d == null) return '-';
    final diff = DateTime.now().difference(d);
    final minutes = diff.inMinutes;
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return 'il y a $minutes min';
    final hours = diff.inHours;
    if (hours < 24) return 'il y a ${hours}h';
    final days = diff.inDays;
    return 'il y a ${days}j';
  }

  static const List<String> moisCourts = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];

  static const List<String> moisLongs = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
}
