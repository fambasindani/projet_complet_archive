import 'package:flutter/material.dart';
import '../../config/constants.dart';

/// Option générique label/valeur.
class AppOption<T> {
  final T value;
  final String label;

  const AppOption({required this.value, required this.label});
}

/// Menu déroulant simple (miroir de `components/ui/Select.tsx`).
class AppDropdown<T> extends StatelessWidget {
  final String? label;
  final String? error;
  final String placeholder;
  final List<AppOption<T>> options;
  final T? value;
  final ValueChanged<T?> onChanged;
  final bool enabled;
  final IconData? icon;

  const AppDropdown({
    super.key,
    this.label,
    this.error,
    this.placeholder = 'Sélectionner...',
    required this.options,
    required this.value,
    required this.onChanged,
    this.enabled = true,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final hasValue = options.any((o) => o.value == value);
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
        DropdownButtonFormField<T>(
          initialValue: hasValue ? value : null,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down,
              color: AppColors.slate400),
          decoration: InputDecoration(
            errorText: error,
            prefixIcon: icon != null
                ? Icon(icon, size: 18, color: AppColors.slate400)
                : null,
          ),
          hint: Text(
            placeholder,
            style: const TextStyle(fontSize: 14, color: AppColors.slate400),
          ),
          style: const TextStyle(fontSize: 14, color: AppColors.slate900),
          items: options
              .map((o) => DropdownMenuItem<T>(
                    value: o.value,
                    child: Text(o.label, overflow: TextOverflow.ellipsis),
                  ))
              .toList(),
          onChanged: enabled ? onChanged : null,
        ),
      ],
    );
  }
}
