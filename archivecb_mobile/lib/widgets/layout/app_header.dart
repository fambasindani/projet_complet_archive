import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/constants.dart';
import '../../providers/auth_provider.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;

  const AppHeader({super.key, required this.title});

  @override
  Size get preferredSize => const Size.fromHeight(62);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final gradient = ArchiveModule.gradient(auth.module);

    return AppBar(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      titleSpacing: 0,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title, style: const TextStyle(fontSize: 16)),
          Text(
            auth.moduleLabel,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.slate500,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: gradient),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            auth.module.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ),
        PopupMenuButton<String>(
          offset: const Offset(0, 50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          color: Colors.white,
          onSelected: (value) async {
            switch (value) {
              case 'profil':
                context.push('/profil');
                break;
              case 'switch':
                final next = auth.isNp ? ArchiveModule.ad : ArchiveModule.np;
                await auth.setModule(next);
                if (context.mounted) {
                  context.go(next == ArchiveModule.np
                      ? '/tableaudebordnote'
                      : '/tableaudebord');
                }
                break;
              case 'logout':
                await auth.logout();
                if (context.mounted) context.go('/login');
                break;
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              enabled: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user?.displayName ?? 'Utilisateur',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate900,
                    ),
                  ),
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.slate500),
                  ),
                ],
              ),
            ),
            const PopupMenuDivider(),
            const PopupMenuItem(
              value: 'profil',
              child: Row(children: [
                Icon(Icons.person_outline, size: 18),
                SizedBox(width: 10),
                Text('Mon profil'),
              ]),
            ),
            PopupMenuItem(
              value: 'switch',
              child: Row(children: [
                const Icon(Icons.swap_horiz, size: 18),
                const SizedBox(width: 10),
                Text(auth.isNp
                    ? 'Passer à l\'Archivage'
                    : 'Passer aux Notes'),
              ]),
            ),
            const PopupMenuItem(
              value: 'logout',
              child: Row(children: [
                Icon(Icons.logout, size: 18, color: AppColors.danger),
                SizedBox(width: 10),
                Text('Déconnecter', style: TextStyle(color: AppColors.danger)),
              ]),
            ),
          ],
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: gradient),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  user?.initials ?? '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
      ],
    );
  }
}
