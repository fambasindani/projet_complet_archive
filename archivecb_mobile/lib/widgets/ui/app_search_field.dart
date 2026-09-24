import 'package:flutter/material.dart';
import '../../config/constants.dart';

/// Champ de recherche réutilisable.
class AppSearchField extends StatelessWidget {
  final String hint;
  final ValueChanged<String>? onChanged;
  final TextEditingController? controller;
  final VoidCallback? onClear;

  const AppSearchField({
    super.key,
    this.hint = 'Rechercher...',
    this.onChanged,
    this.controller,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon:
            const Icon(Icons.search, size: 18, color: AppColors.slate400),
        suffixIcon: onClear != null
            ? IconButton(
                icon: const Icon(Icons.close,
                    size: 16, color: AppColors.slate400),
                onPressed: onClear,
              )
            : null,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}

/// Filtres à onglets (segmented control).
class AppFilterTabs extends StatelessWidget {
  final List<AppFilterTab> tabs;
  final String selected;
  final ValueChanged<String> onChanged;

  const AppFilterTabs({
    super.key,
    required this.tabs,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.slate100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: tabs
            .map(
              (t) => GestureDetector(
                onTap: () => onChanged(t.value),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: selected == t.value ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: selected == t.value
                        ? const [
                            BoxShadow(
                              color: Color(0x14000000),
                              blurRadius: 4,
                              offset: Offset(0, 1),
                            )
                          ]
                        : null,
                  ),
                  child: Text(
                    t.label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: selected == t.value
                          ? AppColors.primary600
                          : AppColors.slate500,
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class AppFilterTab {
  final String value;
  final String label;

  const AppFilterTab(this.value, this.label);
}
