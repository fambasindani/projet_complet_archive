import 'package:flutter/material.dart';
import '../../config/constants.dart';

/// Zone de texte multiligne (miroir de `components/ui/Textarea.tsx`).
class AppTextarea extends StatelessWidget {
  final String? label;
  final String? hint;
  final String? error;
  final TextEditingController? controller;
  final int minLines;
  final int maxLines;
  final ValueChanged<String>? onChanged;
  final bool enabled;

  const AppTextarea({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.controller,
    this.minLines = 3,
    this.maxLines = 5,
    this.onChanged,
    this.enabled = true,
  });

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
        TextField(
          controller: controller,
          enabled: enabled,
          minLines: minLines,
          maxLines: maxLines,
          onChanged: onChanged,
          style: const TextStyle(fontSize: 14, color: AppColors.slate900),
          decoration: InputDecoration(
            hintText: hint,
            errorText: error,
          ),
        ),
      ],
    );
  }
}
