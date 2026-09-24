import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../pages/advanced_search_document_page.dart';
import '../pages/advanced_search_note_page.dart';
import '../pages/classeur_page.dart';
import '../pages/centre_page.dart';
import '../pages/detail_document_page.dart';
import '../pages/detail_note_page.dart';
import '../pages/direction_page.dart';
import '../pages/document_page.dart';
import '../pages/emplacement_page.dart';
import '../pages/form_document_page.dart';
import '../pages/form_note_page.dart';
import '../pages/home_page.dart';
import '../pages/journal_page.dart';
import '../pages/liste_document_page.dart';
import '../pages/liste_note_page.dart';
import '../pages/login_page.dart';
import '../pages/ministere_page.dart';
import '../pages/note_perception_page.dart';
import '../pages/note_plus_page.dart';
import '../pages/ocr_text_page.dart';
import '../pages/profil_page.dart';
import '../pages/rapports_page.dart';
import '../pages/scanner_page.dart';
import '../pages/tableaudebord_page.dart';
import '../pages/tableaudebordnote_page.dart';
import '../providers/auth_provider.dart';
import '../widgets/layout/app_shell.dart';

GoRouter appRouter(AuthProvider auth) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggedIn = auth.isAuthenticated;
      final atLogin = state.matchedLocation == '/login';
      final atHome = state.matchedLocation == '/accueil';

      if (auth.loading) return null;
      if (!loggedIn && !atLogin && !atHome) return '/login';
      if (loggedIn && atLogin) {
        return auth.isNp ? '/tableaudebordnote' : '/tableaudebord';
      }
      return null;
    },
    refreshListenable: auth,
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/accueil',
        builder: (context, state) => const HomePage(),
      ),
      ShellRoute(
        builder: (context, state, child) => ChangeNotifierProvider.value(
          value: context.read<AuthProvider>(),
          child: AppShell(child: child),
        ),
        routes: [
          GoRoute(
            path: '/tableaudebord',
            builder: (context, state) => const TableauBordPage(),
          ),
          GoRoute(
            path: '/tableaudebordnote',
            builder: (context, state) => const TableauBordNotePage(),
          ),
          GoRoute(
            path: '/direction',
            builder: (context, state) => const DirectionPage(),
          ),
          GoRoute(
            path: '/classeur',
            builder: (context, state) => const ClasseurPage(),
          ),
          GoRoute(
            path: '/centre-ordonnancement',
            builder: (context, state) => const CentrePage(),
          ),
          GoRoute(
            path: '/emplacement',
            builder: (context, state) => const EmplacementPage(),
          ),
          GoRoute(
            path: '/ministere',
            builder: (context, state) => const MinisterePage(),
          ),
          GoRoute(
            path: '/document',
            builder: (context, state) => const DocumentPage(),
          ),
          GoRoute(
            path: '/note-perception',
            builder: (context, state) => const NotePerceptionPage(),
          ),
          GoRoute(
            path: '/listedocument/:id',
            builder: (context, state) => ListeDocumentPage(
              classeurId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/listenote/:id',
            builder: (context, state) => ListeNotePage(
              centreId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/detail-document/:id',
            builder: (context, state) => DetailDocumentPage(
              declarationId:
                  int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/note/detail/:id',
            builder: (context, state) => DetailNotePage(
              noteId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/addform',
            builder: (context, state) => FormDocumentPage(
              declarationId: int.tryParse(
                  state.uri.queryParameters['id'] ?? ''),
            ),
          ),
          GoRoute(
            path: '/note/form',
            builder: (context, state) => FormNotePage(
              noteId: int.tryParse(state.uri.queryParameters['id'] ?? ''),
            ),
          ),
          GoRoute(
            path: '/profil',
            builder: (context, state) => const ProfilPage(),
          ),
          GoRoute(
            path: '/scanner',
            builder: (context, state) => const ScannerPage(),
          ),
          GoRoute(
            path: '/journal',
            builder: (context, state) => const JournalPage(),
          ),
          GoRoute(
            path: '/rapports',
            builder: (context, state) => const RapportsPage(),
          ),
          GoRoute(
            path: '/recherche-avancee-document',
            builder: (context, state) => const AdvancedSearchDocumentPage(),
          ),
          GoRoute(
            path: '/recherche-avancee-note',
            builder: (context, state) => const AdvancedSearchNotePage(),
          ),
          GoRoute(
            path: '/note-plus',
            builder: (context, state) => NotePlusPage(
              noteId: int.tryParse(state.uri.queryParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/ocr-text',
            builder: (context, state) => OcrTextPage(
              documentId:
                  int.tryParse(state.uri.queryParameters['id'] ?? '') ?? 0,
              nom: state.uri.queryParameters['nom'] ?? '',
            ),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => const _NotFoundPage(),
  );
}

class _NotFoundPage extends StatelessWidget {
  const _NotFoundPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off, size: 48, color: AppColors.slate400),
            const SizedBox(height: 12),
            const Text('Page introuvable',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Retour à la connexion'),
            ),
          ],
        ),
      ),
    );
  }
}
