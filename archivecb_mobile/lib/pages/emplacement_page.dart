import 'package:flutter/material.dart';

import '../config/constants.dart';
import '../models/archivage.dart';
import '../services/reference_services.dart';
import '../utils/formatters.dart';
import '../widgets/crud/reference_crud_page.dart';
import '../widgets/ui/app_layout_widgets.dart';

class EmplacementPage extends StatelessWidget {
  const EmplacementPage({super.key});

  @override
  Widget build(BuildContext context) {
    final service = EmplacementService();
    return ReferenceCrudPage<Emplacement>(
      title: 'Gestion des Emplacements',
      subtitle: 'Localisez vos documents physiques',
      itemLabel: 'Emplacement',
      icon: Icons.place_outlined,
      gradient: AppColors.adGradient,
      idOf: (e) => e.id.toString(),
      nameOf: (e) => e.nomEmplacement,
      activeOf: (e) => e.statut,
      statsLoader: () async =>
          (await service.list(page: 1, perPage: 1000)).data,
      detailBuilder: (e) => Column(
        children: [
          AppDetailRow(label: 'Nom', value: e.nomEmplacement),
          AppDetailRow(label: 'Statut', value: e.statut ? 'Actif' : 'Inactif'),
          AppDetailRow(label: 'Créé le', value: Fmt.dateTime(e.createdAt)),
        ],
      ),
      fetch: (page, perPage, search) => search.isEmpty
          ? service.list(page: page, perPage: perPage)
          : service.search(search, page: page, perPage: perPage),
      fields: const [
        CrudFieldSpec(
            key: 'nom_emplacement',
            label: 'Nom de l\'emplacement',
            hint: 'Ex: Rayon A - Étagère 3',
            required: true,
            icon: Icons.place_outlined),
      ],
      initialValues: (e) => {'nom_emplacement': e.nomEmplacement},
      save: (payload, id) async {
        if (id == null) {
          await service.create(payload);
        } else {
          await service.update(id, payload);
        }
      },
      remove: (e) => service.remove(e.id),
      columns: const [],
    );
  }
}
