import 'package:flutter/material.dart';
import '../../config/constants.dart';
import 'app_dropdown.dart';

/// Menu déroulant avec recherche (miroir de `components/ui/DropdownSearch.tsx`).
///
/// Ouvre une feuille modale contenant un champ de recherche et la liste filtrée.
class AppSearchDropdown<T> extends StatelessWidget {
  final String? label;
  final String? error;
  final String placeholder;
  final List<AppOption<T>> options;
  final T? value;
  final ValueChanged<T?> onChanged;
  final bool loading;
  final bool enabled;
  final IconData? icon;
  final String searchHint;

  const AppSearchDropdown({
    super.key,
    this.label,
    this.error,
    this.placeholder = 'Sélectionner...',
    required this.options,
    required this.value,
    required this.onChanged,
    this.loading = false,
    this.enabled = true,
    this.icon,
    this.searchHint = 'Rechercher...',
  });

  AppOption<T>? get _selected {
    for (final o in options) {
      if (o.value == value) return o;
    }
    return null;
  }

  Future<void> _open(BuildContext context) async {
    final selected = await showModalBottomSheet<T?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _SearchSheet<T>(
        options: options,
        current: value,
        placeholder: searchHint,
        title: label ?? placeholder,
      ),
    );
    if (selected != null) onChanged(selected);
  }

  @override
  Widget build(BuildContext context) {
    final sel = _selected;
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
          onTap: enabled && !loading ? () => _open(context) : null,
          borderRadius: BorderRadius.circular(14),
          child: InputDecorator(
            decoration: InputDecoration(
              errorText: error,
              prefixIcon: icon != null
                  ? Icon(icon, size: 18, color: AppColors.slate400)
                  : null,
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (sel != null)
                    IconButton(
                      icon: const Icon(Icons.close,
                          size: 15, color: AppColors.slate400),
                      onPressed: enabled ? () => onChanged(null) : null,
                    ),
                  const Icon(Icons.keyboard_arrow_down,
                      color: AppColors.slate400),
                  const SizedBox(width: 8),
                ],
              ),
            ),
            child: Text(
              loading
                  ? 'Chargement...'
                  : (sel?.label ?? placeholder),
              style: TextStyle(
                fontSize: 14,
                color: sel != null ? AppColors.slate900 : AppColors.slate400,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ],
    );
  }
}

class _SearchSheet<T> extends StatefulWidget {
  final List<AppOption<T>> options;
  final T? current;
  final String placeholder;
  final String title;

  const _SearchSheet({
    required this.options,
    required this.current,
    required this.placeholder,
    required this.title,
  });

  @override
  State<_SearchSheet<T>> createState() => _SearchSheetState<T>();
}

class _SearchSheetState<T> extends State<_SearchSheet<T>> {
  final _controller = TextEditingController();
  late List<AppOption<T>> _filtered;

  @override
  void initState() {
    super.initState();
    _filtered = widget.options;
  }

  void _onSearch(String q) {
    final query = q.toLowerCase();
    setState(() {
      _filtered = query.isEmpty
          ? widget.options
          : widget.options
              .where((o) => o.label.toLowerCase().contains(query))
              .toList();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      builder: (context, scrollController) => Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.slate300,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate900,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close,
                      size: 20, color: AppColors.slate500),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _controller,
              onChanged: _onSearch,
              autofocus: true,
              decoration: InputDecoration(
                hintText: widget.placeholder,
                prefixIcon: const Icon(Icons.search,
                    size: 18, color: AppColors.slate400),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _filtered.isEmpty
                ? const Center(
                    child: Text(
                      'Aucun résultat trouvé',
                      style: TextStyle(color: AppColors.slate400),
                    ),
                  )
                : ListView.separated(
                    controller: scrollController,
                    itemCount: _filtered.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 1, color: AppColors.slate100),
                    itemBuilder: (context, i) {
                      final o = _filtered[i];
                      final isSelected = o.value == widget.current;
                      return ListTile(
                        title: Text(
                          o.label,
                          style: TextStyle(
                            fontSize: 14,
                            color: isSelected
                                ? AppColors.primary700
                                : AppColors.slate700,
                            fontWeight:
                                isSelected ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                        tileColor:
                            isSelected ? AppColors.primary50 : null,
                        onTap: () => Navigator.pop(context, o.value),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
