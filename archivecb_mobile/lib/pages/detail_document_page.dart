import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../services/declaration_services.dart';
import '../services/file_service.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_data_list.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_modal.dart';
import '../widgets/ui/app_toast.dart';

class DetailDocumentPage extends StatefulWidget {
  final int declarationId;

  const DetailDocumentPage({super.key, required this.declarationId});

  @override
  State<DetailDocumentPage> createState() => _DetailDocumentPageState();
}

class _DetailDocumentPageState extends State<DetailDocumentPage> {
  final _service = DeclarationService();
  final _docService = DocumentDeclarationService();

  Map<String, dynamic>? _detail;
  List<DocumentDeclaration> _documents = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _service.detail(widget.declarationId),
        _docService.getByDeclaration(widget.declarationId),
      ]);
      _detail = results[0] as Map<String, dynamic>;
      _documents = results[1] as List<DocumentDeclaration>;
    } catch (_) {
      AppToast.error('Erreur lors du chargement du détail');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _v(String key) {
    final d = _detail;
    if (d == null) return '-';
    final value = d[key];
    if (value == null || '$value'.isEmpty) return '-';
    return '$value';
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

  Future<void> _deleteDoc(DocumentDeclaration doc) async {
    final ok = await showAppConfirm(
      context: context,
      title: 'Supprimer le document ?',
      message: 'Le fichier "${doc.nomNative}" sera définitivement supprimé.',
      confirmText: 'Oui, supprimer',
    );
    if (!ok) return;
    try {
      await _docService.deleteDocument(doc.id);
      AppToast.success('Document supprimé');
      await _load();
    } catch (_) {
      AppToast.error('Erreur lors de la suppression');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: AppLoading());
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.primary600,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            title: 'Informations de la déclaration',
            leading: const Icon(Icons.description_outlined,
                size: 18, color: AppColors.primary600),
            child: Column(
              children: [
                AppDetailRow(label: 'Intitulé', value: _v('intitule')),
                AppDetailRow(label: 'N° déclaration', value: _v('num_declaration')),
                AppDetailRow(label: 'Référence', value: _v('num_reference')),
                AppDetailRow(label: 'Mot-clé', value: _v('mot_cle')),
                AppDetailRow(label: 'Direction', value: _v('nom_direction')),
                AppDetailRow(label: 'Emplacement', value: _v('nom_emplacement')),
                AppDetailRow(
                    label: 'Créé le', value: Fmt.dateTime(_v('created_at'))),
                AppDetailRow(
                    label: 'Enregistré le',
                    value: Fmt.dateTime(_v('date_enregistrement'))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            title: 'Documents (${_documents.length})',
            leading: const Icon(Icons.attach_file,
                size: 18, color: AppColors.primary600),
            child: _documents.isEmpty
                ? const AppEmptyState(
                    icon: Icons.file_copy_outlined,
                    title: 'Aucun document joint',
                  )
                : Column(
                    children: _documents
                        .map(
                          (doc) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Row(
                              children: [
                                const Icon(Icons.insert_drive_file_outlined,
                                    size: 18, color: AppColors.slate500),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    doc.nomNative.isNotEmpty
                                        ? doc.nomNative
                                        : doc.nomFichier,
                                    style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.slate700),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Text(
                                  doc.tailleLabel,
                                  style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.slate400),
                                ),
                                const SizedBox(width: 8),
                                AppBadge(
                                  label: doc.hasText ? 'OCR' : 'Sans texte',
                                  variant: doc.hasText
                                      ? AppBadgeVariant.success
                                      : AppBadgeVariant.neutral,
                                ),
                                AppActionMenu(
                                  items: [
                                    AppActionMenuItem(
                                      label: 'Ouvrir le PDF',
                                      icon: Icons.open_in_new,
                                      onTap: () => _openDoc(doc),
                                    ),
                                    AppActionMenuItem(
                                      label: 'Texte OCR',
                                      icon: Icons.text_snippet_outlined,
                                      onTap: () => context.push(
                                          '/ocr-text?id=${doc.id}&nom=${Uri.encodeComponent(doc.nomNative)}'),
                                    ),
                                    AppActionMenuItem(
                                      label: 'Supprimer',
                                      icon: Icons.delete_outline,
                                      danger: true,
                                      onTap: () => _deleteDoc(doc),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                  ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
