import 'package:flutter/material.dart';

/// Couleurs de l'application.
class AppColors {
  AppColors._();

  static const Color primary50 = Color(0xFFEEF2FF);
  static const Color primary100 = Color(0xFFE0E7FF);
  static const Color primary200 = Color(0xFFC7D2FE);
  static const Color primary300 = Color(0xFFA5B4FC);
  static const Color primary400 = Color(0xFF818CF8);
  static const Color primary500 = Color(0xFF6366F1);
  static const Color primary600 = Color(0xFF4F46E5);
  static const Color primary700 = Color(0xFF4338CA);
  static const Color primary800 = Color(0xFF3730A3);
  static const Color primary900 = Color(0xFF312E81);

  static const Color sidebarBg = Color(0xFF0F172A);
  static const Color sidebarText = Color(0xFF94A3B8);
  static const Color sidebarActive = Color(0xFF1E293B);

  static const Color surface = Color(0xFFF6F8FB);
  static const Color card = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);

  static const Color success = Color(0xFF10B981);
  static const Color successBg = Color(0xFFECFDF5);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerBg = Color(0xFFFEF2F2);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningBg = Color(0xFFFFFBEB);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoBg = Color(0xFFEFF6FF);

  /// Dégradés des modules.
  static const List<Color> adGradient = [Color(0xFF3B82F6), Color(0xFF4F46E5)];
  static const List<Color> npGradient = [Color(0xFF10B981), Color(0xFF0D9488)];

  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate50 = Color(0xFFF8FAFC);
}

/// Modules de la plateforme d'archivage.
class ArchiveModule {
  ArchiveModule._();
  static const String ad = 'ad';
  static const String np = 'np';

  static String label(String? module) =>
      module == np ? 'Note de Perception' : 'Archivage Ordinaire';

  static String brand(String? module) =>
      module == np ? 'Archiv-NP' : 'Archiv-Docs';

  static List<Color> gradient(String? module) =>
      module == np ? AppColors.npGradient : AppColors.adGradient;
}

/// Codes de permissions utilisés par les menus.
class Permissions {
  Permissions._();
  static const String dashboard = 'dashboard';
  static const String configuration = 'configuration';
  static const String direction = 'direction';
  static const String classeur = 'classeur';
  static const String centre = 'centre';
  static const String emplacement = 'emplacement';
  static const String servAssiette = 'serv_assiette';
  static const String archivDoc = 'archiv_doc';
  static const String accederDocument = 'acceder_au__document';
  static const String notePerception = 'note_perception';
  static const String accederNote = 'acceder_au_note_perception';
  static const String utilisateur = 'utilisateur';
}
