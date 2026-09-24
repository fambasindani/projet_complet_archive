import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/dashboard.dart';
import '../services/dashboard_service.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_stat_card.dart';
import '../widgets/ui/app_toast.dart';

/// Rapports et statistiques.
class RapportsPage extends StatefulWidget {
  const RapportsPage({super.key});

  @override
  State<RapportsPage> createState() => _RapportsPageState();
}

class _RapportsPageState extends State<RapportsPage> {
  final _service = DashboardService();
  DashboardStats? _stats;
  PublicStats? _public;
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
        _service.statistics(),
        _service.publicStats(),
      ]);
      _stats = results[0] as DashboardStats;
      _public = results[1] as PublicStats;
    } catch (_) {
      AppToast.error('Erreur lors du chargement des statistiques');
    } finally {
      if (mounted) setState(() => _loading = false);
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
          const AppPageHeader(
            title: 'Rapports',
            subtitle: 'Statistiques de la plateforme d\'archivage',
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth > 700 ? 4 : 2;
              return GridView.count(
                crossAxisCount: columns,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 2.0,
                children: [
                  AppStatCard(
                    title: 'Déclarations',
                    value: '${_stats?.totalDeclarations ?? 0}',
                    icon: Icons.description_outlined,
                    color: StatColor.primary,
                    loading: _loading,
                  ),
                  AppStatCard(
                    title: 'Notes de perception',
                    value: '${_stats?.totalNotes ?? 0}',
                    icon: Icons.receipt_long_outlined,
                    color: StatColor.success,
                    loading: _loading,
                  ),
                  AppStatCard(
                    title: 'Directions',
                    value: '${_stats?.totalDirections ?? 0}',
                    icon: Icons.business_outlined,
                    color: StatColor.info,
                    loading: _loading,
                  ),
                  AppStatCard(
                    title: 'Archives (public)',
                    value: '${_public?.totalArchives ?? 0}',
                    icon: Icons.inventory_2_outlined,
                    color: StatColor.warning,
                    loading: _loading,
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 20),
          if (_stats != null && _stats!.roles.isNotEmpty)
            _breakdown('Utilisateurs par rôle', _stats!.roles),
          const SizedBox(height: 16),
          if (_stats != null && _stats!.directions.isNotEmpty)
            _breakdown('Utilisateurs par direction', _stats!.directions),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _breakdown(String title, List<StatItem> items) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.slate800,
            ),
          ),
          const SizedBox(height: 12),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      item.label,
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.slate700),
                    ),
                  ),
                  Text(
                    '${item.value}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
