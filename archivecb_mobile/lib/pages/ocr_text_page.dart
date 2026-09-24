import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../config/constants.dart';
import '../services/declaration_services.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_toast.dart';

/// Consultation / édition du texte OCR d'un document (backend).
class OcrTextPage extends StatefulWidget {
  final int documentId;
  final String nom;

  const OcrTextPage({super.key, required this.documentId, this.nom = ''});

  @override
  State<OcrTextPage> createState() => _OcrTextPageState();
}

class _OcrTextPageState extends State<OcrTextPage> {
  final _service = DocumentDeclarationService();
  final _controller = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _original;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final text = await _service.getText(widget.documentId);
      _original = text ?? '';
      _controller.text = text ?? '';
    } catch (_) {
      AppToast.error('Impossible de charger le texte OCR');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _service.updateText(widget.documentId, _controller.text);
      _original = _controller.text;
      AppToast.success('Texte OCR mis à jour');
    } catch (_) {
      AppToast.error('Erreur lors de l\'enregistrement');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  bool get _dirty => _original != _controller.text;

  int get _words => _controller.text
      .split(RegExp(r'\s+'))
      .where((w) => w.isNotEmpty)
      .length;

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: AppLoading());

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Texte extrait (OCR)'),
        actions: [
          IconButton(
            tooltip: 'Copier',
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: _controller.text));
              AppToast.success('Texte copié');
            },
            icon: const Icon(Icons.copy_all_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.nom.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                widget.nom,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate600,
                ),
              ),
            ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _controller,
                  maxLines: null,
                  minLines: 12,
                  onChanged: (_) => setState(() {}),
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 13,
                    height: 1.5,
                  ),
                  decoration: const InputDecoration(
                    hintText: 'Aucun texte extrait',
                    filled: true,
                    fillColor: AppColors.slate50,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_controller.text.length} caractères · $_words mots',
                      style: const TextStyle(
                          fontSize: 11.5, color: AppColors.slate500),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppButton(
            label: 'Enregistrer le texte',
            icon: Icons.save_outlined,
            loading: _saving,
            expand: true,
            enabled: _dirty,
            onPressed: _save,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
