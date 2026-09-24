import 'package:flutter/material.dart';
import '../../config/constants.dart';

/// Affiche une boîte de dialogue avec en-tête dégradé (miroir de `Modal.tsx`).
Future<T?> showAppModal<T>({
  required BuildContext context,
  required String title,
  required Widget child,
  IconData? icon,
  bool dismissible = true,
}) {
  return showDialog<T>(
    context: context,
    barrierDismissible: dismissible,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary600, AppColors.primary700],
                ),
              ),
              child: Row(
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.close,
                          size: 18, color: Colors.white70),
                    ),
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: child,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Boîte de confirmation (miroir de `ConfirmModal.tsx`).
Future<bool> showAppConfirm({
  required BuildContext context,
  required String title,
  required String message,
  String confirmText = 'Confirmer',
  String cancelText = 'Annuler',
  ConfirmVariant variant = ConfirmVariant.danger,
  bool loading = false,
}) async {
  final config = switch (variant) {
    ConfirmVariant.danger => (
        Icons.warning_amber_rounded,
        const Color(0xFFFEE2E2),
        const Color(0xFFDC2626),
        const Color(0xFFE11D48),
      ),
    ConfirmVariant.warning => (
        Icons.warning_amber_rounded,
        const Color(0xFFFEF3C7),
        const Color(0xFFD97706),
        const Color(0xFFD97706),
      ),
    ConfirmVariant.info => (
        Icons.info_outline,
        const Color(0xFFDBEAFE),
        const Color(0xFF2563EB),
        const Color(0xFF2563EB),
      ),
  };

  final result = await showDialog<bool>(
    context: context,
    builder: (context) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: config.$2,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(config.$1, size: 28, color: config.$3),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.slate900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.slate600,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 22),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: loading ? null : () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      side: const BorderSide(color: AppColors.border),
                      foregroundColor: AppColors.slate700,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(cancelText),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: loading ? null : () => Navigator.pop(context, true),
                    style: FilledButton.styleFrom(
                      backgroundColor: config.$4,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: loading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(confirmText),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  return result ?? false;
}

enum ConfirmVariant { danger, warning, info }
