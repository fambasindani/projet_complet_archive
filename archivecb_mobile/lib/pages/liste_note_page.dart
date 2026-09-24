import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/note_perception.dart';
import '../services/note_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_data_list.dart';
import '../widgets/ui/app_toast.dart';

/// Notes d'un centre d'ordonnancement.
class ListeNotePage extends StatefulWidget {
  final int centreId;

  const ListeNotePage({super.key, required this.centreId});

  @override
  State<ListeNotePage> createState() => _ListeNotePageState();
}

class _ListeNotePageState extends State<ListeNotePage> {
  final _service = NotePerceptionService();

  List<NotePerception> _items = const [];
  bool _loading = true;
  int _page = 1;
  int _lastPage = 1;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({int? page}) async {
    setState(() => _loading = true);
    try {
      final res =
          await _service.listByCentre(widget.centreId, page: page ?? _page);
      setState(() {
        _items = res.data;
        _page = res.currentPage;
        _lastPage = res.lastPage;
        _total = res.total;
      });
    } catch (_) {
      AppToast.error('Erreur lors du chargement');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppDataList<NotePerception>(
      items: _items,
      loading: _loading,
      emptyMessage: 'Aucune note pour ce centre',
      emptyIcon: Icons.receipt_long_outlined,
      onRefresh: () => _load(),
      padding: const EdgeInsets.all(16),
      pagination: PaginationInfo(
        currentPage: _page,
        lastPage: _lastPage,
        total: _total,
        perPage: 10,
        onPageChange: (p) => _load(page: p),
        onPerPageChange: (_) {},
      ),
      itemBuilder: (context, n, index) => InkWell(
        onTap: () => context.go('/note/detail/${n.id}'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      n.assujetti?.nomRaisonSociale ?? 'Note #${n.id}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${n.numeroSerie} · ${Fmt.date(n.dateOrdonnancement)}',
                      style: const TextStyle(
                          fontSize: 11.5, color: AppColors.slate500),
                    ),
                  ],
                ),
              ),
              AppBadge(
                label: n.statut ? 'Validée' : 'En attente',
                variant:
                    n.statut ? AppBadgeVariant.success : AppBadgeVariant.warning,
              ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right,
                  size: 18, color: AppColors.slate400),
            ],
          ),
        ),
      ),
    );
  }
}
