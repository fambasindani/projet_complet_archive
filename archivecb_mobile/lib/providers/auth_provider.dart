import 'package:flutter/foundation.dart';

import '../config/constants.dart';
import '../models/auth.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _restore();
  }

  final _auth = AuthService();
  final _api = ApiClient();

  MonUtilisateur? _user;
  List<Departement> _departements = const [];
  List<String> _permissions = const [];
  String _module = ArchiveModule.ad;
  bool _loading = true;
  bool _authenticated = false;

  MonUtilisateur? get user => _user;
  List<Departement> get departements => _departements;
  List<String> get permissions => _permissions;
  String get module => _module;
  bool get loading => _loading;
  bool get isAuthenticated => _authenticated;
  bool get isNp => _module == ArchiveModule.np;

  String get brand => ArchiveModule.brand(_module);
  String get moduleLabel => ArchiveModule.label(_module);

  Future<void> _restore() async {
    _loading = true;
    notifyListeners();
    try {
      _module = await _auth.module();
      if (await _api.hasToken()) {
        _user = await _auth.me();
        _authenticated = true;
      }
    } catch (_) {
      await _api.clearToken();
      _authenticated = false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<LoginResult> login({
    required String email,
    required String password,
    required String module,
  }) async {
    final result =
        await _auth.login(email: email, password: password, module: module);
    _user = result.user;
    _permissions = result.permissionCodes;
    _departements = result.departements;
    _module = module;
    _authenticated = true;
    notifyListeners();
    return result;
  }

  Future<void> logout() async {
    await _auth.logout();
    _user = null;
    _permissions = const [];
    _departements = const [];
    _authenticated = false;
    notifyListeners();
  }

  Future<void> refresh() async {
    try {
      _user = await _auth.me();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> setModule(String module) async {
    _module = module;
    await _auth.setModule(module);
    notifyListeners();
  }

  bool hasPermission(String code) =>
      _permissions.contains(code) || _permissions.contains('*');

  /// Chaîne `"1,2,3"` des départements de l'utilisateur (filtre multi-tenant).
  String get directionIds =>
      _departements.map((d) => d.id).where((id) => id > 0).join(',');
}
