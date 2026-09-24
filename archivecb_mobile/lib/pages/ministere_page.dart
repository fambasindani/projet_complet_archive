import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/note_perception.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/crud/reference_crud_page.dart';
import '../widgets/ui/app_layout_widgets.dart';

class MinisterePage extends StatelessWidget {
  const MinisterePage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = ArticleService();
    return ReferenceCrudPage<ArticleBudgetaire>(
      title: 'Service d\'assiette',
      subtitle: 'Gestion des articles budgétaires',
      itemLabel: 'Article',
      icon: Icons.description_outlined,
      gradient: AppColors.npGradient,
      idOf: (a) => a.id.toString(),
      nameOf: (a) => a.nom.isNotEmpty ? a.nom : a.articleBudgetaire,
      statsLoader: () async =>
          (await service.list(page: 1, perPage: 1000)).data,
      detailBuilder: (a) => Column(
        children: [
          AppDetailRow(label: 'Nom', value: a.nom),
          AppDetailRow(
              label: 'Article budgétaire', value: a.articleBudgetaire),
          AppDetailRow(label: 'Créé le', value: Fmt.dateTime(a.createdAt)),
        ],
      ),
      fetch: (page, perPage, search) => search.isEmpty
          ? service.list(page: page, perPage: perPage)
          : service.search(search, page: page, perPage: perPage),
      fields: const [
        CrudFieldSpec(
            key: 'article_budgetaire',
            label: 'Article budgétaire',
            hint: 'Ex: 601',
            icon: Icons.tag),
        CrudFieldSpec(
            key: 'nom',
            label: 'Nom',
            hint: 'Intitulé de l\'article',
            required: true,
            icon: Icons.description_outlined),
      ],
      initialValues: (a) => {
        'article_budgetaire': a.articleBudgetaire,
        'nom': a.nom,
      },
      save: (payload, id) async {
        if (id == null) {
          await service.create(payload);
        } else {
          await service.update(id, payload);
        }
      },
      remove: (a) => service.remove(a.id),
      columns: [
        CrudColumnSpec<ArticleBudgetaire>(
          label: 'Code',
          build: (a) => Text(
            a.articleBudgetaire,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.primary600,
            ),
          ),
        ),
      ],
    );
  }
}
