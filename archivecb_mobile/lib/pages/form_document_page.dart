import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../models/auth.dart';
import '../services/api_client.dart';
import '../services/declaration_services.dart';
import '../services/reference_services.dart';
import '../services/scan_service.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_date_input.dart';
import '../widgets/ui/app_dropdown.dart';
import '../widgets/ui/app_input.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_modal.dart';
import '../widgets/ui/app_search_dropdown.dart';
import '../widgets/ui/app_textarea.dart';
import '../widgets/ui/app_toast.dart';

/// Formulaire de déclaration (AD) + scan de documents.
class FormDocumentPage extends StatefulWidget {
  final int? declarationId;

  const FormDocumentPage({super.key, this.declarationId});

  @override
  State<FormDocumentPage> createState() => _FormDocumentPageState();
}

class _FormDocumentPageState extends State<FormDocumentPage> {
  final _declService = DeclarationService();
  final _docService = DocumentDeclarationService();
  final _deptService = DepartementService();
  final _empService = EmplacementService();
  final _classeurService = ClasseurService();
  final _scan = ScanService();

  final _intitule = TextEditingController();
  final _numReference = TextEditingController();
  final _numDeclaration = TextEditingController();
  final _motCle = TextEditingController();
  final _observations = TextEditingController();

  List<Departement> _departements = const [];
  List<Emplacement> _emplacements = const [];
  List<Classeur> _classeurs = const [];

  int? _idDirection;
  int? _idEmplacement;
  int? _idClasseur;
  DateTime? _dateCreation;
  DateTime? _dateEnregistrement;

  bool _loading = true;
  bool _saving = false;
  bool _scanning = false;
  int? _savedId;
  String? _error;

  bool get _isEdit => (widget.declarationId ?? 0) > 0;

  @override
  void initState() {
    super.initState();
    _savedId = _isEdit ? widget.declarationId : null;
    _dateCreation = DateTime.now();
    _dateEnregistrement = DateTime.now();
    _load();
  }

  @override
  void dispose() {
    _intitule.dispose();
    _numReference.dispose();
    _numDeclaration.dispose();
    _motCle.dispose();
    _observations.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _deptService.list(perPage: 200),
        _empService.listAll(),
        _classeurService.listAll(),
      ]);
      _departements = (results[0] as dynamic).data as List<Departement>;
      _emplacements = results[1] as List<Emplacement>;
      _classeurs = results[2] as List<Classeur>;

      if (_isEdit) {
        final obj = await _declService.detail(widget.declarationId!);
        final full = await _declService.getById(widget.declarationId!);
        _intitule.text = full.intitule;
        _numReference.text = full.numReference;
        _numDeclaration.text = full.numDeclaration;
        _motCle.text = full.motCle;
        _idDirection = full.idDirection == 0 ? null : full.idDirection;
        _idEmplacement = full.idEmplacement == 0 ? null : full.idEmplacement;
        _idClasseur = full.idClasseur == 0 ? null : full.idClasseur;
        _dateCreation = Fmt.parse(full.dateCreation) ?? DateTime.now();
        _dateEnregistrement =
            Fmt.parse(full.dateEnregistrement) ?? DateTime.now();
        obj; // détail chargé pour cohérence avec le backend
      }
    } catch (e) {
      setState(() => _error = 'Erreur lors du chargement des références');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save({bool thenScan = false}) async {
    setState(() => _error = null);
    if (_intitule.text.trim().isEmpty) {
      setState(() => _error = 'L\'intitulé est requis');
      return;
    }
    if (_idClasseur == null) {
      setState(() => _error = 'Le classeur est requis');
      return;
    }

    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'id_direction': _idDirection,
        'id_emplacement': _idEmplacement,
        'id_classeur': _idClasseur,
        'date_creation': Fmt.isoDate(_dateCreation),
        'date_enregistrement': Fmt.isoDate(_dateEnregistrement),
        'intitule': _intitule.text.trim(),
        'num_reference': _numReference.text.trim(),
        'mot_cle': _motCle.text.trim(),
        'num_declaration': _numDeclaration.text.trim(),
      };

      if (_isEdit) {
        await _declService.update(_savedId!, payload);
      } else {
        final id = await _declService.create(payload);
        _savedId = id;
      }
      AppToast.success(_isEdit ? 'Déclaration modifiée' : 'Déclaration créée');

      if (thenScan && _savedId != null) {
        await _scanAndAttach();
      }
      if (mounted) context.go('/document');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Erreur lors de l\'enregistrement');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _scanAndAttach() async {
    if (_savedId == null || _idClasseur == null) return;
    setState(() => _scanning = true);
    try {
      final pdf = await _scan.scanToPdf(
        outputName: 'declaration_$_savedId',
        onContinue: (pages) => showAppConfirm(
          context: context,
          title: '$pages page(s) capturée(s)',
          message: 'Voulez-vous ajouter une autre page ?',
          confirmText: 'Ajouter une page',
          cancelText: 'Terminer',
          variant: ConfirmVariant.info,
        ),
      );
      await _docService.uploadMultiple(
        declarationId: _savedId!,
        classeurId: _idClasseur!,
        filePaths: [pdf.path],
      );
      AppToast.success('Document numérisé et joint');
    } on ScanException catch (e) {
      AppToast.warning(e.message);
    } on ApiException catch (e) {
      AppToast.error('Envoi impossible : ${e.message}');
    } catch (e) {
      AppToast.error('Erreur : $e');
    } finally {
      if (mounted) setState(() => _scanning = false);
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
        title: Text(_isEdit ? 'Modifier la déclaration' : 'Nouvelle déclaration'),
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
              child: Text(
                _error!,
                style: const TextStyle(fontSize: 12.5, color: Color(0xFFB91C1C)),
              ),
            ),
            const SizedBox(height: 14),
          ],
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppFormSection(
                  title: 'Document',
                  icon: Icons.description_outlined,
                  children: [
                    AppInput(
                      label: 'Intitulé *',
                      hint: 'Objet du document',
                      icon: Icons.title,
                      controller: _intitule,
                    ),
                    const SizedBox(height: 14),
                    AppInput(
                      label: 'Numéro de déclaration',
                      icon: Icons.tag,
                      controller: _numDeclaration,
                    ),
                    const SizedBox(height: 14),
                    AppInput(
                      label: 'Numéro de référence',
                      icon: Icons.link,
                      controller: _numReference,
                    ),
                    const SizedBox(height: 14),
                    AppInput(
                      label: 'Mot-clé',
                      icon: Icons.key_outlined,
                      controller: _motCle,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                AppFormSection(
                  title: 'Classement',
                  icon: Icons.account_tree_outlined,
                  children: [
                    AppSearchDropdown<int>(
                      label: 'Direction',
                      options: _departements
                          .map((d) => AppOption(value: d.id, label: d.label))
                          .toList(),
                      value: _idDirection,
                      onChanged: (v) => setState(() => _idDirection = v),
                      icon: Icons.business_outlined,
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
                  ],
                ),
                const SizedBox(height: 20),
                AppFormSection(
                  title: 'Dates',
                  icon: Icons.event_outlined,
                  children: [
                    AppDateInput(
                      label: 'Date de création',
                      value: _dateCreation,
                      onChanged: (d) => setState(() => _dateCreation = d),
                    ),
                    const SizedBox(height: 14),
                    AppDateInput(
                      label: 'Date d\'enregistrement',
                      value: _dateEnregistrement,
                      onChanged: (d) => setState(() => _dateEnregistrement = d),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                AppTextarea(
                  label: 'Observations',
                  controller: _observations,
                  hint: 'Remarques éventuelles...',
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Enregistrer',
            icon: Icons.save_outlined,
            loading: _saving && !_scanning,
            expand: true,
            size: AppButtonSize.lg,
            onPressed: () => _save(),
          ),
          const SizedBox(height: 12),
          AppButton.secondary(
            label: _scanning
                ? 'Numérisation en cours...'
                : 'Enregistrer et scanner',
            icon: Icons.document_scanner_outlined,
            loading: _scanning,
            expand: true,
            size: AppButtonSize.lg,
            onPressed: _scanning ? null : () => _save(thenScan: true),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
