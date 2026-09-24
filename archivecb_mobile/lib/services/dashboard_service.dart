import '../models/auth.dart';
import '../models/dashboard.dart';
import 'api_client.dart';
import 'parse.dart';

/// Tableaux de bord (AD + NP) et statistiques publiques.
class DashboardService {
  DashboardService._();
  static final DashboardService instance = DashboardService._();
  factory DashboardService() => instance;
  final _api = ApiClient();

  Future<DashboardStats> statistics() async =>
      DashboardStats.fromJson(parseObject(await _api.get('/dashboard/statistics')));

  Future<Map<String, dynamic>> classifiers() async =>
      parseObject(await _api.get('/dashboard/classifiers'));

  Future<List<Map<String, dynamic>>> recent() async {
    final raw = await _api.get('/dashboard/recent');
    if (raw is List) return raw.whereType<Map<String, dynamic>>().toList();
    final data = parseObject(raw)['data'];
    if (data is List) return data.whereType<Map<String, dynamic>>().toList();
    return const [];
  }

  Future<DashboardStats> noteStatistics() async => DashboardStats.fromJson(
      parseObject(await _api.get('/dashboards/notes/statistics')));

  // Public
  Future<PublicStats> publicStats() async =>
      PublicStats.fromJson(parseObject(await _api.get('/public/stats')));

  Future<PublicStats> publicAdStats() async => PublicStats.fromJson(
      parseObject(await _api.get('/public/module/ad/stats')));

  Future<PublicStats> publicNpStats() async => PublicStats.fromJson(
      parseObject(await _api.get('/public/module/np/stats')));
}

/// Profil de l'utilisateur connecté.
class ProfilService {
  ProfilService._();
  static final ProfilService instance = ProfilService._();
  factory ProfilService() => instance;
  final _api = ApiClient();

  Future<MonUtilisateur> me() async =>
      MonUtilisateur.fromJson(parseObject(await _api.get('/profil/mon-profil')));

  Future<MonUtilisateur> show(int id) async => MonUtilisateur.fromJson(
      parseObject(await _api.get('/profil/afficher/$id')));

  Future<void> update(int id, Map<String, dynamic> data) =>
      _api.put('/profil/modifier/$id', data: data);

  String avatarUrl(String filename) =>
      '${_api.baseUrl}/profil/avatar/${Uri.encodeComponent(filename)}';
}
