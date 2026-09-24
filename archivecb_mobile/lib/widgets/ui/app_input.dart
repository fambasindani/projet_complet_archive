import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/constants.dart';

/// Champ de saisie (miroir de `components/ui/Input.tsx`).
class AppInput extends StatelessWidget {
  final String? label;
  final String? hint;
  final String? error;
  final TextEditingController? controller;
  final IconData? icon;
  final bool obscure;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final bool enabled;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final bool readOnly;
  final List<TextInputFormatter>? formatters;
  final Widget? suffix;
  final String? initialValue;
  final FocusNode? focusNode;
  final bool autofocus;
  final TextCapitalization textCapitalization;

  const AppInput({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.controller,
    this.icon,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.enabled = true,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.onChanged,
    this.onTap,
    this.readOnly = false,
    this.formatters,
    this.suffix,
    this.initialValue,
    this.focusNode,
    this.autofocus = false,
    this.textCapitalization = TextCapitalization.none,
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
          focusNode: focusNode,
          autofocus: autofocus,
          enabled: enabled,
          obscureText: obscure,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          readOnly: readOnly,
          onTap: onTap,
          onChanged: onChanged,
          maxLines: obscure ? 1 : maxLines,
          minLines: minLines,
          maxLength: maxLength,
          inputFormatters: formatters,
          textCapitalization: textCapitalization,
          style: const TextStyle(fontSize: 14, color: AppColors.slate900),
          decoration: InputDecoration(
            hintText: hint,
            counterText: '',
            prefixIcon: icon != null
                ? Icon(icon, size: 18, color: AppColors.slate400)
                : null,
            suffixIcon: suffix,
            errorText: error,
            errorStyle: const TextStyle(
              fontSize: 11,
              color: AppColors.danger,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
