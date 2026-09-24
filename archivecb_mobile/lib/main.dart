import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'router/app_router.dart';
import 'widgets/ui/app_toast.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load();
  } catch (_) {
    // .env absent : on retombe sur les valeurs par défaut de Env.
  }
  runApp(const ArchiveCbApp());
}

class ArchiveCbApp extends StatelessWidget {
  const ArchiveCbApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp.router(
            title: 'ArchiveCB',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            scaffoldMessengerKey: appScaffoldMessengerKey,
            locale: const Locale('fr', 'FR'),
            supportedLocales: const [
              Locale('fr', 'FR'),
              Locale('en', 'US'),
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: appRouter(auth),
          );
        },
      ),
    );
  }
}
