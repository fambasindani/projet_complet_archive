import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/crud/reference_crud_page.dart';
import '../widgets/ui/app_layout_widgets.dart';

class DirectionPage extends StatelessWidget {
  const DirectionPage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = DirectionService();
    return ReferenceCrudPage<Direction>(
      title: 'Gestion des Directions',
      subtitle: 'Gérez les directions de votre organisation',
      itemLabel: 'Direction',
      icon: Icons.business_outlined,
      gradient: AppColors.adGradient,
      idOf: (d) => d.id.toString(),
      nameOf: (d) => d.nom,
      activeOf: (d) => d.statut,
      statsLoader: () async =>
          (await service.list(page: 1, perPage: 1000)).data,
      detailBuilder: (d) => Column(
        children: [
          AppDetailRow(label: 'Nom', value: d.nom),
          AppDetailRow(label: 'Statut', value: d.statut ? 'Active' : 'Inactive'),
          AppDetailRow(label: 'Créée le', value: Fmt.dateTime(d.createdAt)),
        ],
      ),
      fetch: (page, perPage, search) => search.isEmpty
          ? service.list(page: page, perPage: perPage)
          : service.search(search, page: page, perPage: perPage),
      fields: const [
        CrudFieldSpec(
            key: 'nom',
            label: 'Nom',
            hint: 'Nom de la direction',
            required: true,
            icon: Icons.business_outlined),
        CrudFieldSpec(
            key: 'sigle', label: 'Sigle', hint: 'Ex: DGI', icon: Icons.tag),
      ],
      initialValues: (d) => {'nom': d.nom},
      save: (payload, id) async {
        if (id == null) {
          await service.create(payload);
        } else {
          await service.update(id, payload);
        }
      },
      remove: (d) => service.remove(d.id),
      columns: const [],
    );
  }
}
