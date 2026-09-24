import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/note_perception.dart';
import '../services/note_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_toast.dart';

class DetailNotePage extends StatefulWidget {
  final int noteId;

  const DetailNotePage({super.key, required this.noteId});

  @override
  State<DetailNotePage> createState() => _DetailNotePageState();
}

class _DetailNotePageState extends State<DetailNotePage> {
  final _service = NotePerceptionService();
  NotePerception? _note;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _note = await _service.getById(widget.noteId);
    } catch (_) {
      AppToast.error('Erreur lors du chargement de la note');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: AppLoading());
    }
    final n = _note;
    if (n == null) {
      return const Scaffold(
        body: AppEmptyState(
          icon: Icons.receipt_long_outlined,
          title: 'Note introuvable',
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.success,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            title: 'Informations de la note',
            leading: const Icon(Icons.receipt_long_outlined,
                size: 18, color: AppColors.success),
            child: Column(
              children: [
                AppDetailRow(label: 'N° série', value: n.numeroSerie),
                AppDetailRow(
                    label: 'N° article', value: n.numeroArticle ?? '-'),
                AppDetailRow(
                    label: 'Assujetti',
                    value: n.assujetti?.nomRaisonSociale ?? '-'),
                AppDetailRow(label: 'Centre', value: n.centre?.nom ?? '-'),
                AppDetailRow(
                    label: 'Classeur', value: n.classeur?.nomClasseur ?? '-'),
                AppDetailRow(
                    label: 'Emplacement',
                    value: n.emplacement?.nomEmplacement ?? '-'),
                AppDetailRow(
                    label: 'Article budgétaire',
                    value: n.articlebudgetaire?.nom ?? '-'),
                AppDetailRow(
                    label: 'Ordonnancement',
                    value: Fmt.date(n.dateOrdonnancement)),
                AppDetailRow(
                    label: 'Enregistrement',
                    value: Fmt.date(n.dateEnregistrement)),
                AppDetailRow(
                    label: 'Saisie par',
                    value: n.utilisateur?.displayName ?? '-'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Vue complète',
            icon: Icons.open_in_full,
            expand: true,
            size: AppButtonSize.lg,
            onPressed: () => context.push('/note-plus?id=${n.id}'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
