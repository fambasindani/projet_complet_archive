import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../utils/formatters.dart';

/// Sélecteur de date (tap → calendrier).
class AppDateInput extends StatelessWidget {
  final String? label;
  final String? error;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final String hint;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final bool enabled;

  const AppDateInput({
    super.key,
    this.label,
    this.error,
    required this.value,
    required this.onChanged,
    this.hint = 'Sélectionner une date',
    this.firstDate,
    this.lastDate,
    this.enabled = true,
  });

  Future<void> _pick(BuildContext context) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: value ?? now,
      firstDate: firstDate ?? DateTime(now.year - 100),
      lastDate: lastDate ?? DateTime(now.year + 10),

      locale: const Locale('fr', 'FR'),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.primary600,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.1,
              color: AppColors.slate500,
            ),
          ),
          const SizedBox(height: 8),
        ],
        InkWell(
          onTap: enabled ? () => _pick(context) : null,
          borderRadius: BorderRadius.circular(14),
          child: InputDecorator(
            decoration: InputDecoration(
              errorText: error,
              prefixIcon: const Icon(Icons.calendar_today_outlined,
                  size: 18, color: AppColors.slate400),
              suffixIcon: value != null
                  ? IconButton(
                      icon: const Icon(Icons.close,
                          size: 16, color: AppColors.slate400),
                      onPressed: enabled ? () => onChanged(null) : null,
                    )
                  : null,
            ),
            child: Text(
              value != null ? Fmt.date(value) : hint,
              style: TextStyle(
                fontSize: 14,
                color: value != null ? AppColors.slate900 : AppColors.slate400,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
