import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/dashboard.dart';
import '../services/dashboard_service.dart';
import '../widgets/ui/app_stat_card.dart';
import '../widgets/ui/app_toast.dart';

class TableauBordNotePage extends StatefulWidget {
  const TableauBordNotePage({super.key});

  @override
  State<TableauBordNotePage> createState() => _TableauBordNotePageState();
}

class _TableauBordNotePageState extends State<TableauBordNotePage> {
  final _service = DashboardService();
  DashboardStats? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _stats = await _service.noteStatistics();
    } catch (_) {
      AppToast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.success,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.npGradient),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Color(0x3310B981), blurRadius: 14),
                  ],
                ),
                child: const Icon(Icons.receipt_long_outlined,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Note de Perception',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.slate900,
                      ),
                    ),
                    Text(
                      'Vue d\'ensemble des notes',
                      style: TextStyle(fontSize: 13, color: AppColors.slate500),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _loading ? null : _load,
                icon: const Icon(Icons.refresh, color: AppColors.slate600),
              ),
            ],
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth > 700 ? 3 : 2;
              return GridView.count(
                crossAxisCount: columns,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 2.0,
                children: [
                  AppStatCard(
                    title: 'Notes de perception',
                    value: '${_stats?.totalNotes ?? 0}',
                    icon: Icons.receipt_long_outlined,
                    color: StatColor.success,
                    loading: _loading,
                    onTap: () => context.go('/note-perception'),
                  ),
                  AppStatCard(
                    title: 'Centres',
                    value: '${_stats?.totalDirections ?? 0}',
                    icon: Icons.home_work_outlined,
                    color: StatColor.info,
                    loading: _loading,
                    onTap: () => context.go('/centre-ordonnancement'),
                  ),
                  AppStatCard(
                    title: 'Articles',
                    value: '${_stats?.totalDeclarations ?? 0}',
                    icon: Icons.description_outlined,
                    color: StatColor.primary,
                    loading: _loading,
                    onTap: () => context.go('/ministere'),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 20),
          if (_stats != null && _stats!.directions.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Répartition',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ..._stats!.directions.map(
                    (d) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(d.label,
                                style: const TextStyle(
                                    fontSize: 13, color: AppColors.slate700)),
                          ),
                          Text('${d.value}',
                              style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
