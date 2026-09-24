import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/constants.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import '../widgets/ui/app_button.dart';
import '../widgets/ui/app_input.dart';
import '../widgets/ui/app_toast.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  String? _module;
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_email.text.trim().isEmpty) {
      setState(() => _error = 'L\'email est requis');
      return;
    }
    if (_password.text.isEmpty) {
      setState(() => _error = 'Le mot de passe est requis');
      return;
    }
    if (_password.text.length < 6) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setState(() => _loading = true);
    try {
      final auth = context.read<AuthProvider>();
      await auth.login(
        email: _email.text,
        password: _password.text,
        module: _module!,
      );
      AppToast.success('Bienvenue ${auth.user?.displayName ?? ''} !');
      if (mounted) {
        context.go(_module == ArchiveModule.np
            ? '/tableaudebordnote'
            : '/tableaudebord');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.status == 401
          ? 'Email ou mot de passe incorrect'
          : e.message);
    } catch (_) {
      setState(() => _error = 'Une erreur s\'est produite');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_module == null) return _buildModuleSelection();
    return _buildLoginForm();
  }

  // ─── Sélection du module ───
  Widget _buildModuleSelection() {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: const Icon(Icons.archive_outlined,
                        color: Colors.white, size: 34),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Plateforme d\'Archivage',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sélectionnez un module pour continuer',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 32),
                  _moduleCard(
                    icon: Icons.archive_outlined,
                    title: 'Archivage Ordinaire',
                    description:
                        'Documents administratifs, correspondances, rapports',
                    gradient: AppColors.adGradient,
                    onTap: () => setState(() => _module = ArchiveModule.ad),
                  ),
                  const SizedBox(height: 16),
                  _moduleCard(
                    icon: Icons.receipt_long_outlined,
                    title: 'Note de Perception',
                    description:
                        'Documents financiers, quittances, pièces comptables',
                    gradient: AppColors.npGradient,
                    onTap: () => setState(() => _module = ArchiveModule.np),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    '© ${DateTime.now().year} DGRAD - Tous droits réservés',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _moduleCard({
    required IconData icon,
    required String title,
    required String description,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 420),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 24,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: gradient),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    description,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.slate500),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios,
                size: 14, color: AppColors.slate400),
          ],
        ),
      ),
    );
  }

  // ─── Formulaire de connexion ───
  Widget _buildLoginForm() {
    final isNp = _module == ArchiveModule.np;
    final gradient = isNp ? AppColors.npGradient : AppColors.adGradient;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => setState(() {
                        _module = null;
                        _error = null;
                      }),
                      icon: const Icon(Icons.arrow_back, size: 16),
                      label: const Text('Changer de module'),
                      style: TextButton.styleFrom(foregroundColor: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    constraints: const BoxConstraints(maxWidth: 440),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x33000000),
                          blurRadius: 30,
                          offset: Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: gradient),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Icon(
                            isNp
                                ? Icons.receipt_long_outlined
                                : Icons.archive_outlined,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          ArchiveModule.label(_module),
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: AppColors.slate900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Connectez-vous avec vos identifiants DGRAD',
                          style: TextStyle(
                              fontSize: 13, color: AppColors.slate500),
                        ),
                        const SizedBox(height: 22),
                        if (_error != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.dangerBg,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFECACA)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline,
                                    color: AppColors.danger, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFFB91C1C)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        AppInput(
                          label: 'Email',
                          hint: 'email@dgrad.cd',
                          icon: Icons.mail_outline,
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          onChanged: (_) {
                            if (_error != null) setState(() => _error = null);
                          },
                        ),
                        const SizedBox(height: 16),
                        AppInput(
                          label: 'Mot de passe',
                          hint: '••••••••',
                          icon: Icons.lock_outline,
                          obscure: !_showPassword,
                          controller: _password,
                          textInputAction: TextInputAction.done,
                          suffix: IconButton(
                            icon: Icon(
                              _showPassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 18,
                              color: AppColors.slate400,
                            ),
                            onPressed: () =>
                                setState(() => _showPassword = !_showPassword),
                          ),
                          onChanged: (_) {
                            if (_error != null) setState(() => _error = null);
                          },
                        ),
                        const SizedBox(height: 22),
                        AppButton(
                          label: 'Se connecter',
                          icon: Icons.login,
                          loading: _loading,
                          expand: true,
                          size: AppButtonSize.lg,
                          onPressed: _submit,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Environnement sécurisé',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
