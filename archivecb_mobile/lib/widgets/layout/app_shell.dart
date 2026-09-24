import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/constants.dart';
import 'app_drawer.dart';
import 'app_header.dart';

const Map<String, String> _pageTitles = {
  '/tableaudebord': 'Tableau de bord',
  '/tableaudebordnote': 'Tableau de bord (NP)',
  '/direction': 'Directions',
  '/classeur': 'Classeurs',
  '/centre-ordonnancement': 'Centres d\'ordonnancement',
  '/emplacement': 'Emplacements',
  '/ministere': 'Service d\'assiette',
  '/document': 'Documents',
  '/note-perception': 'Notes de perception',
  '/liste-document': 'Liste des documents',
  '/liste-note': 'Liste des notes',
  '/detail-document': 'Détail document',
  '/detail-note': 'Détail note',
  '/declaration-form': 'Formulaire déclaration',
  '/note-form': 'Formulaire note',
  '/profil': 'Mon profil',
  '/scanner': 'Scanner',
  '/journal': 'Journal',
  '/rapports': 'Rapports',
};

String _titleFor(String path) {
  final segments = path.split('/').where((s) => s.isNotEmpty).toList();
  if (segments.isEmpty) return 'Tableau de bord';
  return _pageTitles['/${segments.first}'] ?? 'Archivage';
}

class AppShell extends StatelessWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppHeader(title: _titleFor(path)),
      drawer: AppDrawer(currentPath: path),
      body: child,
    );
  }
}
