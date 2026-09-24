import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../services/declaration_services.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_data_list.dart';
import '../widgets/ui/app_toast.dart';

/// Documents (déclarations) d'un classeur.
class ListeDocumentPage extends StatefulWidget {
  final int classeurId;

  const ListeDocumentPage({super.key, required this.classeurId});

  @override
  State<ListeDocumentPage> createState() => _ListeDocumentPageState();
}

class _ListeDocumentPageState extends State<ListeDocumentPage> {
  final _service = DeclarationService();
  final _classeurService = ClasseurService();

  List<Declaration> _items = const [];
  Classeur? _classeur;
  bool _loading = true;
  int _page = 1;
  int _lastPage = 1;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadClasseur();
    _load();
  }

  Future<void> _loadClasseur() async {
    try {
      _classeur = await _classeurService.get(widget.classeurId);
      if (mounted) setState(() {});
    } catch (_) {}
  }

  Future<void> _load({int? page}) async {
    setState(() => _loading = true);
    try {
      final res = await _service.listByClasseur(widget.classeurId,
          page: page ?? _page);
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
    return AppDataList<Declaration>(
      items: _items,
      loading: _loading,
      emptyMessage: 'Aucun document dans ce classeur',
      emptyIcon: Icons.folder_open_outlined,
      onRefresh: () => _load(),
      padding: const EdgeInsets.all(16),
      footer: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _classeur != null
                ? 'Classeur : ${_classeur!.nomClasseur}'
                : 'Classeur #${widget.classeurId}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.slate700,
            ),
          ),
        ],
      ),
      pagination: PaginationInfo(
        currentPage: _page,
        lastPage: _lastPage,
        total: _total,
        perPage: 10,
        onPageChange: (p) => _load(page: p),
        onPerPageChange: (_) {},
      ),
      itemBuilder: (context, d, index) => InkWell(
        onTap: () => context.go('/detail-document/${d.id}'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      d.intitule.isNotEmpty ? d.intitule : 'Déclaration #${d.id}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${d.numDeclaration} · ${Fmt.date(d.dateEnregistrement)}',
                      style: const TextStyle(
                          fontSize: 11.5, color: AppColors.slate500),
                    ),
                  ],
                ),
              ),
              AppBadge(
                label: d.statut ? 'Actif' : 'Inactif',
                variant: d.statut
                    ? AppBadgeVariant.success
                    : AppBadgeVariant.warning,
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
