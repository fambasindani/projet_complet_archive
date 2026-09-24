import '../utils/json_utils.dart';

/// Statistiques du tableau de bord.
class DashboardStats {
  final int totalDeclarations;
  final int totalNotes;
  final int totalUsers;
  final int totalRoles;
  final int totalDirections;
  final int? activeUsers;
  final int? inactiveUsers;
  final int? blockedUsers;
  final List<StatItem> directions;
  final List<StatItem> roles;
  final List<String> recentActivity;
  final Map<String, dynamic> raw;

  const DashboardStats({
    this.totalDeclarations = 0,
    this.totalNotes = 0,
    this.totalUsers = 0,
    this.totalRoles = 0,
    this.totalDirections = 0,
    this.activeUsers,
    this.inactiveUsers,
    this.blockedUsers,
    this.directions = const [],
    this.roles = const [],
    this.recentActivity = const [],
    this.raw = const {},
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final users = asMap(json['users']);
    return DashboardStats(
      totalDeclarations: asInt(json['total_declarations']) ?? 0,
      totalNotes: asInt(json['total_notes']) ?? 0,
      totalUsers: asInt(json['total_users']) ??
          (users != null ? asInt(users['total']) ?? 0 : 0),
      totalRoles: asInt(json['total_roles']) ?? 0,
      totalDirections: asInt(json['total_directions']) ?? 0,
      activeUsers: users != null ? asInt(users['active']) : null,
      inactiveUsers: users != null ? asInt(users['inactive']) : null,
      blockedUsers: users != null ? asInt(users['blocked']) : null,
      directions: asMapList(json['directions'])
          .map((e) => StatItem(
                label: asStringOr(e['sigle'] ?? e['nom']),
                value: asInt(e['users_count']) ?? 0,
              ))
          .toList(),
      roles: asMapList(json['roles'])
          .map((e) => StatItem(
                label: asStringOr(e['nom']),
                value: asInt(e['users_count']) ?? 0,
              ))
          .toList(),
      raw: json,
    );
  }
}

class StatItem {
  final String label;
  final int value;

  const StatItem({required this.label, required this.value});
}

/// Statistiques publiques (page d'accueil).
class PublicStats {
  final int totalArchives;
  final int archivagesMois;
  final int documentsTraitement;
  final double tauxDisponibilite;
  final int adTotal;
  final int npTotal;

  // Champs legacy éventuels
  final int declarations;
  final int notes;
  final int users;

  const PublicStats({
    this.totalArchives = 0,
    this.archivagesMois = 0,
    this.documentsTraitement = 0,
    this.tauxDisponibilite = 0,
    this.adTotal = 0,
    this.npTotal = 0,
    this.declarations = 0,
    this.notes = 0,
    this.users = 0,
  });

  factory PublicStats.fromJson(Map<String, dynamic> json) {
    final data = asMap(json['data']) ?? json;
    final modules = asMap(data['modules']);
    final ad = modules != null ? asMap(modules['ad']) : null;
    final np = modules != null ? asMap(modules['np']) : null;
    return PublicStats(
      totalArchives: asInt(data['total_archives']) ??
          ((ad != null ? asInt(ad['total']) ?? 0 : 0) +
              (np != null ? asInt(np['total']) ?? 0 : 0)),
      archivagesMois: asInt(data['archivages_mois']) ?? 0,
      documentsTraitement: asInt(data['documents_traitement']) ?? 0,
      tauxDisponibilite: asDouble(data['taux_disponibilite']) ?? 0,
      adTotal: ad != null ? asInt(ad['total']) ?? 0 : 0,
      npTotal: np != null ? asInt(np['total']) ?? 0 : 0,
      declarations: asInt(data['declarations']) ?? 0,
      notes: asInt(data['notes']) ?? 0,
      users: asInt(data['users']) ?? 0,
    );
  }
}

/// Statistiques OCR.
class OcrStats {
  final int totalDocuments;
  final int documentsAvecTexte;
  final int documentsSansTexte;
  final double pourcentageTexte;

  const OcrStats({
    this.totalDocuments = 0,
    this.documentsAvecTexte = 0,
    this.documentsSansTexte = 0,
    this.pourcentageTexte = 0,
  });

  factory OcrStats.fromJson(Map<String, dynamic> json) {
    final data = asMap(json['data']) ?? json;
    return OcrStats(
      totalDocuments: asInt(data['total_documents']) ?? 0,
      documentsAvecTexte: asInt(data['documents_avec_texte']) ?? 0,
      documentsSansTexte: asInt(data['documents_sans_texte']) ?? 0,
      pourcentageTexte: asDouble(data['pourcentage_texte']) ?? 0,
    );
  }
}

/// Entrée de journal / audit.
class LogEntry {
  final int id;
  final int? userId;
  final String action;
  final String tableName;
  final int? recordId;
  final String? description;
  final String? createdAt;

  const LogEntry({
    required this.id,
    this.userId,
    this.action = '',
    this.tableName = '',
    this.recordId,
    this.description,
    this.createdAt,
  });

  factory LogEntry.fromJson(Map<String, dynamic> json) => LogEntry(
        id: asInt(json['id']) ?? 0,
        userId: asInt(json['user_id']),
        action: asStringOr(json['action']),
        tableName: asStringOr(json['table_name']),
        recordId: asInt(json['record_id']),
        description: asString(json['description']),
        createdAt: asString(json['created_at']),
      );
}
