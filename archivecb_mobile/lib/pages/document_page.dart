import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../providers/auth_provider.dart';
import '../services/declaration_services.dart';
import '../widgets/ui/app_badge.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_data_list.dart';
import '../widgets/ui/app_modal.dart';
import '../widgets/ui/app_search_field.dart';
import '../widgets/ui/app_toast.dart';
import '../utils/formatters.dart';

/// Module AD — liste des déclarations (documents ordinaires).
class DocumentPage extends StatefulWidget {
  const DocumentPage({super.key});

  @override
  State<DocumentPage> createState() => _DocumentPageState();
}

class _DocumentPageState extends State<DocumentPage> {
  final _service = DeclarationService();
  final _searchController = TextEditingController();

  List<Declaration> _items = const [];
  bool _loading = true;
  int _page = 1;
  int _perPage = 10;
  int _lastPage = 1;
  int _total = 0;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({int? page}) async {
    setState(() => _loading = true);
    try {
      final directionIds = context.read<AuthProvider>().directionIds;
      final res = _search.isEmpty
          ? await _service.list(
              page: page ?? _page,
              perPage: _perPage,
              directionIds: directionIds,
            )
          : await _service.search(
              _search,
              page: page ?? _page,
              perPage: _perPage,
              directionIds: directionIds,
            );
      setState(() {
        _items = res.data;
        _page = res.currentPage;
        _lastPage = res.lastPage;
        _total = res.total;
      });
    } catch (_) {
      AppToast.error('Erreur lors du chargement des documents');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(Declaration d) async {
    final ok = await showAppConfirm(
      context: context,
      title: 'Confirmer la suppression ?',
      message: 'Voulez-vous supprimer la déclaration "${d.intitule}" ?',
      confirmText: 'Oui, supprimer',
    );
    if (!ok) return;
    try {
      await _service.remove(d.id);
      AppToast.success('Déclaration supprimée');
      await _load();
    } catch (_) {
      AppToast.error('Erreur lors de la suppression');
    }
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
                      gradient: const LinearGradient(colors: AppColors.adGradient),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.layers_outlined,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Documents',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.slate900,
                          ),
                        ),
                        Text(
                          'Déclarations d\'archivage ordinaire',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.slate500),
                        ),
                      ],
                    ),
                  ),
                  AppButton.secondary(
                    icon: Icons.manage_search,
                    size: AppButtonSize.sm,
                    onPressed: () =>
                        context.push('/recherche-avancee-document'),
                  ),
                  const SizedBox(width: 8),
                  AppButton(
                    label: 'Nouveau',
                    icon: Icons.add,
                    size: AppButtonSize.sm,
                    onPressed: () async {
                      await context.push('/addform?id=0');
                      _load(page: 1);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppSearchField(
                      hint: 'Rechercher un document...',
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
          child: AppDataList<Declaration>(
            items: _items,
            loading: _loading,
            emptyMessage: 'Aucun document trouvé',
            emptyIcon: Icons.layers_outlined,
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
            itemBuilder: (context, d, index) {
              return InkWell(
                onTap: () => context.go('/detail-document/${d.id}'),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              d.intitule.isNotEmpty
                                  ? d.intitule
                                  : 'Déclaration #${d.id}',
                              style: const TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w600,
                                color: AppColors.slate800,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          AppBadge(
                            label: d.statut ? 'Actif' : 'Inactif',
                            variant: d.statut
                                ? AppBadgeVariant.success
                                : AppBadgeVariant.warning,
                          ),
                          AppActionMenu(
                            items: [
                              AppActionMenuItem(
                                label: 'Détails',
                                icon: Icons.visibility_outlined,
                                onTap: () =>
                                    context.go('/detail-document/${d.id}'),
                              ),
                              AppActionMenuItem(
                                label: 'Modifier',
                                icon: Icons.edit_outlined,
                                onTap: () async {
                                  await context.push('/addform?id=${d.id}');
                                  _load(page: _page);
                                },
                              ),
                              AppActionMenuItem(
                                label: 'Supprimer',
                                icon: Icons.delete_outline,
                                danger: true,
                                onTap: () => _delete(d),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 14,
                        runSpacing: 4,
                        children: [
                          _meta(Icons.tag, d.numDeclaration),
                          _meta(Icons.link, d.numReference),
                          _meta(Icons.business_outlined, d.directionLabel),
                          _meta(Icons.place_outlined, d.emplacementLabel),
                          _meta(Icons.calendar_today_outlined,
                              Fmt.dateTime(d.dateEnregistrement ?? d.createdAt)),
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

  Widget _meta(IconData icon, String value) {
    if (value.isEmpty || value == '—') return const SizedBox.shrink();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.slate400),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 11.5, color: AppColors.slate500),
        ),
      ],
    );
  }
}
