import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/dashboard.dart';
import '../services/dashboard_service.dart';

/// Page d'accueil publique (statistiques + présentation des modules).
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _service = DashboardService();
  PublicStats _stats = const PublicStats();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _stats = await _service.publicStats();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: AppColors.adGradient),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.archive_outlined,
                      color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                const Text(
                  'GS-Archive',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => context.go('/login'),
                  style: TextButton.styleFrom(foregroundColor: Colors.white),
                  child: const Text('Se connecter'),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Text(
              'Plateforme d\'archivage numérique',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Deux modules : Archivage Ordinaire et Note de Perception. '
              'Numérisez, classez et retrouvez vos documents en toute sécurité.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.65),
                fontSize: 14,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 28),
            Row(
              children: [
                _statCard('Archives', '${_stats.totalArchives}'),
                const SizedBox(width: 12),
                _statCard('Archivage (AD)', '${_stats.adTotal}'),
                const SizedBox(width: 12),
                _statCard('Notes (NP)', '${_stats.npTotal}'),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _statCard('Documents en traitement',
                    '${_stats.documentsTraitement}'),
                const SizedBox(width: 12),
                _statCard(
                  'Disponibilité',
                  _stats.tauxDisponibilite > 0
                      ? '${_stats.tauxDisponibilite.toStringAsFixed(1)} %'
                      : '—',
                ),
              ],
            ),
            const SizedBox(height: 28),
            _moduleCard(
              icon: Icons.archive_outlined,
              title: 'Archivage Ordinaire',
              description:
                  'Documents administratifs, correspondances, rapports',
              gradient: AppColors.adGradient,
            ),
            const SizedBox(height: 14),
            _moduleCard(
              icon: Icons.receipt_long_outlined,
              title: 'Note de Perception',
              description: 'Documents financiers, quittances, pièces comptables',
              gradient: AppColors.npGradient,
            ),
            const SizedBox(height: 28),
            Center(
              child: Text(
                '© ${DateTime.now().year} DGRAD — Tous droits réservés',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statCard(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _loading ? '—' : value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _moduleCard({
    required IconData icon,
    required String title,
    required String description,
    required List<Color> gradient,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
