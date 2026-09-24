import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/dashboard.dart';
import '../services/note_services.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_data_list.dart';
import '../widgets/ui/app_dropdown.dart';
import '../widgets/ui/app_search_field.dart';
import '../widgets/ui/app_toast.dart';

/// Journal / audit des opérations (filtres + statistiques).
class JournalPage extends StatefulWidget {
  const JournalPage({super.key});

  @override
  State<JournalPage> createState() => _JournalPageState();
}

class _JournalPageState extends State<JournalPage> {
  final _service = JournalService();
  final _searchController = TextEditingController();

  List<LogEntry> _items = const [];
  List<String> _tables = const [];
  Map<String, dynamic> _stats = const {};
  bool _loading = true;
  int _page = 1;
  int _lastPage = 1;
  int _total = 0;
  String _search = '';
  String? _action;
  String? _table;

  static const _actions = ['create', 'update', 'delete', 'login', 'logout'];

  @override
  void initState() {
    super.initState();
    _load();
    _loadMeta();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMeta() async {
    try {
      final tables = await _service.tables();
      final stats = await _service.stats();
      if (mounted) {
        setState(() {
          _tables = tables;
          _stats = stats;
        });
      }
    } catch (_) {}
  }

  Future<void> _load({int? page}) async {
    setState(() => _loading = true);
    try {
      final res = await _service.list(
        page: page ?? _page,
        perPage: 20,
        search: _search,
        action: _action,
        table: _table,
      );
      setState(() {
        _items = res.data;
        _page = res.currentPage;
        _lastPage = res.lastPage;
        _total = res.total;
      });
    } catch (_) {
      AppToast.error('Erreur lors du chargement du journal');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  AppBadgeVariant _variant(String action) {
    final a = action.toLowerCase();
    if (a.contains('create') || a.contains('ajout')) {
      return AppBadgeVariant.success;
    }
    if (a.contains('delete') || a.contains('suppr')) {
      return AppBadgeVariant.danger;
    }
    if (a.contains('update') || a.contains('modif')) {
      return AppBadgeVariant.warning;
    }
    return AppBadgeVariant.info;
  }

  int _statValue(String key) {
    final v = _stats[key];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            children: [
              if (_stats.isNotEmpty)
                Row(
                  children: [
                    Expanded(
                      child: _statChip('Total', _statValue('total')),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _statChip('Aujourd\'hui', _statValue('aujourd_hui')),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _statChip('Actions', _statValue('par_action') == 0
                          ? _statValue('actions')
                          : _statValue('par_action')),
                    ),
                  ],
                ),
              if (_stats.isNotEmpty) const SizedBox(height: 12),
              AppSearchField(
                hint: 'Rechercher dans le journal...',
                controller: _searchController,
                onChanged: (v) {
                  _search = v;
                  _load(page: 1);
                },
                onClear: () {
                  _searchController.clear();
                  _search = '';
                  _load(page: 1);
                },
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: AppDropdown<String>(
                      placeholder: 'Toutes les actions',
                      options: _actions
                          .map((a) => AppOption(value: a, label: a))
                          .toList(),
                      value: _action,
                      onChanged: (v) {
                        setState(() => _action = v);
                        _load(page: 1);
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: AppDropdown<String>(
                      placeholder: 'Toutes les tables',
                      options: _tables
                          .map((t) => AppOption(value: t, label: t))
                          .toList(),
                      value: _table,
                      onChanged: (v) {
                        setState(() => _table = v);
                        _load(page: 1);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: AppDataList<LogEntry>(
            items: _items,
            loading: _loading,
            emptyMessage: 'Aucune entrée de journal',
            emptyIcon: Icons.history,
            onRefresh: () => _load(),
            pagination: PaginationInfo(
              currentPage: _page,
              lastPage: _lastPage,
              total: _total,
              perPage: 20,
              onPageChange: (p) => _load(page: p),
              onPerPageChange: (_) {},
            ),
            itemBuilder: (context, log, index) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.history,
                        size: 18, color: AppColors.primary600),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            AppBadge(
                                label: log.action.isEmpty ? '—' : log.action,
                                variant: _variant(log.action)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                log.tableName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.slate800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (log.description != null &&
                            log.description!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            log.description!,
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.slate500),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          Fmt.dateTime(log.createdAt),
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.slate400),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _statChip(String label, int value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            '$value',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.slate800,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.slate500),
          ),
        ],
      ),
    );
  }
}
