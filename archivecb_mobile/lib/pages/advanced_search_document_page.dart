import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../models/auth.dart';
import '../services/declaration_services.dart';
import '../services/file_service.dart';
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
import '../widgets/ui/app_toast.dart';

/// Recherche avancée OCR dans les documents (module AD).
class AdvancedSearchDocumentPage extends StatefulWidget {
  const AdvancedSearchDocumentPage({super.key});

  @override
  State<AdvancedSearchDocumentPage> createState() =>
      _AdvancedSearchDocumentPageState();
}

class _AdvancedSearchDocumentPageState
    extends State<AdvancedSearchDocumentPage> {
  final _docService = DocumentDeclarationService();
  final _deptService = DepartementService();
  final _classeurService = ClasseurService();

  final _query = TextEditingController();
  final _idDeclaration = TextEditingController();

  List<Departement> _departements = const [];
  List<Classeur> _classeurs = const [];
  int? _directionId;
  int? _idClasseur;
  DateTime? _dateDebut;
  DateTime? _dateFin;

  List<DocumentDeclaration> _results = const [];
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
    _idDeclaration.dispose();
    super.dispose();
  }

  Future<void> _loadLists() async {
    try {
      final results = await Future.wait([
        _deptService.list(perPage: 200),
        _classeurService.listAll(),
      ]);
      _departements = (results[0] as dynamic).data as List<Departement>;
      _classeurs = results[1] as List<Classeur>;
      if (_departements.isNotEmpty) _directionId = _departements.first.id;
    } catch (_) {
      AppToast.error('Erreur lors du chargement des filtres');
    } finally {
      if (mounted) setState(() => _loadingLists = false);
    }
  }

  Future<void> _search({int page = 1}) async {
    if (_directionId == null) {
      AppToast.info('Sélectionnez une direction');
      return;
    }
    if (_query.text.isEmpty &&
        _idDeclaration.text.isEmpty &&
        _idClasseur == null &&
        _dateDebut == null &&
        _dateFin == null) {
      AppToast.info('Veuillez saisir au moins un critère');
      return;
    }

    setState(() => _searching = true);
    try {
      final filters = <String, dynamic>{
        'query': _query.text.trim(),
        if (_idDeclaration.text.isNotEmpty)
          'id_declaration': num.tryParse(_idDeclaration.text) ?? _idDeclaration.text,
        if (_idClasseur != null) 'id_classeur': _idClasseur,
        if (_dateDebut != null) 'date_debut': Fmt.isoDate(_dateDebut),
        if (_dateFin != null) 'date_fin': Fmt.isoDate(_dateFin),
        'sort_by': 'created_at',
        'sort_order': 'desc',
        'page': page,
        'per_page': 10,
      };
      final res = await _docService.advancedSearch(_directionId!, filters);
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
      _idDeclaration.clear();
      _idClasseur = null;
      _dateDebut = null;
      _dateFin = null;
      _results = const [];
      _searched = false;
    });
  }

  Future<void> _openDoc(DocumentDeclaration doc) async {
    try {
      await FileService().openRemote(
        _docService.downloadUrl(doc.id),
        filename: doc.nomNative.isNotEmpty ? doc.nomNative : doc.nomFichier,
      );
    } catch (e) {
      AppToast.error('Impossible d\'ouvrir le document : $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Recherche avancée OCR')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                AppCard(
                  title: 'Critères de recherche',
                  leading: const Icon(Icons.filter_alt_outlined,
                      size: 18, color: AppColors.primary600),
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
                              label: 'Direction',
                              options: _departements
                                  .map((d) =>
                                      AppOption(value: d.id, label: d.label))
                                  .toList(),
                              value: _directionId,
                              onChanged: (v) =>
                                  setState(() => _directionId = v),
                              icon: Icons.business_outlined,
                            ),
                            const SizedBox(height: 14),
                            AppDropdown<int>(
                              label: 'Classeur',
                              options: _classeurs
                                  .map((c) => AppOption(
                                      value: c.id, label: c.nomClasseur))
                                  .toList(),
                              value: _idClasseur,
                              onChanged: (v) =>
                                  setState(() => _idClasseur = v),
                              icon: Icons.folder_outlined,
                            ),
                            const SizedBox(height: 14),
                            AppInput(
                              label: 'ID Déclaration',
                              hint: 'ex: 123',
                              icon: Icons.tag,
                              controller: _idDeclaration,
                              keyboardType: TextInputType.number,
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: AppDateInput(
                                    label: 'Date début',
                                    value: _dateDebut,
                                    onChanged: (d) =>
                                        setState(() => _dateDebut = d),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: AppDateInput(
                                    label: 'Date fin',
                                    value: _dateFin,
                                    onChanged: (d) =>
                                        setState(() => _dateFin = d),
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
                                  child: AppButton(
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
                  AppDataList<DocumentDeclaration>(
                    items: _results,
                    loading: _searching,
                    emptyMessage: 'Aucun résultat',
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
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
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
                                  doc.nomNative.isNotEmpty
                                      ? doc.nomNative
                                      : doc.nomFichier,
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
                                label: doc.tailleLabel,
                                variant: AppBadgeVariant.neutral,
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
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              AppIconAction(
                                icon: Icons.open_in_new,
                                tooltip: 'Ouvrir le PDF',
                                color: AppColors.primary600,
                                onTap: () => _openDoc(doc),
                              ),
                              AppIconAction(
                                icon: Icons.text_snippet_outlined,
                                tooltip: 'Texte OCR',
                                onTap: () => context.push(
                                    '/ocr-text?id=${doc.id}&nom=${Uri.encodeComponent(doc.nomNative)}'),
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
                    title: 'Recherche avancée',
                    description:
                        'Saisissez un mot-clé OCR, un classeur, une date ou un ID pour lancer la recherche.',
                  ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
