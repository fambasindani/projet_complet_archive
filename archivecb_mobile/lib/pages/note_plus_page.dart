import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/note_perception.dart';
import '../services/note_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_toast.dart';

/// Vue enrichie d'une note de perception (équivalent NotePlusScreen).
class NotePlusPage extends StatefulWidget {
  final int noteId;

  const NotePlusPage({super.key, required this.noteId});

  @override
  State<NotePlusPage> createState() => _NotePlusPageState();
}

class _NotePlusPageState extends State<NotePlusPage> {
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
    if (_loading) return const Scaffold(body: AppLoading());
    final n = _note;
    if (n == null) {
      return const Scaffold(
        body: AppEmptyState(
          icon: Icons.receipt_long_outlined,
          title: 'Aucune note sélectionnée',
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Détails de la note')),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.success,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Carte résumé
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E3A8A), Color(0xFF3730A3)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.receipt_long_outlined,
                        color: AppColors.slate900, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            AppBadge(
                              label: n.numeroSerie,
                              variant: AppBadgeVariant.info,
                              icon: Icons.tag,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          n.assujetti?.nomRaisonSociale ?? 'Assujetti',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'NIF: ${n.assujetti?.numeroNif ?? '—'} · Article ${n.numeroArticle ?? 'N/A'}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.75),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              title: 'Assujetti',
              leading: const Icon(Icons.person_outline,
                  size: 18, color: AppColors.primary600),
              child: Column(
                children: [
                  AppDetailRow(
                      label: 'Nom / Raison sociale',
                      value: n.assujetti?.nomRaisonSociale ?? '-'),
                  AppDetailRow(
                      label: 'NIF', value: n.assujetti?.numeroNif ?? '-'),
                  AppDetailRow(label: 'BP', value: n.assujetti?.bp ?? '-'),
                  AppDetailRow(
                      label: 'Téléphone', value: n.assujetti?.telephone ?? '-'),
                  AppDetailRow(label: 'Email', value: n.assujetti?.email ?? '-'),
                ],
              ),
            ),
            const SizedBox(height: 14),
            AppCard(
              title: 'Classement',
              leading: const Icon(Icons.folder_outlined,
                  size: 18, color: AppColors.primary600),
              child: Column(
                children: [
                  AppDetailRow(
                      label: 'Classeur', value: n.classeur?.nomClasseur ?? '-'),
                  AppDetailRow(
                      label: 'Centre', value: n.centre?.nom ?? '-'),
                  AppDetailRow(
                      label: 'Emplacement',
                      value: n.emplacement?.nomEmplacement ?? '-'),
                  AppDetailRow(
                      label: 'Article budgétaire',
                      value: n.articlebudgetaire?.nom ?? '-'),
                ],
              ),
            ),
            const SizedBox(height: 14),
            AppCard(
              title: 'Détails additionnels',
              leading: const Icon(Icons.list_alt_outlined,
                  size: 18, color: AppColors.primary600),
              child: Column(
                children: [
                  AppDetailRow(label: 'Numéro de série', value: n.numeroSerie),
                  AppDetailRow(
                      label: 'Date d\'ordonnancement',
                      value: Fmt.date(n.dateOrdonnancement)),
                  AppDetailRow(
                      label: 'Date d\'enregistrement',
                      value: Fmt.date(n.dateEnregistrement)),
                  AppDetailRow(
                      label: 'Numéro d\'article', value: n.numeroArticle ?? 'N/A'),
                  AppDetailRow(
                      label: 'Utilisateur',
                      value: n.utilisateur?.displayName ?? 'Non spécifié'),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
