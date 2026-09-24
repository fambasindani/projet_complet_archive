import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';

/// Exception API (miroir de `ApiError` du front web).
class ApiException implements Exception {
  final String message;
  final int? status;
  final Map<String, List<String>> errors;

  ApiException(this.message, {this.status, this.errors = const {}});

  @override
  String toString() => message;
}

/// Client HTTP centralisé.
///
/// Reproduit le comportement de `frontend/src/services/api.ts` :
/// - injecte le token Bearer,
/// - déballe l'enveloppe Laravel `{success, message, data}`,
/// - fusionne la pagination `{data: [...], pagination: {...}}`.
class ApiClient {
  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl.replaceAll(RegExp(r'/+$'), ''),
        connectTimeout: Duration(milliseconds: Env.apiTimeout),
        receiveTimeout: Duration(milliseconds: Env.apiTimeout),
        headers: {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          handler.next(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();
  factory ApiClient() => instance;

  late final Dio _dio;

  String get baseUrl => _dio.options.baseUrl;

  // ─── Token ───
  static const _tokenKey = 'token';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove('utilisateur');
  }

  Future<bool> hasToken() async {
    final t = await getToken();
    return t != null && t.isNotEmpty;
  }

  // ─── Verbes ───
  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _request('GET', path, query: query);

  Future<dynamic> post(String path, {dynamic data, Map<String, dynamic>? query}) =>
      _request('POST', path, data: data, query: query);

  Future<dynamic> put(String path, {dynamic data, Map<String, dynamic>? query}) =>
      _request('PUT', path, data: data, query: query);

  Future<dynamic> patch(String path, {dynamic data, Map<String, dynamic>? query}) =>
      _request('PATCH', path, data: data, query: query);

  Future<dynamic> delete(String path) => _request('DELETE', path);

  Future<dynamic> upload(String path, FormData formData) =>
      _request('POST', path, data: formData);

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? query,
    dynamic data,
  }) async {
    final cleanQuery = query == null
        ? null
        : Map<String, dynamic>.fromEntries(
            query.entries.where((e) => e.value != null),
          );

    try {
      final response = await _dio.request(
        path,
        queryParameters: cleanQuery,
        data: data,
        options: Options(method: method),
      );
      return _decode(response.data);
    } on DioException catch (e) {
      throw _toApiException(e, path);
    }
  }

  /// Décode la réponse sans altérer l'enveloppe (comme axios `r.data`).
  ///
  /// Les services interprètent ensuite :
  /// - paginé Laravel : `{data: [...], current_page, last_page, ...}`
  /// - enveloppé : `{success, data: {...}, message}`
  dynamic _decode(dynamic raw) {
    dynamic body = raw;
    if (body is String && body.isNotEmpty) {
      try {
        body = jsonDecode(body);
      } catch (_) {
        return body;
      }
    }
    if (body is List<int>) {
      try {
        body = jsonDecode(utf8.decode(body));
      } catch (_) {
        return body;
      }
    }
    return body;
  }

  /// Extrait `data` d'une enveloppe `{success, data}` ; sinon renvoie le corps.
  static dynamic unwrap(dynamic body) {
    if (body is Map && body.containsKey('data') && body.containsKey('success')) {
      return body['data'];
    }
    return body;
  }

  ApiException _toApiException(DioException e, String path) {
    final response = e.response;
    if (response != null) {
      final status = response.statusCode;
      dynamic data = response.data;
      if (data is String && data.isNotEmpty) {
        try {
          data = jsonDecode(data);
        } catch (_) {}
      }
      if (data is Map) {
        final message = (data['message']?.toString()) ?? 'Erreur $status';
        final errors = <String, List<String>>{};
        final rawErrors = data['errors'];
        if (rawErrors is Map) {
          rawErrors.forEach((k, v) {
            if (v is List) {
              errors[k.toString()] =
                  v.map((e) => e.toString()).toList(growable: false);
            } else {
              errors[k.toString()] = [v.toString()];
            }
          });
        }
        return ApiException(message, status: status, errors: errors);
      }
      return ApiException('Erreur $status', status: status);
    }

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return ApiException(
            'Délai d\'attente dépassé. Vérifiez votre connexion.');
      case DioExceptionType.connectionError:
        return ApiException('Pas de connexion. Vérifiez votre réseau.');
      default:
        return ApiException('Erreur inattendue: ${e.message}');
    }
  }
}
