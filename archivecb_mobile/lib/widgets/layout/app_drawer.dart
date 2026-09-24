import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/constants.dart';
import '../../providers/auth_provider.dart';

class _NavChild {
  final String label;
  final String path;
  final IconData icon;
  const _NavChild(this.label, this.path, this.icon);
}

class _NavGroup {
  final String label;
  final IconData icon;
  final List<_NavChild> children;
  const _NavGroup({required this.label, required this.icon, required this.children});
}

/// Tiroir de navigation latéral de l'application d'archivage.
class AppDrawer extends StatefulWidget {
  final String currentPath;

  const AppDrawer({super.key, required this.currentPath});

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  bool _configOpen = true;

  bool _isActive(String path) => widget.currentPath.startsWith(path);

  void _go(String path) {
    Navigator.pop(context);
    if (widget.currentPath != path) context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isNp = auth.isNp;
    final has = auth.hasPermission;
    final gradient = ArchiveModule.gradient(auth.module);

    final configChildren = <_NavChild>[
      if (!isNp && has(Permissions.direction))
        const _NavChild('Direction', '/direction', Icons.business_outlined),
      if (has(Permissions.classeur))
        const _NavChild('Classeur', '/classeur', Icons.folder_outlined),
      if (isNp && has(Permissions.centre))
        const _NavChild('Centre', '/centre-ordonnancement', Icons.home_work_outlined),
      if (has(Permissions.emplacement))
        const _NavChild('Emplacement', '/emplacement', Icons.place_outlined),
      if (isNp && has(Permissions.servAssiette))
        _NavChild(
            'Service d\'assiette', '/ministere', Icons.description_outlined),
    ];

    final groups = <_NavGroup>[
      if (configChildren.isNotEmpty)
        _NavGroup(
          label: 'Configuration',
          icon: Icons.settings_outlined,
          children: configChildren,
        ),
    ];

    return Drawer(
      backgroundColor: AppColors.sidebarBg,
      width: 280,
      child: SafeArea(
        child: Column(
          children: [
            // Brand
            Container(
              padding: const EdgeInsets.fromLTRB(18, 22, 18, 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    gradient.first.withValues(alpha: 0.35),
                    AppColors.sidebarBg,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: const Border(
                  bottom: BorderSide(color: Color(0x1AFFFFFF)),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: gradient),
                      borderRadius: BorderRadius.circular(13),
                      boxShadow: [
                        BoxShadow(
                          color: gradient.last.withValues(alpha: 0.4),
                          blurRadius: 12,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.archive_outlined,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          auth.brand,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          'Système de Gestion',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                children: [
                  if (has(Permissions.dashboard))
                    _tile(
                      icon: Icons.dashboard_outlined,
                      label: 'Dashboard',
                      active: _isActive(
                          isNp ? '/tableaudebordnote' : '/tableaudebord'),
                      onTap: () =>
                          _go(isNp ? '/tableaudebordnote' : '/tableaudebord'),
                    ),
                  for (final g in groups) _group(g),
                  if (!isNp &&
                      has(Permissions.archivDoc) &&
                      has(Permissions.accederDocument))
                    _tile(
                      icon: Icons.layers_outlined,
                      label: 'Documents',
                      active: _isActive('/document'),
                      onTap: () => _go('/document'),
                      badge: 'Nouveau',
                    ),
                  if (isNp &&
                      has(Permissions.notePerception) &&
                      has(Permissions.accederNote))
                    _tile(
                      icon: Icons.bar_chart_outlined,
                      label: 'Note-Perception',
                      active: _isActive('/note-perception'),
                      onTap: () => _go('/note-perception'),
                    ),
                  _tile(
                    icon: Icons.document_scanner_outlined,
                    label: 'Scanner',
                    active: _isActive('/scanner'),
                    onTap: () => _go('/scanner'),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(color: Color(0x1AFFFFFF), height: 1),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'SYSTÈME',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.4),
                        fontSize: 10,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  _tile(
                    icon: Icons.person_outline,
                    label: 'Mon Profil',
                    active: _isActive('/profil'),
                    onTap: () => _go('/profil'),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0x1AFFFFFF))),
              ),
              child: Text(
                '© 2026 GS-Archive',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _group(_NavGroup g) {
    final active = g.children.any((c) => _isActive(c.path));
    return Column(
      children: [
        InkWell(
          onTap: () => setState(() => _configOpen = !_configOpen),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
            decoration: BoxDecoration(
              color: _configOpen ? const Color(0x14FFFFFF) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(g.icon,
                    size: 20,
                    color: active ? AppColors.primary400 : AppColors.sidebarText),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    g.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: active ? Colors.white : AppColors.sidebarText,
                    ),
                  ),
                ),
                Icon(
                  _configOpen ? Icons.expand_less : Icons.expand_more,
                  size: 16,
                  color: AppColors.sidebarText,
                ),
              ],
            ),
          ),
        ),
        if (_configOpen)
          Padding(
            padding: const EdgeInsets.only(left: 18, top: 2),
            child: Column(
              children: [
                for (final c in g.children)
                  InkWell(
                    onTap: () => _go(c.path),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 11),
                      child: Row(
                        children: [
                          Icon(c.icon,
                              size: 16,
                              color: _isActive(c.path)
                                  ? AppColors.primary400
                                  : AppColors.sidebarText),
                          const SizedBox(width: 10),
                          Text(
                            c.label,
                            style: TextStyle(
                              fontSize: 13.5,
                              color: _isActive(c.path)
                                  ? AppColors.primary400
                                  : AppColors.sidebarText,
                              fontWeight: _isActive(c.path)
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _tile({
    required IconData icon,
    required String label,
    required bool active,
    required VoidCallback onTap,
    String? badge,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          gradient: active
              ? const LinearGradient(
                  colors: [AppColors.primary500, Color(0xFF9333EA)],
                )
              : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: active ? Colors.white : AppColors.sidebarText),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: active ? Colors.white : AppColors.sidebarText,
                ),
              ),
            ),
            if (badge != null)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFFEC4899), Color(0xFFEF4444)]),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w700),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
