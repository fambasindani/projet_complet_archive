import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../providers/auth_provider.dart';
import '../services/dashboard_service.dart';
import '../utils/formatters.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_input.dart';
import '../widgets/ui/app_layout_widgets.dart';
import '../widgets/ui/app_toast.dart';

class ProfilPage extends StatefulWidget {
  const ProfilPage({super.key});

  @override
  State<ProfilPage> createState() => _ProfilPageState();
}

class _ProfilPageState extends State<ProfilPage> {
  final _service = ProfilService();
  final _nom = TextEditingController();
  final _prenom = TextEditingController();
  final _email = TextEditingController();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  int? _userId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nom.dispose();
    _prenom.dispose();
    _email.dispose();
    _currentPassword.dispose();
    _newPassword.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = await _service.me();
      _userId = user.id;
      _nom.text = user.nom;
      _prenom.text = user.prenom;
      _email.text = user.email;
    } catch (_) {
      AppToast.error('Erreur lors du chargement du profil');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (_userId == null) return;
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'nom': _nom.text.trim(),
        'prenom': _prenom.text.trim(),
        'email': _email.text.trim(),
      };
      if (_newPassword.text.isNotEmpty) {
        payload['current_password'] = _currentPassword.text;
        payload['password'] = _newPassword.text;
      }
      await _service.update(_userId!, payload);
      if (!mounted) return;
      await context.read<AuthProvider>().refresh();
      AppToast.success('Profil mis à jour');
      _currentPassword.clear();
      _newPassword.clear();
    } catch (e) {
      AppToast.error('Erreur lors de la mise à jour');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    if (_loading) return const AppLoading();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppCard(
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                      colors: ArchiveModule.gradient(auth.module)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    user?.initials ?? '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.displayName ?? 'Utilisateur',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.slate900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(
                          fontSize: 12.5, color: AppColors.slate500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.roleName ?? 'Utilisateur',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          title: 'Informations',
          leading: const Icon(Icons.person_outline,
              size: 18, color: AppColors.primary600),
          child: Column(
            children: [
              AppInput(label: 'Nom', controller: _nom, icon: Icons.person_outline),
              const SizedBox(height: 14),
              AppInput(
                  label: 'Prénom',
                  controller: _prenom,
                  icon: Icons.person_outline),
              const SizedBox(height: 14),
              AppInput(
                label: 'Email',
                controller: _email,
                icon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          title: 'Sécurité',
          leading:
              const Icon(Icons.lock_outline, size: 18, color: AppColors.primary600),
          child: Column(
            children: [
              AppInput(
                label: 'Mot de passe actuel',
                controller: _currentPassword,
                obscure: true,
                icon: Icons.lock_outline,
              ),
              const SizedBox(height: 14),
              AppInput(
                label: 'Nouveau mot de passe',
                controller: _newPassword,
                obscure: true,
                icon: Icons.lock_reset_outlined,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          title: 'Détails',
          leading: const Icon(Icons.info_outline,
              size: 18, color: AppColors.primary600),
          child: Column(
            children: [
              AppDetailRow(label: 'Module', value: auth.moduleLabel),
              AppDetailRow(
                  label: 'Départements',
                  value: auth.departements.isEmpty
                      ? '-'
                      : auth.departements.map((d) => d.nom).join(', ')),
              AppDetailRow(
                  label: 'Dernière connexion',
                  value: Fmt.dateTime(user?.dernierconnection)),
            ],
          ),
        ),
        const SizedBox(height: 20),
        AppButton(
          label: 'Enregistrer les modifications',
          icon: Icons.save_outlined,
          loading: _saving,
          expand: true,
          size: AppButtonSize.lg,
          onPressed: _save,
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
