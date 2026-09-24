import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth.dart';
import 'api_client.dart';
import 'parse.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();
  factory AuthService() => instance;

  final _api = ApiClient();

  static const _kModule = 'archive_module';
  static const _kUser = 'utilisateur';
  static const _kPermissions = 'permissions';
  static const _kDepartements = 'departements';

  /// Connexion au module sélectionné (`ad` ou `np`).
  Future<LoginResult> login({
    required String email,
    required String password,
    required String module,
  }) async {
    final raw = await _api.post('/connexion', data: {
      'email': email.trim(),
      'password': password,
    });
    final data = parseObject(raw);

    final token = data['token']?.toString() ?? '';
    final userJson = (data['user'] ?? data['utilisateur'] ?? data) as Map;
    final user =
        MonUtilisateur.fromJson(userJson.cast<String, dynamic>());

    final permissions = data['permissions'];
    List<String> codes = const [];
    if (permissions is Map && permissions['codes'] is List) {
      codes = (permissions['codes'] as List).map((e) => e.toString()).toList();
    }

    final deps = (data['departements'] is List)
        ? (data['departements'] as List)
            .whereType<Map<String, dynamic>>()
            .map(Departement.fromJson)
            .toList()
        : <Departement>[];

    if (token.isNotEmpty) await _api.setToken(token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kModule, module);
    await prefs.setString(_kUser, jsonEncode(userJson));
    await prefs.setString(_kPermissions, jsonEncode(codes));
    await prefs.setString(
        _kDepartements, jsonEncode(deps.map((d) => {
              'id': d.id,
              'sigle': d.sigle,
              'nom': d.nom,
            }).toList()));

    return LoginResult(
      token: token,
      user: user,
      permissionCodes: codes,
      departements: deps,
      module: module,
    );
  }

  Future<MonUtilisateur> me() async {
    final raw = await _api.get('/profil/mon-profil');
    return MonUtilisateur.fromJson(parseObject(raw));
  }

  Future<void> logout() async {
    try {
      await _api.post('/logout');
    } finally {
      await _api.clearToken();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kModule);
      await prefs.remove(_kUser);
      await prefs.remove(_kPermissions);
      await prefs.remove(_kDepartements);
    }
  }

  Future<String> module() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kModule) ?? 'ad';
  }

  Future<void> setModule(String module) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kModule, module);
  }
}
