import 'package:flutter/material.dart';
import '../../config/constants.dart';

enum AppButtonVariant { primary, secondary, danger, success, ghost }

enum AppButtonSize { sm, md, lg }

/// Bouton unifié (miroir de `components/ui/Button.tsx`).
class AppButton extends StatelessWidget {
  final String? label;
  final Widget? child;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool loading;
  final IconData? icon;
  final bool expand;
  final bool enabled;

  const AppButton({
    super.key,
    this.label,
    this.child,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.icon,
    this.expand = false,
    this.enabled = true,
  });

  const AppButton.secondary({
    super.key,
    this.label,
    this.child,
    this.onPressed,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.icon,
    this.expand = false,
    this.enabled = true,
  }) : variant = AppButtonVariant.secondary;

  const AppButton.danger({
    super.key,
    this.label,
    this.child,
    this.onPressed,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.icon,
    this.expand = false,
    this.enabled = true,
  }) : variant = AppButtonVariant.danger;

  const AppButton.success({
    super.key,
    this.label,
    this.child,
    this.onPressed,
    this.size = AppButtonSize.md,
    this.loading = false,
    this.icon,
    this.expand = false,
    this.enabled = true,
  }) : variant = AppButtonVariant.success;

  @override
  Widget build(BuildContext context) {
    final isDisabled = !enabled || loading || onPressed == null;

    final (Color bg, Color fg, BorderSide border) = switch (variant) {
      AppButtonVariant.primary => (
          AppColors.slate900,
          Colors.white,
          BorderSide.none
        ),
      AppButtonVariant.secondary => (
          Colors.white,
          AppColors.slate700,
          const BorderSide(color: AppColors.border)
        ),
      AppButtonVariant.danger => (
          const Color(0xFFE11D48),
          Colors.white,
          BorderSide.none
        ),
      AppButtonVariant.success => (
          const Color(0xFF059669),
          Colors.white,
          BorderSide.none
        ),
      AppButtonVariant.ghost => (
          Colors.transparent,
          AppColors.slate600,
          BorderSide.none
        ),
    };

    final (double px, double py, double fontSize, double iconSize) = switch (size) {
      AppButtonSize.sm => (12.0, 8.0, 12.0, 15.0),
      AppButtonSize.md => (18.0, 12.0, 14.0, 17.0),
      AppButtonSize.lg => (24.0, 15.0, 16.0, 19.0),
    };

    final content = loading
        ? Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: iconSize,
                height: iconSize,
                child: const CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 10),
              Text('Chargement...', style: TextStyle(fontSize: fontSize)),
            ],
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: iconSize),
                const SizedBox(width: 8),
              ],
              if (child != null)
                child!
              else
                Text(
                  label ?? '',
                  style: TextStyle(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w600,
                    color: fg,
                  ),
                ),
            ],
          );

    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Material(
        color: bg,
        elevation: (variant == AppButtonVariant.primary ||
                variant == AppButtonVariant.danger ||
                variant == AppButtonVariant.success)
            ? 2
            : 0,
        shadowColor: variant == AppButtonVariant.primary
            ? const Color(0x331E293B)
            : fg.withValues(alpha: 0.35),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: border,
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: isDisabled ? null : onPressed,
          child: Container(
            width: expand ? double.infinity : null,
            padding: EdgeInsets.symmetric(horizontal: px, vertical: py),
            child: DefaultTextStyle(
              style: TextStyle(
                color: fg,
                fontWeight: FontWeight.w600,
                fontSize: fontSize,
              ),
              child: content,
            ),
          ),
        ),
      ),
    );
  }
}
