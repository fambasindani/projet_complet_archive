import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../models/note_perception.dart';
import '../services/file_service.dart';
import '../services/note_services.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_data_list.dart';
import '../widgets/ui/app_date_input.dart';
import '../widgets/ui/app_dropdown.dart';
import '../widgets/ui/app_input.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_search_dropdown.dart';
import '../widgets/ui/app_toast.dart';

/// Recherche avancée OCR dans les notes de perception (module NP).
class AdvancedSearchNotePage extends StatefulWidget {
  const AdvancedSearchNotePage({super.key});

  @override
  State<AdvancedSearchNotePage> createState() =>
      _AdvancedSearchNotePageState();
}

class _AdvancedSearchNotePageState extends State<AdvancedSearchNotePage> {
  final _service = NotePerceptionService();
  final _classeurService = ClasseurService();
  final _assujettiService = AssujettiService();
  final _articleService = ArticleService();

  final _query = TextEditingController();

  List<Classeur> _classeurs = const [];
  List<Assujetti> _assujettis = const [];
  List<ArticleBudgetaire> _articles = const [];
  int? _idClasseur;
  int? _idAssujetti;
  String? _numeroArticle;
  DateTime? _dateDebut;
  DateTime? _dateFin;

  List<NoteSearchResult> _results = const [];
  bool _loadingLists = true;
  bool _searching = false;
  bool _searched = false;
  int _page = 1;
  int _lastPage = 1;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadLists();
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _loadLists() async {
    try {
      final results = await Future.wait([
        _classeurService.listAll(),
        _assujettiService.list(perPage: 500),
        _articleService.listAll(),
      ]);
      _classeurs = results[0] as List<Classeur>;
      _assujettis = (results[1] as dynamic).data as List<Assujetti>;
      _articles = results[2] as List<ArticleBudgetaire>;
    } catch (_) {
      AppToast.error('Erreur lors du chargement des filtres');
    } finally {
      if (mounted) setState(() => _loadingLists = false);
    }
  }

  Future<void> _search({int page = 1}) async {
    if (_query.text.isEmpty &&
        _idClasseur == null &&
        _idAssujetti == null &&
        (_numeroArticle == null || _numeroArticle!.isEmpty) &&
        _dateDebut == null &&
        _dateFin == null) {
      AppToast.info('Veuillez saisir au moins un critère');
      return;
    }

    setState(() => _searching = true);
    try {
      final filters = <String, dynamic>{
        'query': _query.text.trim(),
        if (_idClasseur != null) 'id_classeur': _idClasseur,
        if (_idAssujetti != null) 'id_assujetti': _idAssujetti,
        if (_numeroArticle != null && _numeroArticle!.isNotEmpty)
          'numero_article': _numeroArticle,
        if (_dateDebut != null) 'date_debut': Fmt.isoDate(_dateDebut),
        if (_dateFin != null) 'date_fin': Fmt.isoDate(_dateFin),
        'sort_by': 'date_ordonnancement',
        'sort_order': 'desc',
        'page': page,
        'per_page': 10,
      };
      final res = await _service.advancedSearch(filters);
      setState(() {
        _results = res.data;
        _page = res.currentPage;
        _lastPage = res.lastPage;
        _total = res.total;
        _searched = true;
      });
    } catch (_) {
      AppToast.error('Impossible d\'effectuer la recherche');
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _reset() {
    setState(() {
      _query.clear();
      _idClasseur = null;
      _idAssujetti = null;
      _numeroArticle = null;
      _dateDebut = null;
      _dateFin = null;
      _results = const [];
      _searched = false;
    });
  }

  Future<void> _open(NoteSearchResult doc) async {
    final docId = doc.docId;
    if (docId == null) {
      AppToast.info('Aucun PDF associé');
      return;
    }
    try {
      await FileService().openRemote(
        _service.noteDocumentDownloadUrl(docId),
        filename: doc.label,
      );
    } catch (e) {
      AppToast.error('Impossible d\'ouvrir le document : $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Recherche avancée — Notes')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            title: 'Critères de recherche',
            leading: const Icon(Icons.filter_alt_outlined,
                size: 18, color: AppColors.success),
            child: _loadingLists
                ? const AppLoading()
                : Column(
                    children: [
                      AppInput(
                        label: 'Texte OCR',
                        hint: 'Mots-clés dans le contenu...',
                        icon: Icons.search,
                        controller: _query,
                        textInputAction: TextInputAction.search,
                      ),
                      const SizedBox(height: 14),
                      AppDropdown<int>(
                        label: 'Classeur',
                        options: _classeurs
                            .map((c) => AppOption(
                                value: c.id, label: c.nomClasseur))
                            .toList(),
                        value: _idClasseur,
                        onChanged: (v) => setState(() => _idClasseur = v),
                        icon: Icons.folder_outlined,
                      ),
                      const SizedBox(height: 14),
                      AppSearchDropdown<int>(
                        label: 'Assujetti',
                        options: _assujettis
                            .map((a) => AppOption(
                                value: a.id, label: a.nomRaisonSociale))
                            .toList(),
                        value: _idAssujetti,
                        onChanged: (v) => setState(() => _idAssujetti = v),
                        icon: Icons.person_outline,
                      ),
                      const SizedBox(height: 14),
                      AppDropdown<String>(
                        label: 'Article budgétaire',
                        options: _articles
                            .map((a) => AppOption(
                                  value: a.articleBudgetaire,
                                  label: a.articleBudgetaire.isNotEmpty
                                      ? '${a.articleBudgetaire} — ${a.nom}'
                                      : a.nom,
                                ))
                            .toList(),
                        value: _numeroArticle,
                        onChanged: (v) => setState(() => _numeroArticle = v),
                        icon: Icons.description_outlined,
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: AppDateInput(
                              label: 'Date début',
                              value: _dateDebut,
                              onChanged: (d) => setState(() => _dateDebut = d),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AppDateInput(
                              label: 'Date fin',
                              value: _dateFin,
                              onChanged: (d) => setState(() => _dateFin = d),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          Expanded(
                            child: AppButton.secondary(
                              label: 'Effacer',
                              icon: Icons.clear,
                              expand: true,
                              onPressed: _searching ? null : _reset,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AppButton.success(
                              label: 'Rechercher',
                              icon: Icons.search,
                              loading: _searching,
                              expand: true,
                              onPressed: () => _search(page: 1),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 16),
          if (_searched)
            AppDataList<NoteSearchResult>(
              items: _results,
              loading: _searching,
              emptyMessage: 'Aucun document trouvé',
              emptyIcon: Icons.search_off,
              pagination: PaginationInfo(
                currentPage: _page,
                lastPage: _lastPage,
                total: _total,
                perPage: 10,
                onPageChange: (p) => _search(page: p),
                onPerPageChange: (_) {},
              ),
              itemBuilder: (context, doc, index) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.picture_as_pdf_outlined,
                            size: 18, color: AppColors.danger),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            doc.label,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              color: AppColors.slate800,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        AppBadge(
                          label: doc.hasText ? 'OCR OK' : 'Sans texte',
                          variant: doc.hasText
                              ? AppBadgeVariant.success
                              : AppBadgeVariant.neutral,
                        ),
                      ],
                    ),
                    if (doc.extrait != null && doc.extrait!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        doc.extrait!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.slate500),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      '${doc.assujettiNom ?? '—'} · ${doc.classeurNom ?? '—'} · ${Fmt.date(doc.dateOrdonnancement)}',
                      style: const TextStyle(
                          fontSize: 11.5, color: AppColors.slate400),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        AppIconAction(
                          icon: Icons.open_in_new,
                          tooltip: 'Ouvrir le PDF',
                          color: AppColors.primary600,
                          onTap: () => _open(doc),
                        ),
                        if (doc.noteId != null)
                          AppIconAction(
                            icon: Icons.receipt_long_outlined,
                            tooltip: 'Voir la note',
                            onTap: () =>
                                context.push('/note-plus?id=${doc.noteId}'),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            )
          else
            const AppEmptyState(
              icon: Icons.search,
              title: 'Recherche avancée NP',
              description:
                  'Filtrez par classeur, assujetti, article, période ou mot-clé OCR.',
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
