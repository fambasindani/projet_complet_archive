import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/note_perception.dart';
import '../services/api_client.dart';
import '../services/file_service.dart';
import '../services/scan_api_service.dart';
import '../services/scan_service.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_modal.dart';
import '../widgets/ui/app_toast.dart';

/// Numérisation de documents via la caméra du téléphone.
///
/// [cunning_document_scanner] capture une ou plusieurs pages, assemblées en
/// un PDF, puis envoyées au backend (`/scans/upload-multiple`).
class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key});

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> {
  final _scan = ScanService();
  final _api = ScanApiService();

  List<DocumentScanne> _documents = const [];
  bool _loading = true;
  bool _scanning = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _documents = await _api.list();
    } catch (_) {
      _documents = const [];
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _scanAndUpload() async {
    setState(() => _scanning = true);
    try {
      final pdf = await _scan.scanToPdf(
        noOfPages: 20,
        outputName: 'document',
        onContinue: (pages) => showAppConfirm(
          context: context,
          title: '$pages page(s) capturée(s)',
          message: 'Voulez-vous ajouter une autre page ?',
          confirmText: 'Ajouter une page',
          cancelText: 'Terminer',
          variant: ConfirmVariant.info,
        ),
      );

      final uploaded = await _api.uploadMultiple([pdf.path]);

      if (uploaded.isNotEmpty) {
        AppToast.success('Document numérisé et envoyé');
      } else {
        AppToast.success('Document numérisé (PDF créé)');
      }
      await _load();
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

  Future<void> _open(DocumentScanne doc) async {
    final url = doc.fileUrl ?? _api.downloadUrl(doc.nomFichier);
    try {
      await FileService().openRemote(url, filename: doc.nomFichier);
    } catch (e) {
      AppToast.error('Impossible d\'ouvrir le PDF : $e');
    }
  }

  Future<void> _delete(DocumentScanne doc) async {
    final ok = await showAppConfirm(
      context: context,
      title: 'Supprimer le document ?',
      message: 'Le document "${doc.label}" sera définitivement supprimé.',
      confirmText: 'Oui, supprimer',
    );
    if (!ok) return;
    try {
      await _api.remove(doc.nomFichier);
      AppToast.success('Document supprimé');
      await _load();
    } catch (_) {
      AppToast.error('Erreur lors de la suppression');
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.primary600,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            child: Column(
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: AppColors.adGradient),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.document_scanner_outlined,
                      color: Colors.white, size: 32),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Scanner des documents',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Photographiez une ou plusieurs pages. Elles seront '
                  'assemblées en un seul fichier PDF puis archivées.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.slate500,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 18),
                AppButton(
                  label: 'Lancer le scan',
                  icon: Icons.camera_alt_outlined,
                  loading: _scanning,
                  expand: true,
                  size: AppButtonSize.lg,
                  onPressed: _scanAndUpload,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Text(
                'Documents numérisés',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate800,
                ),
              ),
              const Spacer(),
              Text(
                '${_documents.length}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.slate500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const AppLoading()
          else if (_documents.isEmpty)
            const AppEmptyState(
              icon: Icons.folder_open_outlined,
              title: 'Aucun document numérisé',
              description: 'Lancez un scan pour commencer.',
            )
          else
            ..._documents.map(_documentTile),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _documentTile(DocumentScanne doc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.dangerBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.picture_as_pdf_outlined,
              color: AppColors.danger, size: 22),
        ),
        title: Text(
          doc.label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
            color: AppColors.slate800,
          ),
        ),
        subtitle: Text(
          '${doc.pages} page(s) · ${doc.tailleLabel}',
          style: const TextStyle(fontSize: 11.5, color: AppColors.slate500),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.open_in_new,
                  size: 18, color: AppColors.primary600),
              onPressed: () => _open(doc),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline,
                  size: 18, color: AppColors.danger),
              onPressed: () => _delete(doc),
            ),
          ],
        ),
      ),
    );
  }
}
