import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/dashboard.dart';
import '../services/dashboard_service.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_stat_card.dart';
import '../widgets/ui/app_toast.dart';

class TableauBordPage extends StatefulWidget {
  const TableauBordPage({super.key});

  @override
  State<TableauBordPage> createState() => _TableauBordPageState();
}

class _TableauBordPageState extends State<TableauBordPage> {
  final _service = DashboardService();
  DashboardStats? _stats;
  List<Map<String, dynamic>> _recent = const [];
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
        _service.recent(),
      ]);
      _stats = results[0] as DashboardStats;
      _recent = results[1] as List<Map<String, dynamic>>;
    } catch (e) {
      AppToast.error('Erreur lors du chargement du tableau de bord');
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
          _header(),
          const SizedBox(height: 16),
          _statsGrid(),
          const SizedBox(height: 20),
          if (_stats != null && _stats!.directions.isNotEmpty) _directionsCard(),
          if (_stats != null && _stats!.directions.isNotEmpty)
            const SizedBox(height: 20),
          _recentCard(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _header() {
    return Row(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: AppColors.adGradient),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(color: Color(0x333B82F6), blurRadius: 14),
            ],
          ),
          child: const Icon(Icons.dashboard_outlined,
              color: Colors.white, size: 24),
        ),
        const SizedBox(width: 14),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Tableau de bord',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate900,
                ),
              ),
              Text(
                'Vue d\'ensemble de l\'archivage',
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
    );
  }

  Widget _statsGrid() {
    final s = _stats;
    final stats = [
      AppStatCard(
        title: 'Déclarations',
        value: '${s?.totalDeclarations ?? 0}',
        icon: Icons.description_outlined,
        color: StatColor.primary,
        loading: _loading,
        onTap: () => context.go('/document'),
      ),
      AppStatCard(
        title: 'Directions',
        value: '${s?.totalDirections ?? 0}',
        icon: Icons.business_outlined,
        color: StatColor.info,
        loading: _loading,
        onTap: () => context.go('/direction'),
      ),
      AppStatCard(
        title: 'Utilisateurs',
        value: '${s?.totalUsers ?? 0}',
        subtitle: s?.activeUsers != null ? '${s!.activeUsers} actifs' : null,
        icon: Icons.people_outline,
        color: StatColor.success,
        loading: _loading,
      ),
      AppStatCard(
        title: 'Rôles',
        value: '${s?.totalRoles ?? 0}',
        icon: Icons.shield_outlined,
        color: StatColor.warning,
        loading: _loading,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth > 700 ? 4 : 2;
        return GridView.count(
          crossAxisCount: columns,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 2.1,
          children: stats,
        );
      },
    );
  }

  Widget _directionsCard() {
    final items = _stats!.directions.take(6).toList();
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
          const Row(
            children: [
              Icon(Icons.business_outlined, size: 18, color: AppColors.primary600),
              SizedBox(width: 8),
              Text(
                'Directions',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map(
            (d) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      d.label,
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.slate700),
                    ),
                  ),
                  Text(
                    '${d.value}',
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

  Widget _recentCard() {
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
          const Row(
            children: [
              Icon(Icons.history, size: 18, color: AppColors.primary600),
              SizedBox(width: 8),
              Text(
                'Activité récente',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_loading)
            const AppLoading()
          else if (_recent.isEmpty)
            const AppEmptyState(
              icon: Icons.inbox_outlined,
              title: 'Aucune activité récente',
            )
          else
            ..._recent.take(8).map((item) {
              final titre = (item['intitule'] ??
                      item['nom'] ??
                      item['nom_classeur'] ??
                      item['numero_serie'] ??
                      'Élément')
                  .toString();
              final sous = (item['num_reference'] ??
                      item['created_at'] ??
                      '')
                  .toString();
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.description_outlined,
                      size: 18, color: AppColors.primary600),
                ),
                title: Text(
                  titre,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 13.5, fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  sous,
                  style: const TextStyle(
                      fontSize: 11.5, color: AppColors.slate500),
                ),
              );
            }),
        ],
      ),
    );
  }
}
