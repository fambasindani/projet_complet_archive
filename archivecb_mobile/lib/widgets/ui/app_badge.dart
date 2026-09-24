import 'package:flutter/material.dart';
import '../../config/constants.dart';

enum AppBadgeVariant { success, danger, warning, info, neutral }

/// Puce de statut (miroir de `components/ui/Badge.tsx`).
class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;
  final IconData? icon;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.neutral,
    this.icon,
  });

  const AppBadge.success(this.label, {super.key, this.icon})
      : variant = AppBadgeVariant.success;
  const AppBadge.danger(this.label, {super.key, this.icon})
      : variant = AppBadgeVariant.danger;
  const AppBadge.warning(this.label, {super.key, this.icon})
      : variant = AppBadgeVariant.warning;
  const AppBadge.info(this.label, {super.key, this.icon})
      : variant = AppBadgeVariant.info;
  const AppBadge.neutral(this.label, {super.key, this.icon})
      : variant = AppBadgeVariant.neutral;

  (Color, Color) get _colors => switch (variant) {
        AppBadgeVariant.success => (
            AppColors.successBg,
            const Color(0xFF047857)
          ),
        AppBadgeVariant.danger => (AppColors.dangerBg, const Color(0xFFB91C1C)),
        AppBadgeVariant.warning => (AppColors.warningBg, const Color(0xFFB45309)),
        AppBadgeVariant.info => (AppColors.infoBg, const Color(0xFF1D4ED8)),
        AppBadgeVariant.neutral => (AppColors.slate100, AppColors.slate700),
      };

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: fg),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}
