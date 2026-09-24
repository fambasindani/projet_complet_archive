import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/crud/reference_crud_page.dart';
import '../widgets/ui/app_layout_widgets.dart';

class ClasseurPage extends StatelessWidget {
  const ClasseurPage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = ClasseurService();
    return ReferenceCrudPage<Classeur>(
      title: 'Gestion des Classeurs',
      subtitle: 'Organisez vos classeurs d\'archivage',
      itemLabel: 'Classeur',
      icon: Icons.folder_outlined,
      gradient: AppColors.adGradient,
      idOf: (c) => c.id.toString(),
      nameOf: (c) => c.nomClasseur,
      activeOf: (c) => c.statut,
      statsLoader: () async =>
          (await service.list(page: 1, perPage: 1000)).data,
      detailBuilder: (c) => Column(
        children: [
          AppDetailRow(label: 'Nom du classeur', value: c.nomClasseur),
          AppDetailRow(label: 'Statut', value: c.statut ? 'Actif' : 'Inactif'),
          AppDetailRow(label: 'Créé le', value: Fmt.dateTime(c.createdAt)),
        ],
      ),
      fetch: (page, perPage, search) => search.isEmpty
          ? service.list(page: page, perPage: perPage)
          : service.search(search, page: page, perPage: perPage),
      fields: const [
        CrudFieldSpec(
            key: 'nom_classeur',
            label: 'Nom du classeur',
            hint: 'Ex: Classeur 2026',
            required: true,
            icon: Icons.folder_outlined),
      ],
      initialValues: (c) => {'nom_classeur': c.nomClasseur},
      save: (payload, id) async {
        if (id == null) {
          await service.create(payload);
        } else {
          await service.update(id, payload);
        }
      },
      remove: (c) => service.remove(c.id),
      columns: const [],
    );
  }
}
