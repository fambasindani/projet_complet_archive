import '../utils/json_utils.dart';

/// Permission (RBAC).
class Permission {
  final int id;
  final String code;
  final String? description;

  const Permission({required this.id, required this.code, this.description});

  factory Permission.fromJson(Map<String, dynamic> json) => Permission(
        id: asInt(json['id']) ?? 0,
        code: asStringOr(json['code']),
        description: asString(json['description']),
      );
}

/// Rôle.
class Role {
  final int id;
  final String nom;
  final String? description;
  final int permissionsCount;
  final int usersCount;
  final List<Permission> permissions;

  const Role({
    required this.id,
    required this.nom,
    this.description,
    this.permissionsCount = 0,
    this.usersCount = 0,
    this.permissions = const [],
  });

  factory Role.fromJson(Map<String, dynamic> json) => Role(
        id: asInt(json['id']) ?? 0,
        nom: asStringOr(json['nom']),
        description: asString(json['description']),
        permissionsCount: asInt(json['permissions_count']) ?? 0,
        usersCount: asInt(json['users_count']) ?? 0,
        permissions: asMapList(json['permissions'])
            .map(Permission.fromJson)
            .toList(),
      );
}

/// Département / direction (multi-tenant).
class Departement {
  final int id;
  final String sigle;
  final String nom;
  final String? datecreation;

  const Departement({
    required this.id,
    this.sigle = '',
    required this.nom,
    this.datecreation,
  });

  factory Departement.fromJson(Map<String, dynamic> json) => Departement(
        id: asInt(json['id']) ?? 0,
        sigle: asStringOr(json['sigle']),
        nom: asStringOr(json['nom']),
        datecreation: asString(json['datecreation']),
      );

  String get label => sigle.isNotEmpty ? '$sigle - $nom' : nom;
}

/// Utilisateur connecté (authentification ; la gestion reste sur le web).
class MonUtilisateur {
  final int id;
  final String nom;
  final String prenom;
  final String? fullName;
  final String email;
  final String statut;
  final String? avatar;
  final String? avatarUrl;
  final String? datecreation;
  final String? dernierconnection;
  final List<Role> roles;
  final List<Departement> departements;

  const MonUtilisateur({
    required this.id,
    required this.nom,
    this.prenom = '',
    this.fullName,
    required this.email,
    this.statut = 'active',
    this.avatar,
    this.avatarUrl,
    this.datecreation,
    this.dernierconnection,
    this.roles = const [],
    this.departements = const [],
  });

  factory MonUtilisateur.fromJson(Map<String, dynamic> json) => MonUtilisateur(
        id: asInt(json['id']) ?? 0,
        nom: asStringOr(json['nom']),
        prenom: asStringOr(json['prenom']),
        fullName: asString(json['full_name']),
        email: asStringOr(json['email']),
        statut: asStringOr(json['statut'], 'active'),
        avatar: asString(json['avatar']),
        avatarUrl: asString(json['avatar_url']),
        datecreation: asString(json['datecreation']),
        dernierconnection: asString(json['dernierconnection']),
        roles: asMapList(json['roles']).map(Role.fromJson).toList(),
        departements:
            asMapList(json['departements']).map(Departement.fromJson).toList(),
      );

  String get displayName {
    if (fullName != null && fullName!.isNotEmpty) return fullName!;
    final value = '$prenom $nom'.trim();
    return value.isNotEmpty ? value : email;
  }

  String get initials {
    final a = prenom.isNotEmpty ? prenom[0] : '';
    final b = nom.isNotEmpty ? nom[0] : '';
    final res = '$a$b'.toUpperCase();
    return res.isNotEmpty ? res : (email.isNotEmpty ? email[0].toUpperCase() : '?');
  }

  String get roleName => roles.isNotEmpty ? roles.first.nom : 'Utilisateur';

  bool get isActive => statut == 'active';
}

/// Résultat de connexion.
class LoginResult {
  final String token;
  final MonUtilisateur user;
  final List<String> permissionCodes;
  final List<Departement> departements;
  final String module;

  const LoginResult({
    required this.token,
    required this.user,
    required this.permissionCodes,
    required this.departements,
    required this.module,
  });
}
