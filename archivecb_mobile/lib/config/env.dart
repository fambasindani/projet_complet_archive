import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Accès centralisé aux variables d'environnement définies dans `.env`.
class Env {
  Env._();

  static String get apiBaseUrl {
    var url = (dotenv.env['API_BASE_URL'] ??
            'https://totalconceptrdc.org/backend')
        .trim()
        .replaceAll(RegExp(r'/+$'), '');
    if (!url.endsWith('/api')) url = '$url/api';
    return url;
  }

  static String get appName => dotenv.env['APP_NAME'] ?? 'I-KIPUSHI';

  static String get appVersion => dotenv.env['APP_VERSION'] ?? '1.0.0';

  static String get scannerServiceUrl =>
      dotenv.env['SCANNER_SERVICE_URL'] ?? 'http://localhost:9000';

  static int get apiTimeout =>
      int.tryParse(dotenv.env['API_TIMEOUT'] ?? '') ?? 30000;
}
