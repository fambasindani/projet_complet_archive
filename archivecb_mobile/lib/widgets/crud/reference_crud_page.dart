import 'package:flutter/material.dart';

import '../../config/constants.dart';
import '../../models/pagination.dart';
import '../ui/app_badge.dart';
import '../ui/app_button.dart';
import '../ui/app_data_list.dart';
import '../ui/app_input.dart';
import '../ui/app_modal.dart';
import '../ui/app_search_field.dart';
import '../ui/app_toast.dart';

class CrudFieldSpec {
  final String key;
  final String label;
  final String? hint;
  final bool required;
  final bool numeric;
  final IconData? icon;

  const CrudFieldSpec({
    required this.key,
    required this.label,
    this.hint,
    this.required = false,
    this.numeric = false,
    this.icon,
  });
}

class CrudColumnSpec<T> {
  final String label;
  final Widget Function(T item) build;

  const CrudColumnSpec({required this.label, required this.build});
}

/// Écran CRUD générique (liste + recherche + pagination + création/édition).
class ReferenceCrudPage<T> extends StatefulWidget {
  final String title;
  final String subtitle;
  final String itemLabel;
  final IconData icon;
  final List<Color> gradient;
  final bool searchable;
  final Future<Paginated<T>> Function(int page, int perPage, String search)
      fetch;
  final String Function(T) nameOf;
  final bool Function(T)? activeOf;
  final List<CrudFieldSpec> fields;
  final Map<String, String> Function(T item) initialValues;
  final Future<void> Function(Map<String, dynamic> payload, int? id) save;
  final Future<void> Function(T item) remove;
  final List<CrudColumnSpec<T>> columns;
  final void Function(T item)? onTap;
  final String Function(T item) idOf;
  final Future<List<T>> Function()? statsLoader;
  final Widget Function(T item)? detailBuilder;

  const ReferenceCrudPage({
    super.key,
    required this.title,
    required this.subtitle,
    required this.itemLabel,
    required this.icon,
    required this.gradient,
    required this.fetch,
    required this.nameOf,
    required this.fields,
    required this.initialValues,
    required this.save,
    required this.remove,
    required this.columns,
    required this.idOf,
    this.activeOf,
    this.searchable = true,
    this.onTap,
    this.statsLoader,
    this.detailBuilder,
  });

  @override
  State<ReferenceCrudPage<T>> createState() => _ReferenceCrudPageState<T>();
}

class _ReferenceCrudPageState<T> extends State<ReferenceCrudPage<T>> {
  final _searchController = TextEditingController();
  final _formControllers = <String, TextEditingController>{};

  List<T> _items = [];
  List<T> _all = [];
  bool _loading = true;
  int _page = 1;
  int _perPage = 10;
  int _lastPage = 1;
  int _total = 0;
  String _search = '';

  bool _submitting = false;
  int? _editingId;

  @override
  void initState() {
    super.initState();
    _load();
    _loadStats();
  }

  Future<void> _loadStats() async {
    if (widget.statsLoader == null) return;
    try {
      final all = await widget.statsLoader!();
      if (mounted) setState(() => _all = all);
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchController.dispose();
    for (final c in _formControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load({int? page}) async {
    setState(() => _loading = true);
    try {
      final res = await widget.fetch(page ?? _page, _perPage, _search);
      setState(() {
        _items = res.data;
        _page = res.currentPage;
        _lastPage = res.lastPage;
        _total = res.total;
      });
    } catch (e) {
      AppToast.error('Erreur lors du chargement');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openDetail(T item) {
    if (widget.detailBuilder == null) return;
    showAppModal(
      context: context,
      title: widget.nameOf(item),
      icon: widget.icon,
      child: widget.detailBuilder!(item),
    );
  }

  void _openForm([T? item]) {
    _editingId = item != null ? int.tryParse(widget.idOf(item)) : null;
    final initial = item != null ? widget.initialValues(item) : <String, String>{};
    for (final f in widget.fields) {
      _formControllers[f.key] = TextEditingController(text: initial[f.key] ?? '');
    }

    showAppModal(
      context: context,
      title: _editingId == null
          ? 'Nouveau ${widget.itemLabel}'
          : 'Modifier ${widget.itemLabel}',
      icon: widget.icon,
      child: _buildForm(),
    );
  }

  Widget _buildForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final f in widget.fields) ...[
          AppInput(
            label: f.required ? '${f.label} *' : f.label,
            hint: f.hint,
            icon: f.icon,
            controller: _formControllers[f.key],
            keyboardType: f.numeric ? TextInputType.number : TextInputType.text,
          ),
          const SizedBox(height: 14),
        ],
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: AppButton.secondary(
                label: 'Annuler',
                expand: true,
                onPressed: () => Navigator.pop(context),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                label: _editingId == null ? 'Créer' : 'Modifier',
                loading: _submitting,
                expand: true,
                onPressed: _submit,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _submit() async {
    final payload = <String, dynamic>{};
    for (final f in widget.fields) {
      final value = _formControllers[f.key]?.text.trim() ?? '';
      if (f.required && value.isEmpty) {
        AppToast.warning('Le champ "${f.label}" est requis');
        return;
      }
      if (value.isEmpty) continue;
      payload[f.key] = f.numeric ? (num.tryParse(value) ?? value) : value;
    }

    setState(() => _submitting = true);
    try {
      await widget.save(payload, _editingId);
      AppToast.success(_editingId == null
          ? '${widget.itemLabel} créé(e)'
          : '${widget.itemLabel} modifié(e)');
      if (mounted) Navigator.pop(context);
      _clearForm();
      await _load(page: _editingId == null ? 1 : _page);
    } catch (e) {
      AppToast.error('Erreur lors de l\'enregistrement');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _clearForm() {
    for (final c in _formControllers.values) {
      c.dispose();
    }
    _formControllers.clear();
    _editingId = null;
  }

  Future<void> _confirmDelete(T item) async {
    final ok = await showAppConfirm(
      context: context,
      title: 'Confirmer la suppression ?',
      message:
          'Voulez-vous vraiment supprimer "${widget.nameOf(item)}" ? Cette action est irréversible.',
      confirmText: 'Oui, supprimer',
    );
    if (!ok) return;
    try {
      await widget.remove(item);
      AppToast.success('Supprimé avec succès');
      await _load();
    } catch (_) {
      AppToast.error('Erreur lors de la suppression');
    }
  }

  Widget _statsRow() {
    final total = _all.length;
    final active = widget.activeOf == null
        ? total
        : _all.where((e) => widget.activeOf!(e)).length;
    final inactive = total - active;
    final pct = total == 0 ? 0 : ((active / total) * 100).round();

    Widget card(String label, String value, String? sub, Color color,
        Color bg, IconData icon) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.18)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(height: 10),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate800,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.slate500),
              ),
              if (sub != null)
                Text(
                  sub,
                  style: TextStyle(
                      fontSize: 10, fontWeight: FontWeight.w700, color: color),
                ),
            ],
          ),
        ),
      );
    }

    return Row(
      children: [
        card('Total', '$total', null, AppColors.primary600,
            AppColors.primary50, widget.icon),
        const SizedBox(width: 10),
        card('Actifs', '$active', '$pct%', AppColors.success,
            AppColors.successBg, Icons.check_circle_outline),
        const SizedBox(width: 10),
        card('Inactifs', '$inactive', null, AppColors.warning,
            AppColors.warningBg, Icons.cancel_outlined),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: widget.gradient),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(widget.icon, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.slate900,
                          ),
                        ),
                        Text(
                          widget.subtitle,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.slate500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  AppButton(
                    label: 'Nouveau',
                    icon: Icons.add,
                    size: AppButtonSize.sm,
                    onPressed: () => _openForm(),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (_all.isNotEmpty) ...[
                _statsRow(),
                const SizedBox(height: 14),
              ],
              if (widget.searchable)
                Row(
                  children: [
                    Expanded(
                      child: AppSearchField(
                        hint: 'Rechercher...',
                        controller: _searchController,
                        onChanged: (v) {
                          _search = v;
                          _load(page: 1);
                        },
                        onClear: () {
                          _searchController.clear();
                          _search = '';
                          _load(page: 1);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    AppButton.secondary(
                      icon: Icons.refresh,
                      size: AppButtonSize.md,
                      onPressed: () {
                        _searchController.clear();
                        _search = '';
                        _load(page: 1);
                      },
                    ),
                  ],
                ),
            ],
          ),
        ),
        Expanded(
          child: AppDataList<T>(
            items: _items,
            loading: _loading,
            emptyMessage: 'Aucun élément trouvé',
            emptyIcon: widget.icon,
            onRefresh: () => _load(),
            pagination: PaginationInfo(
              currentPage: _page,
              lastPage: _lastPage,
              total: _total,
              perPage: _perPage,
              onPageChange: (p) => _load(page: p),
              onPerPageChange: (pp) {
                setState(() => _perPage = pp);
                _load(page: 1);
              },
            ),
            itemBuilder: (context, item, index) {
              final active = widget.activeOf?.call(item);
              return InkWell(
                onTap: widget.onTap != null ? () => widget.onTap!(item) : null,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppColors.slate100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.slate600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.nameOf(item),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.slate800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Wrap(
                              spacing: 10,
                              runSpacing: 4,
                              children: widget.columns
                                  .map((c) => Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            '${c.label}: ',
                                            style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.slate400),
                                          ),
                                          c.build(item),
                                        ],
                                      ))
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                      if (active != null) ...[
                        AppBadge(
                          label: active ? 'Actif' : 'Inactif',
                          variant: active
                              ? AppBadgeVariant.success
                              : AppBadgeVariant.warning,
                        ),
                        const SizedBox(width: 6),
                      ],
                      AppActionMenu(
                        items: [
                          if (widget.detailBuilder != null)
                            AppActionMenuItem(
                              label: 'Détails',
                              icon: Icons.visibility_outlined,
                              onTap: () => _openDetail(item),
                            ),
                          AppActionMenuItem(
                            label: 'Modifier',
                            icon: Icons.edit_outlined,
                            onTap: () => _openForm(item),
                          ),
                          AppActionMenuItem(
                            label: 'Supprimer',
                            icon: Icons.delete_outline,
                            danger: true,
                            onTap: () => _confirmDelete(item),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
