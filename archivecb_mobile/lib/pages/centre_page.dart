import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/crud/reference_crud_page.dart';
import '../widgets/ui/app_layout_widgets.dart';

class CentrePage extends StatelessWidget {
  const CentrePage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = CentreService();
    return ReferenceCrudPage<CentreOrdonnancement>(
      title: 'Centres d\'ordonnancement',
      subtitle: 'Gérez les centres de votre module NP',
      itemLabel: 'Centre',
      icon: Icons.home_work_outlined,
      gradient: AppColors.npGradient,
      idOf: (c) => c.id.toString(),
      nameOf: (c) => c.nom,
      activeOf: (c) => c.statut == null || c.statut == 'actif',
      statsLoader: () async =>
          (await service.list(page: 1, perPage: 1000)).data,
      detailBuilder: (c) => Column(
        children: [
          AppDetailRow(label: 'Nom', value: c.nom),
          AppDetailRow(label: 'Description', value: c.description ?? '-'),
          AppDetailRow(label: 'Créé le', value: Fmt.dateTime(c.createdAt)),
        ],
      ),
      fetch: (page, perPage, search) => search.isEmpty
          ? service.list(page: page, perPage: perPage)
          : service.search(search, page: page, perPage: perPage),
      fields: const [
        CrudFieldSpec(
            key: 'nom',
            label: 'Nom du centre',
            required: true,
            icon: Icons.home_work_outlined),
        CrudFieldSpec(
            key: 'description',
            label: 'Description',
            icon: Icons.notes_outlined),
      ],
      initialValues: (c) => {
        'nom': c.nom,
        'description': c.description ?? '',
      },
      save: (payload, id) async {
        if (id == null) {
          await service.create(payload);
        } else {
          await service.update(id, payload);
        }
      },
      remove: (c) => service.remove(c.id),
      onTap: (c) => context.go('/listenote/${c.id}'),
      columns: const [],
    );
  }
}
