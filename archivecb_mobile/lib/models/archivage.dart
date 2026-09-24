import '../utils/json_utils.dart';
import 'auth.dart';

/// Classeur (AD).
class Classeur {
  final int id;
  final String nomClasseur;
  final bool statut;
  final String? createdAt;

  const Classeur({
    required this.id,
    required this.nomClasseur,
    this.statut = true,
    this.createdAt,
  });

  factory Classeur.fromJson(Map<String, dynamic> json) => Classeur(
        id: asInt(json['id']) ?? 0,
        nomClasseur: asStringOr(json['nom_classeur']),
        statut: asBool(json['statut'], true),
        createdAt: asString(json['created_at']),
      );

  Map<String, dynamic> toJson() => {'nom_classeur': nomClasseur};
}

/// Emplacement (AD/NP).
class Emplacement {
  final int id;
  final String nomEmplacement;
  final bool statut;
  final String? createdAt;

  const Emplacement({
    required this.id,
    required this.nomEmplacement,
    this.statut = true,
    this.createdAt,
  });

  factory Emplacement.fromJson(Map<String, dynamic> json) => Emplacement(
        id: asInt(json['id']) ?? 0,
        nomEmplacement: asStringOr(json['nom_emplacement']),
        statut: asBool(json['statut'], true),
        createdAt: asString(json['created_at']),
      );

  Map<String, dynamic> toJson() => {'nom_emplacement': nomEmplacement};
}

/// Centre d'ordonnancement (NP).
class CentreOrdonnancement {
  final int id;
  final String nom;
  final int? idMinistere;
  final String? description;
  final String? statut;
  final String? ministereNom;
  final String? createdAt;

  const CentreOrdonnancement({
    required this.id,
    required this.nom,
    this.idMinistere,
    this.description,
    this.statut,
    this.ministereNom,
    this.createdAt,
  });

  factory CentreOrdonnancement.fromJson(Map<String, dynamic> json) {
    final ministere = asMap(json['ministere']);
    return CentreOrdonnancement(
      id: asInt(json['id']) ?? 0,
      nom: asStringOr(json['nom']),
      idMinistere: asInt(json['id_ministere']),
      description: asString(json['description']),
      statut: asString(json['statut']),
      ministereNom: ministere != null ? asString(ministere['nom']) : null,
      createdAt: asString(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() => {
        'nom': nom,
        if (idMinistere != null) 'id_ministere': idMinistere,
        if (description != null && description!.isNotEmpty)
          'description': description,
      };
}

/// Ministère / service d'assiette (NP).
class Ministere {
  final int id;
  final String nom;
  final String? sigle;
  final String? description;
  final String? statut;
  final String? createdAt;

  const Ministere({
    required this.id,
    required this.nom,
    this.sigle,
    this.description,
    this.statut,
    this.createdAt,
  });

  factory Ministere.fromJson(Map<String, dynamic> json) => Ministere(
        id: asInt(json['id']) ?? 0,
        nom: asStringOr(json['nom']),
        sigle: asString(json['sigle']),
        description: asString(json['description']),
        statut: asString(json['statut']),
        createdAt: asString(json['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'nom': nom,
        if (sigle != null && sigle!.isNotEmpty) 'sigle': sigle,
        if (description != null && description!.isNotEmpty)
          'description': description,
      };
}

/// Direction (legacy, table `directions`).
class Direction {
  final int id;
  final String nom;
  final bool statut;
  final String? createdAt;

  const Direction({
    required this.id,
    required this.nom,
    this.statut = true,
    this.createdAt,
  });

  factory Direction.fromJson(Map<String, dynamic> json) {
    final rawStatut = json['statut'];
    return Direction(
      id: asInt(json['id']) ?? 0,
      nom: asStringOr(json['nom']),
      statut: rawStatut == null ? true : asBool(rawStatut, true),
      createdAt: asString(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() => {
        'nom': nom,
        'statut': statut ? 1 : 0,
      };
}

/// Déclaration (AD).
class Declaration {
  final int id;
  final int idDirection;
  final int idEmplacement;
  final int idClasseur;
  final int? idUser;
  final String? dateCreation;
  final String? dateEnregistrement;
  final String intitule;
  final String numReference;
  final String motCle;
  final String numDeclaration;
  final bool statut;
  final Departement? departement;
  final Emplacement? emplacement;
  final Classeur? classeur;
  final MonUtilisateur? utilisateur;
  final String? nomDirection;
  final String? nomEmplacement;
  final String? createdAt;

  const Declaration({
    required this.id,
    this.idDirection = 0,
    this.idEmplacement = 0,
    this.idClasseur = 0,
    this.idUser,
    this.dateCreation,
    this.dateEnregistrement,
    this.intitule = '',
    this.numReference = '',
    this.motCle = '',
    this.numDeclaration = '',
    this.statut = true,
    this.departement,
    this.emplacement,
    this.classeur,
    this.utilisateur,
    this.nomDirection,
    this.nomEmplacement,
    this.createdAt,
  });

  factory Declaration.fromJson(Map<String, dynamic> json) => Declaration(
        id: asInt(json['id']) ?? 0,
        idDirection: asInt(json['id_direction']) ?? 0,
        idEmplacement: asInt(json['id_emplacement']) ?? 0,
        idClasseur: asInt(json['id_classeur']) ?? 0,
        idUser: asInt(json['id_user']),
        dateCreation: asString(json['date_creation']),
        dateEnregistrement: asString(json['date_enregistrement']),
        intitule: asStringOr(json['intitule']),
        numReference: asStringOr(json['num_reference']),
        motCle: asStringOr(json['mot_cle']),
        numDeclaration: asStringOr(json['num_declaration']),
        statut: asBool(json['statut'], true),
        departement: asMap(json['departement']) != null
            ? Departement.fromJson(asMap(json['departement'])!)
            : null,
        emplacement: asMap(json['emplacement']) != null
            ? Emplacement.fromJson(asMap(json['emplacement'])!)
            : null,
        classeur: asMap(json['classeur']) != null
            ? Classeur.fromJson(asMap(json['classeur'])!)
            : null,
        utilisateur: asMap(json['utilisateur']) != null
            ? MonUtilisateur.fromJson(asMap(json['utilisateur'])!)
            : null,
        nomDirection: asString(json['nom_direction']),
        nomEmplacement: asString(json['nom_emplacement']),
        createdAt: asString(json['created_at']),
      );

  String get directionLabel =>
      nomDirection ?? departement?.nom ?? classeur?.nomClasseur ?? '—';

  String get emplacementLabel =>
      nomEmplacement ?? emplacement?.nomEmplacement ?? '—';

  /// Payload de création (id_user forcé côté backend).
  Map<String, dynamic> toCreateJson() => {
        'id_direction': idDirection,
        'id_emplacement': idEmplacement,
        'id_classeur': idClasseur,
        'date_creation': dateCreation,
        'date_enregistrement': dateEnregistrement,
        'intitule': intitule,
        'num_reference': numReference,
        'mot_cle': motCle,
        'num_declaration': numDeclaration,
      };
}

/// Document rattaché à une déclaration (AD) ou une note (NP).
class DocumentDeclaration {
  final int id;
  final int idDeclaration;
  final int idClasseur;
  final String nomFichier;
  final String nomNative;
  final int taille;
  final String? montext;
  final int? directionId;
  final String? directionNom;
  final String? classeurNom;
  final String? extrait;
  final String? createdAt;

  const DocumentDeclaration({
    required this.id,
    this.idDeclaration = 0,
    this.idClasseur = 0,
    this.nomFichier = '',
    this.nomNative = '',
    this.taille = 0,
    this.montext,
    this.directionId,
    this.directionNom,
    this.classeurNom,
    this.extrait,
    this.createdAt,
  });

  factory DocumentDeclaration.fromJson(Map<String, dynamic> json) =>
      DocumentDeclaration(
        id: asInt(json['id']) ?? 0,
        idDeclaration: asInt(json['id_declaration']) ?? 0,
        idClasseur: asInt(json['id_classeur']) ?? 0,
        nomFichier: asStringOr(json['nom_fichier']),
        nomNative: asStringOr(json['nom_native']),
        taille: asInt(json['taille']) ?? 0,
        montext: asString(json['montext']),
        directionId: asInt(json['direction_id']),
        directionNom: asString(json['direction_nom']),
        classeurNom: asString(json['classeur_nom']),
        extrait: asString(json['extrait']),
        createdAt: asString(json['created_at']),
      );

  String get tailleLabel {
    if (taille < 1024) return '$taille o';
    if (taille < 1024 * 1024) return '${(taille / 1024).toStringAsFixed(1)} Ko';
    return '${(taille / (1024 * 1024)).toStringAsFixed(2)} Mo';
  }

  bool get hasText => montext != null && montext!.trim().isNotEmpty;
}
