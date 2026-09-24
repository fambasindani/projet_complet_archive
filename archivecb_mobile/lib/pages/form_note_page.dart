import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../models/note_perception.dart';
import '../services/api_client.dart';
import '../services/note_services.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_date_input.dart';
import '../widgets/ui/app_dropdown.dart';
import '../widgets/ui/app_input.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_search_dropdown.dart';
import '../widgets/ui/app_toast.dart';

/// Formulaire de note de perception (NP).
class FormNotePage extends StatefulWidget {
  final int? noteId;

  const FormNotePage({super.key, this.noteId});

  @override
  State<FormNotePage> createState() => _FormNotePageState();
}

class _FormNotePageState extends State<FormNotePage> {
  final _noteService = NotePerceptionService();
  final _articleService = ArticleService();
  final _classeurService = ClasseurService();
  final _centreService = CentreService();
  final _empService = EmplacementService();
  final _assujettiService = AssujettiService();

  final _numeroSerie = TextEditingController();
  final _numeroArticle = TextEditingController();

  List<ArticleBudgetaire> _articles = const [];
  List<Classeur> _classeurs = const [];
  List<CentreOrdonnancement> _centres = const [];
  List<Emplacement> _emplacements = const [];
  List<Assujetti> _assujettis = const [];

  int? _idArticle;
  int? _idClasseur;
  int? _idCentre;
  int? _idEmplacement;
  int? _idAssujetti;

  DateTime? _dateOrdonnancement;
  DateTime? _dateEnregistrement;

  bool _loading = true;
  bool _saving = false;
  String? _error;

  bool get _isEdit => (widget.noteId ?? 0) > 0;

  @override
  void initState() {
    super.initState();
    _dateOrdonnancement = DateTime.now();
    _dateEnregistrement = DateTime.now();
    _load();
  }

  @override
  void dispose() {
    _numeroSerie.dispose();
    _numeroArticle.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _articleService.listAll(),
        _classeurService.listAll(),
        _centreService.listAll(),
        _empService.listAll(),
        _assujettiService.list(perPage: 500),
      ]);
      _articles = results[0] as List<ArticleBudgetaire>;
      _classeurs = results[1] as List<Classeur>;
      _centres = results[2] as List<CentreOrdonnancement>;
      _emplacements = results[3] as List<Emplacement>;
      _assujettis = (results[4] as dynamic).data as List<Assujetti>;

      if (_isEdit) {
        final note = await _noteService.getById(widget.noteId!);
        _numeroSerie.text = note.numeroSerie;
        _numeroArticle.text = note.numeroArticle ?? '';
        _idArticle = note.articlebudgetaire?.id;
        _idClasseur = note.idClasseur;
        _idCentre = note.idCentreOrdonnancement;
        _idEmplacement = note.idEmplacement;
        _idAssujetti = note.idAssujetti;
        _dateOrdonnancement =
            Fmt.parse(note.dateOrdonnancement) ?? DateTime.now();
        _dateEnregistrement =
            Fmt.parse(note.dateEnregistrement) ?? DateTime.now();
      }
    } catch (_) {
      setState(() => _error = 'Erreur lors du chargement des références');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _error = null);
    if (_numeroSerie.text.trim().isEmpty) {
      setState(() => _error = 'Le numéro de série est requis');
      return;
    }
    if (_idCentre == null || _idAssujetti == null || _idClasseur == null) {
      setState(() => _error = 'Centre, assujetti et classeur sont requis');
      return;
    }

    CentreOrdonnancement? centre;
    for (final c in _centres) {
      if (c.id == _idCentre) centre = c;
    }

    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'id_ministere': centre?.idMinistere ?? 0,
        'id_classeur': _idClasseur,
        'id_centre_ordonnancement': _idCentre,
        'id_assujetti': _idAssujetti,
        'id_emplacement': _idEmplacement,
        'numero_serie': _numeroSerie.text.trim(),
        if (_numeroArticle.text.trim().isNotEmpty)
          'numero_article': _numeroArticle.text.trim(),
        'date_ordonnancement': Fmt.isoDate(_dateOrdonnancement),
        'date_enregistrement': Fmt.isoDate(_dateEnregistrement),
      };

      if (_isEdit) {
        await _noteService.update(widget.noteId!, payload);
      } else {
        await _noteService.create(payload);
      }
      AppToast.success(_isEdit ? 'Note modifiée' : 'Note créée');
      if (mounted) context.go('/note-perception');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Erreur lors de l\'enregistrement');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: AppLoading());
    }
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(_isEdit ? 'Modifier la note' : 'Nouvelle note de perception'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(_error!,
                  style: const TextStyle(
                      fontSize: 12.5, color: Color(0xFFB91C1C))),
            ),
            const SizedBox(height: 14),
          ],
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppFormSection(
                  title: 'Identification',
                  icon: Icons.confirmation_number_outlined,
                  children: [
                    AppInput(
                      label: 'Numéro de série *',
                      hint: 'Ex: NP-2026-0001',
                      icon: Icons.confirmation_number_outlined,
                      controller: _numeroSerie,
                    ),
                    const SizedBox(height: 14),
                    AppInput(
                      label: 'Numéro d\'article',
                      icon: Icons.tag,
                      controller: _numeroArticle,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                AppFormSection(
                  title: 'Traitement',
                  icon: Icons.account_tree_outlined,
                  children: [
                    AppDropdown<int>(
                      label: 'Centre d\'ordonnancement *',
                      options: _centres
                          .map((c) => AppOption(value: c.id, label: c.nom))
                          .toList(),
                      value: _idCentre,
                      onChanged: (v) => setState(() => _idCentre = v),
                      icon: Icons.home_work_outlined,
                    ),
                    const SizedBox(height: 14),
                    AppSearchDropdown<int>(
                      label: 'Assujetti *',
                      options: _assujettis
                          .map((a) => AppOption(
                              value: a.id, label: a.nomRaisonSociale))
                          .toList(),
                      value: _idAssujetti,
                      onChanged: (v) => setState(() => _idAssujetti = v),
                      icon: Icons.person_outline,
                    ),
                    const SizedBox(height: 14),
                    AppDropdown<int>(
                      label: 'Classeur *',
                      options: _classeurs
                          .map((c) =>
                              AppOption(value: c.id, label: c.nomClasseur))
                          .toList(),
                      value: _idClasseur,
                      onChanged: (v) => setState(() => _idClasseur = v),
                      icon: Icons.folder_outlined,
                    ),
                    const SizedBox(height: 14),
                    AppDropdown<int>(
                      label: 'Emplacement',
                      options: _emplacements
                          .map((e) =>
                              AppOption(value: e.id, label: e.nomEmplacement))
                          .toList(),
                      value: _idEmplacement,
                      onChanged: (v) => setState(() => _idEmplacement = v),
                      icon: Icons.place_outlined,
                    ),
                    const SizedBox(height: 14),
                    AppSearchDropdown<int>(
                      label: 'Article budgétaire',
                      options: _articles
                          .map((a) => AppOption(
                                value: a.id,
                                label: '${a.articleBudgetaire} - ${a.nom}',
                              ))
                          .toList(),
                      value: _idArticle,
                      onChanged: (v) => setState(() => _idArticle = v),
                      icon: Icons.description_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                AppFormSection(
                  title: 'Dates',
                  icon: Icons.event_outlined,
                  children: [
                    AppDateInput(
                      label: 'Date d\'ordonnancement',
                      value: _dateOrdonnancement,
                      onChanged: (d) => setState(() => _dateOrdonnancement = d),
                    ),
                    const SizedBox(height: 14),
                    AppDateInput(
                      label: 'Date d\'enregistrement',
                      value: _dateEnregistrement,
                      onChanged: (d) => setState(() => _dateEnregistrement = d),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Enregistrer',
            icon: Icons.save_outlined,
            loading: _saving,
            expand: true,
            size: AppButtonSize.lg,
            onPressed: _save,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
