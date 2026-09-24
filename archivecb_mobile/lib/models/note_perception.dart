import '../utils/json_utils.dart';
import 'archivage.dart';
import 'auth.dart';

/// Assujetti (NP).
class Assujetti {
  final int id;
  final String? numeroNif;
  final String nomRaisonSociale;
  final String? bp;
  final String? telephone;
  final String? email;
  final int? statut;
  final String? createdAt;

  const Assujetti({
    required this.id,
    this.numeroNif,
    required this.nomRaisonSociale,
    this.bp,
    this.telephone,
    this.email,
    this.statut,
    this.createdAt,
  });

  factory Assujetti.fromJson(Map<String, dynamic> json) => Assujetti(
        id: asInt(json['id']) ?? 0,
        numeroNif: asString(json['numero_nif']),
        nomRaisonSociale: asStringOr(json['nom_raison_sociale']),
        bp: asString(json['bp']),
        telephone: asString(json['telephone']),
        email: asString(json['email']),
        statut: asInt(json['statut']),
        createdAt: asString(json['created_at']),
      );

  Map<String, dynamic> toJson() => {
        if (numeroNif != null && numeroNif!.isNotEmpty)
          'numero_nif': numeroNif,
        'nom_raison_sociale': nomRaisonSociale,
        if (bp != null && bp!.isNotEmpty) 'bp': bp,
        if (telephone != null && telephone!.isNotEmpty)
          'telephone': telephone,
        if (email != null && email!.isNotEmpty) 'email': email,
      };
}

/// Article budgétaire (NP).
class ArticleBudgetaire {
  final int id;
  final String articleBudgetaire;
  final String nom;
  final int? statut;
  final String? createdAt;

  const ArticleBudgetaire({
    required this.id,
    this.articleBudgetaire = '',
    this.nom = '',
    this.statut,
    this.createdAt,
  });

  factory ArticleBudgetaire.fromJson(Map<String, dynamic> json) =>
      ArticleBudgetaire(
        id: asInt(json['id']) ?? 0,
        articleBudgetaire: asStringOr(json['article_budgetaire']),
        nom: asStringOr(json['nom']),
        statut: asInt(json['statut']),
        createdAt: asString(json['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'article_budgetaire': articleBudgetaire,
        'nom': nom,
      };
}

/// Note de perception (NP).
class NotePerception {
  final int id;
  final bool statut;
  final int idClasseur;
  final int idMinistere;
  final int idCentreOrdonnancement;
  final int idAssujetti;
  final int idEmplacement;
  final int? idUser;
  final String? numeroArticle;
  final String numeroSerie;
  final String? dateOrdonnancement;
  final String? dateEnregistrement;
  final Classeur? classeur;
  final CentreOrdonnancement? centre;
  final Assujetti? assujetti;
  final Emplacement? emplacement;
  final MonUtilisateur? utilisateur;
  final ArticleBudgetaire? articlebudgetaire;
  final String? createdAt;

  const NotePerception({
    required this.id,
    this.statut = true,
    this.idClasseur = 0,
    this.idMinistere = 0,
    this.idCentreOrdonnancement = 0,
    this.idAssujetti = 0,
    this.idEmplacement = 0,
    this.idUser,
    this.numeroArticle,
    this.numeroSerie = '',
    this.dateOrdonnancement,
    this.dateEnregistrement,
    this.classeur,
    this.centre,
    this.assujetti,
    this.emplacement,
    this.utilisateur,
    this.articlebudgetaire,
    this.createdAt,
  });

  factory NotePerception.fromJson(Map<String, dynamic> json) => NotePerception(
        id: asInt(json['id']) ?? 0,
        statut: asBool(json['statut'], true),
        idClasseur: asInt(json['id_classeur']) ?? 0,
        idMinistere: asInt(json['id_ministere']) ?? 0,
        idCentreOrdonnancement: asInt(json['id_centre_ordonnancement']) ?? 0,
        idAssujetti: asInt(json['id_assujetti']) ?? 0,
        idEmplacement: asInt(json['id_emplacement']) ?? 0,
        idUser: asInt(json['id_user']),
        numeroArticle: asString(json['numero_article']),
        numeroSerie: asStringOr(json['numero_serie']),
        dateOrdonnancement: asString(json['date_ordonnancement']),
        dateEnregistrement: asString(json['date_enregistrement']),
        classeur: asMap(json['classeur']) != null
            ? Classeur.fromJson(asMap(json['classeur'])!)
            : null,
        centre: asMap(json['centre']) != null
            ? CentreOrdonnancement.fromJson(asMap(json['centre'])!)
            : null,
        assujetti: asMap(json['assujetti']) != null
            ? Assujetti.fromJson(asMap(json['assujetti'])!)
            : null,
        emplacement: asMap(json['emplacement']) != null
            ? Emplacement.fromJson(asMap(json['emplacement'])!)
            : null,
        utilisateur: asMap(json['utilisateur']) != null
            ? MonUtilisateur.fromJson(asMap(json['utilisateur'])!)
            : null,
        articlebudgetaire: asMap(json['articlebudgetaire']) != null
            ? ArticleBudgetaire.fromJson(asMap(json['articlebudgetaire'])!)
            : null,
        createdAt: asString(json['created_at']),
      );

  Map<String, dynamic> toCreateJson() => {
        'id_ministere': idMinistere,
        'id_classeur': idClasseur,
        'id_centre_ordonnancement': idCentreOrdonnancement,
        'id_assujetti': idAssujetti,
        'id_emplacement': idEmplacement,
        if (numeroArticle != null && numeroArticle!.isNotEmpty)
          'numero_article': numeroArticle,
        'numero_serie': numeroSerie,
        'date_ordonnancement': dateOrdonnancement,
        'date_enregistrement': dateEnregistrement,
      };
}

/// Document rattaché à une note de perception.
class DocumentNotePerception {
  final int id;
  final int idNotePerception;
  final int idClasseur;
  final int idMinistere;
  final String nomFichier;
  final String nomNative;
  final String? createdAt;

  const DocumentNotePerception({
    required this.id,
    this.idNotePerception = 0,
    this.idClasseur = 0,
    this.idMinistere = 0,
    this.nomFichier = '',
    this.nomNative = '',
    this.createdAt,
  });

  factory DocumentNotePerception.fromJson(Map<String, dynamic> json) =>
      DocumentNotePerception(
        id: asInt(json['id']) ?? 0,
        idNotePerception: asInt(json['id_note_perception']) ?? 0,
        idClasseur: asInt(json['id_classeur']) ?? 0,
        idMinistere: asInt(json['id_ministere']) ?? 0,
        nomFichier: asStringOr(json['nom_fichier']),
        nomNative: asStringOr(json['nom_native']),
        createdAt: asString(json['created_at']),
      );
}

/// Document numérisé (scanner).
class DocumentScanne {
  final int id;
  final String nomFichier;
  final String? nomOriginal;
  final String cheminFichier;
  final String? dossier;
  final int pages;
  final double tailleMo;
  final String typeDocument;
  final int? idDeclaration;
  final int? idClasseur;
  final String? scannedAt;
  final String? sourceScanner;
  final String? fileUrl;
  final String? createdAt;

  const DocumentScanne({
    required this.id,
    this.nomFichier = '',
    this.nomOriginal,
    this.cheminFichier = '',
    this.dossier,
    this.pages = 0,
    this.tailleMo = 0,
    this.typeDocument = 'pdf',
    this.idDeclaration,
    this.idClasseur,
    this.scannedAt,
    this.sourceScanner,
    this.fileUrl,
    this.createdAt,
  });

  factory DocumentScanne.fromJson(Map<String, dynamic> json) => DocumentScanne(
        id: asInt(json['id']) ?? 0,
        nomFichier: asStringOr(json['nom_fichier']),
        nomOriginal: asString(json['nom_original']),
        cheminFichier: asStringOr(json['chemin_fichier']),
        dossier: asString(json['dossier']),
        pages: asInt(json['pages']) ?? 0,
        tailleMo: asDouble(json['taille_mo']) ?? 0,
        typeDocument: asStringOr(json['type_document'], 'pdf'),
        idDeclaration: asInt(json['id_declaration']),
        idClasseur: asInt(json['id_classeur']),
        scannedAt: asString(json['scanned_at']),
        sourceScanner: asString(json['source_scanner']),
        fileUrl: asString(json['fileUrl'] ?? json['file_url']),
        createdAt: asString(json['created_at']),
      );

  String get tailleLabel => '${tailleMo.toStringAsFixed(2)} Mo';

  String get label => nomOriginal ?? nomFichier;
}

/// Résultat de la recherche avancée OCR des notes de perception.
class NoteSearchResult {
  final int id;
  final int? docId;
  final int? noteId;
  final String nomFichier;
  final String nomNative;
  final String? extrait;
  final String? montext;
  final String? assujettiNom;
  final String? classeurNom;
  final String? dateOrdonnancement;
  final String? createdAt;

  const NoteSearchResult({
    required this.id,
    this.docId,
    this.noteId,
    this.nomFichier = '',
    this.nomNative = '',
    this.extrait,
    this.montext,
    this.assujettiNom,
    this.classeurNom,
    this.dateOrdonnancement,
    this.createdAt,
  });

  factory NoteSearchResult.fromJson(Map<String, dynamic> json) {
    final noteInfo = asMap(json['note_info']);
    return NoteSearchResult(
      id: asInt(json['id']) ?? 0,
      docId: asInt(json['doc_id']),
      noteId: asInt(json['note_id'] ?? noteInfo?['id']),
      nomFichier: asStringOr(json['nom_fichier']),
      nomNative: asStringOr(json['nom_native']),
      extrait: asString(json['extrait']),
      montext: asString(json['montext']),
      assujettiNom: asString(json['assujetti_nom']),
      classeurNom: asString(json['classeur_nom']),
      dateOrdonnancement: asString(
          noteInfo?['date_ordonnancement'] ?? json['date_ordonnancement']),
      createdAt: asString(json['created_at']),
    );
  }

  bool get hasText => montext != null && montext!.trim().isNotEmpty;
  String get label => nomNative.isNotEmpty ? nomNative : nomFichier;
}
