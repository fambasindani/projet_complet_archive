import 'package:flutter/material.dart';
import '../../config/constants.dart';

/// Clé globale utilisée pour afficher les messages (toasts) depuis n'importe où.
final GlobalKey<ScaffoldMessengerState> appScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

/// Notifications éphémères (équivalent de `react-hot-toast`).
class AppToast {
  AppToast._();

  static void _show(String message, Color color, IconData icon) {
    final messenger = appScaffoldMessengerKey.currentState;
    if (messenger == null) return;
    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  static void success(String message) =>
      _show(message, AppColors.success, Icons.check_circle_outline);

  static void error(String message) =>
      _show(message, AppColors.danger, Icons.error_outline);

  static void info(String message) =>
      _show(message, AppColors.info, Icons.info_outline);

  static void warning(String message) =>
      _show(message, AppColors.warning, Icons.warning_amber_rounded);
}
