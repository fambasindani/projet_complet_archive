import 'package:flutter/material.dart';
import '../../config/constants.dart';
import 'app_layout_widgets.dart';

/// Informations de pagination pour [AppDataList].
class PaginationInfo {
  final int currentPage;
  final int lastPage;
  final int total;
  final int perPage;
  final ValueChanged<int> onPageChange;
  final ValueChanged<int> onPerPageChange;

  const PaginationInfo({
    required this.currentPage,
    required this.lastPage,
    required this.total,
    required this.perPage,
    required this.onPageChange,
    required this.onPerPageChange,
  });
}

/// Liste générique : chargement, vide, rafraîchissement et pagination.
class AppDataList<T> extends StatelessWidget {
  final List<T> items;
  final bool loading;
  final String emptyMessage;
  final IconData emptyIcon;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final PaginationInfo? pagination;
  final Future<void> Function()? onRefresh;
  final EdgeInsetsGeometry padding;
  final Widget? footer;

  const AppDataList({
    super.key,
    required this.items,
    required this.itemBuilder,
    this.loading = false,
    this.emptyMessage = 'Aucune donnée disponible',
    this.emptyIcon = Icons.inbox_outlined,
    this.pagination,
    this.onRefresh,
    this.padding = const EdgeInsets.all(16),
    this.footer,
  });

  @override
  Widget build(BuildContext context) {
    Widget body;

    if (loading) {
      body = Container(
        decoration: _containerDecoration,
        child: const AppLoading(),
      );
    } else if (items.isEmpty) {
      body = Container(
        decoration: _containerDecoration,
        child: AppEmptyState(icon: emptyIcon, title: emptyMessage),
      );
    } else {
      body = Column(
        children: [
          Container(
            decoration: _containerDecoration,
            child: Column(
              children: [
                for (int i = 0; i < items.length; i++) ...[
                  itemBuilder(context, items[i], i),
                  if (i != items.length - 1)
                    const Divider(height: 1, color: AppColors.slate100),
                ],
              ],
            ),
          ),
          if (pagination != null) ...[
            const SizedBox(height: 12),
            AppPagination(info: pagination!),
          ],
          if (footer != null) ...[
            const SizedBox(height: 12),
            footer!,
          ],
        ],
      );
    }

    final scrollable = SingleChildScrollView(
      padding: padding,
      child: body,
    );

    if (onRefresh != null) {
      return RefreshIndicator(
        onRefresh: onRefresh!,
        color: AppColors.primary600,
        child: ListView(
          padding: padding,
          children: [body],
        ),
      );
    }
    return scrollable;
  }

  BoxDecoration get _containerDecoration => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      );
}

/// Contrôles de pagination.
class AppPagination extends StatelessWidget {
  final PaginationInfo info;

  const AppPagination({super.key, required this.info});

  @override
  Widget build(BuildContext context) {
    final start = info.total == 0 ? 0 : (info.currentPage - 1) * info.perPage + 1;
    final end = (info.currentPage * info.perPage).clamp(0, info.total);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            'Affichage de $start à $end sur ${info.total} résultats',
            style: const TextStyle(fontSize: 12, color: AppColors.slate500),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _NavButton(
                icon: Icons.chevron_left,
                enabled: info.currentPage > 1,
                onTap: () => info.onPageChange(info.currentPage - 1),
              ),
              const SizedBox(width: 8),
              Text(
                'Page ${info.currentPage} / ${info.lastPage}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate700,
                ),
              ),
              const SizedBox(width: 8),
              _NavButton(
                icon: Icons.chevron_right,
                enabled: info.currentPage < info.lastPage,
                onTap: () => info.onPageChange(info.currentPage + 1),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _NavButton({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.4,
      child: Material(
        color: AppColors.slate100,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: enabled ? onTap : null,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Icon(icon, size: 18, color: AppColors.slate600),
          ),
        ),
      ),
    );
  }
}

/// Rangée d'actions (icônes) utilisée dans les listes.
class AppIconAction extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final Color color;

  const AppIconAction({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.color = AppColors.slate500,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(7),
            child: Icon(icon, size: 18, color: color),
          ),
        ),
      ),
    );
  }
}

/// Menu d'actions contextuel (équivalent du `Dropdown` d'actions).
class AppActionMenu extends StatelessWidget {
  final List<AppActionMenuItem> items;

  const AppActionMenu({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<int>(
      icon: const Icon(Icons.more_vert, size: 18, color: AppColors.slate500),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      color: Colors.white,
      onSelected: (i) => items[i].onTap(),
      itemBuilder: (context) => [
        for (int i = 0; i < items.length; i++)
          PopupMenuItem<int>(
            value: i,
            child: Row(
              children: [
                Icon(
                  items[i].icon,
                  size: 17,
                  color: items[i].danger ? AppColors.danger : AppColors.slate600,
                ),
                const SizedBox(width: 10),
                Text(
                  items[i].label,
                  style: TextStyle(
                    fontSize: 13,
                    color:
                        items[i].danger ? AppColors.danger : AppColors.slate700,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class AppActionMenuItem {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool danger;

  const AppActionMenuItem({
    required this.label,
    required this.icon,
    required this.onTap,
    this.danger = false,
  });
}
