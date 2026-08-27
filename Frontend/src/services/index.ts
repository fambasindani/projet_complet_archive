/**
 * Barrel services — import via: import { authService, userService } from '@/services'
 * Couvre 100% des routes backend (routes/api.php)
 */
export { default as api, API_BASE_URL } from './api';
export { default as authService } from './auth.service';
export { default as userService } from './user.service';
export { default as roleService } from './role.service';
export { default as permissionService } from './permission.service';
export { default as departementService } from './departement.service';
export { default as classeurService } from './classeur.service';
export { default as emplacementService } from './emplacement.service';
export { default as centreService } from './centre.service';
export { default as assujettiService } from './assujetti.service';
export { default as articleService } from './article.service';
export { default as declarationService, documentDeclarationService } from './declaration.service';
export { default as notePerceptionService } from './notePerception.service';
export { default as scanService } from './scan.service';
export { default as profilService } from './profil.service';
export { default as publicService } from './public.service';
export { default as moduleService } from './module.service';
export { default as dashboardService } from './dashboard.service';
export { default as directionService } from './direction.service';
