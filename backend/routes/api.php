<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CentreOrdonnancementController;
use App\Http\Controllers\ClasseurController;
use App\Http\Controllers\EmplacementController;
use App\Http\Controllers\DirectionController;
use App\Http\Controllers\AssujettiController;
use App\Http\Controllers\NotePerceptionController;
use App\Http\Controllers\DocumentNotePerceptionController;
use App\Http\Controllers\DeclarationController;
use App\Http\Controllers\DocumentDeclarationController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\ArticleBudgetaireController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfilController;
use App\Http\Controllers\MonUtilisateurController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\DashboardNoteController;
use App\Http\Controllers\ScanController;
use App\Http\Controllers\PublicStatsController;
use App\Http\Controllers\LogController;

/*
|--------------------------------------------------------------------------
| API Routes - GS-Archive (refactorisé)
|--------------------------------------------------------------------------
| Public: /public/*, /ping, POST /connexion (throttle)
| Protected: tout le reste sous auth:sanctum + permissions
*/

// ============ PUBLIC ============
Route::prefix('public')->group(function () {
    Route::get('/stats', [PublicStatsController::class, 'getHomeStats']);
    Route::get('/module/ad/stats', [PublicStatsController::class, 'getAdStats']);
    Route::get('/module/np/stats', [PublicStatsController::class, 'getNpStats']);
    Route::get('/modules', [PublicStatsController::class, 'getModulesInfo']);
    Route::get('/recent-activity', [PublicStatsController::class, 'getRecentActivity']);
    Route::get('/health', [PublicStatsController::class, 'getSystemHealth']);
});

Route::get('/ping', function () {
    return response()->json(['message' => 'pong','timestamp' => now(),'status' => 'API is running']);
});

// Login avec throttle anti brute-force (5 tentatives / minute)
Route::post('/connexion', [MonUtilisateurController::class, 'login'])->middleware('throttle:5,1');
Route::post('/logout', [MonUtilisateurController::class, 'logout'])->middleware('auth:sanctum');

// ============ PROTÉGÉ (auth:sanctum) ============
Route::middleware(['auth:sanctum'])->group(function () {

    // --- Dashboards Notes ---
    Route::prefix('dashboards/notes')->group(function () {
        Route::get('/statistics', [DashboardNoteController::class, 'statistics']);
        Route::get('/articles', [DashboardNoteController::class, 'getArticles']);
        Route::get('/assujettis', [DashboardNoteController::class, 'getAssujettis']);
        Route::get('/classeurs', [DashboardNoteController::class, 'getClasseurs']);
        Route::get('/centres', [DashboardNoteController::class, 'centres']);
        Route::get('/centres/{id}/notes', [DashboardNoteController::class, 'notesByCentre']);
        Route::get('/centres/{id}/stats', [DashboardNoteController::class, 'centreStats']);
        Route::get('/articles/{id}/stats', [DashboardNoteController::class, 'articleStats']);
        Route::get('/recent', [DashboardNoteController::class, 'recentActivities']);
        Route::post('/search', [DashboardNoteController::class, 'advancedSearch']);
    });

    // --- Scans (filesystem) ---
    Route::prefix('scans')->group(function () {
        Route::post('/upload', [ScanController::class, 'upload']);
        Route::post('/upload-multiple', [ScanController::class, 'uploadMultiple']);
        Route::get('/list', [ScanController::class, 'listScans']);
        Route::get('/search', [ScanController::class, 'search']);
        Route::get('/download/{filename}', [ScanController::class, 'download']);
        Route::delete('/delete/{filename}', [ScanController::class, 'delete']);
        Route::post('/cleanup', [ScanController::class, 'cleanup'])->middleware('permission:supprimer_scan');
        Route::get('/health', [ScanController::class, 'health']);
    });
    Route::post('/upload-scan', [ScanController::class, 'upload']);
    Route::get('/scans', [ScanController::class, 'listScans']);

    // --- Mon Utilisateurs ---
    Route::prefix('mon-utilisateurs')->group(function () {
        Route::get('/', [MonUtilisateurController::class, 'index']);
        Route::post('/', [MonUtilisateurController::class, 'store']);
        Route::get('/stats/general', [MonUtilisateurController::class, 'stats']);
        Route::get('/stats/recent', [MonUtilisateurController::class, 'recentUsers']);
        Route::get('/{id}/with-details', [MonUtilisateurController::class, 'getWithDetails']);
        Route::get('/{id}', [MonUtilisateurController::class, 'show']);
        Route::put('/{id}', [MonUtilisateurController::class, 'update']);
        Route::delete('/{id}', [MonUtilisateurController::class, 'destroy']);
        Route::post('/{id}/assign-roles', [MonUtilisateurController::class, 'assignRoles']);
        Route::post('/{id}/remove-role/{roleId}', [MonUtilisateurController::class, 'removeRole']);
        Route::post('/{id}/assign-directions', [MonUtilisateurController::class, 'assignDirections']);
        Route::post('/{id}/remove-direction/{departementId}', [MonUtilisateurController::class, 'removeDirection']);
    });

    // --- Roles ---
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('/stats', [RoleController::class, 'stats']);
        Route::get('/{id}/with-details', [RoleController::class, 'showWithDetails']);
        Route::post('/{id}/assign-permissions', [RoleController::class, 'assignPermissions']);
        Route::post('/{id}/remove-permission/{permissionId}', [RoleController::class, 'removePermission']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
    });

    // --- Permissions ---
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::get('/{id}/used-by', [PermissionController::class, 'getUsedByRoles']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::put('/{id}', [PermissionController::class, 'update']);
        Route::delete('/{id}', [PermissionController::class, 'destroy']);
    });

    // --- Journal des activités ---
    Route::prefix('journal')->group(function () {
        Route::get('/', [LogController::class, 'index']);
        Route::get('/stats', [LogController::class, 'stats']);
        Route::get('/tables', [LogController::class, 'tables']);
        Route::get('/{id}', [LogController::class, 'show']);
    });

    // --- Départements ---
    Route::prefix('departements')->group(function () {
        Route::get('/', [DepartementController::class, 'index']);
        Route::post('/', [DepartementController::class, 'store']);
        Route::get('/stats/departement', [DepartementController::class, 'statdepartement']);
        Route::get('/{id}/with-details', [DepartementController::class, 'getWithDetails']);
        Route::get('/{id}/available-users', [DepartementController::class, 'getAvailableUsers']);
        Route::get('/{id}', [DepartementController::class, 'show']);
        Route::put('/{id}', [DepartementController::class, 'update']);
        Route::delete('/{id}', [DepartementController::class, 'destroy']);
        Route::post('/{id}/assign-user/{userId}', [DepartementController::class, 'assignUser']);
        Route::post('/{id}/remove-user/{userId}', [DepartementController::class, 'removeUser']);
    });

    // --- Dashboard général ---
    Route::prefix('dashboard')->group(function () {
        Route::get('/statistique', [MonUtilisateurController::class, 'dashboardStats']);
        Route::get('/recent-users', [MonUtilisateurController::class, 'recentUsers']);
        Route::get('/statistics', [DashboardController::class, 'statistics']);
        Route::get('/classifiers', [DashboardController::class, 'classifiers']);
        Route::get('/classifiers/direction/{id}', [DashboardController::class, 'classifiersByDirection']);
        Route::get('/recent', [DashboardController::class, 'recentActivities']);
        Route::get('/direction/{id}', [DashboardController::class, 'directionStats']);
        Route::post('/search', [DashboardController::class, 'advancedSearch']);
    });

    // --- Profil ---
    Route::prefix('profil')->group(function () {
        Route::get('/mon-profil', [ProfilController::class, 'monProfil']);
        Route::get('/utilisateurs/{id}', [ProfilController::class, 'show']);
        Route::put('/modifier/{id}', [ProfilController::class, 'modifierProfil']);
        Route::get('/afficher/{id}', [ProfilController::class, 'afficherProfil']);
        Route::get('/avatar/{filename}', [ProfilController::class, 'getAvatar']);
    });

    // --- Modules ---
    Route::get('/modules', [ModuleController::class, 'Getmodule']);
    Route::get('/modules/search', [ModuleController::class, 'searchmodule']);
    Route::post('/modules', [ModuleController::class, 'createmodule']);
    Route::get('/modules/{id}', [ModuleController::class, 'editemodule']);
    Route::put('/modules/{id}', [ModuleController::class, 'updatemodule']);
    Route::delete('/modules/{id}', [ModuleController::class, 'destroy']);
    Route::get('/declaration-dashboard', [DashboardController::class, 'getDeclarationSummary']);
    Route::post('/declaration-search', [DashboardController::class, 'Searchdeclaration']);
    Route::get('/note-perception-dashboard', [DashboardController::class, 'getNotePerceptionCountByCentre']);
    Route::get('/note-perception-dashboard/{id}', [DashboardController::class, 'getNotePerceptionCountByCentre_id']);

    // --- Document Déclaration (PDF + OCR) ---
    Route::post('/documents-declaration/upload-multiple', [DocumentDeclarationController::class, 'uploadMultiple']);
    Route::get('/documents/{id}', [DocumentDeclarationController::class, 'getallpdf']);
    Route::put('/documents-declaration/{id}/update-text', [DocumentDeclarationController::class, 'updateOCRText']);
    Route::get('/documents-declaration/{id}/text', [DocumentDeclarationController::class, 'getDocumentText']);
    Route::post('/documents-declaration/advanced-search/{id_direction}', [DocumentDeclarationController::class, 'advancedSearch']);
    Route::get('/documents-declaration/ocr-stats', [DocumentDeclarationController::class, 'getOCRStats']);

    // --- Déclarations ---
    Route::get('/declarations', [DeclarationController::class, 'getDeclarations']);
    Route::post('/declarations/search', [DeclarationController::class, 'searchDeclarations']);
    Route::post('/declarations', [DeclarationController::class, 'createdeclaration']);
    Route::put('/declarations/{id}', [DeclarationController::class, 'updatedeclaration']);
    Route::delete('/declarations/{id}', [DeclarationController::class, 'destroy']);
    Route::get('/editdeclaration/{id}', [DeclarationController::class, 'editdeclaration']);
    Route::get('/listedeclaration/{id}', [DeclarationController::class, 'getlistedocument']);
    Route::post('/listedeclaration/{id}', [DeclarationController::class, 'listedocumentdirectionall']);
    Route::post('/searchDeclarationsfiltres/{id}', [DeclarationController::class, 'searchDeclarationsfiltre']);
    Route::get('/details/{id}', [DeclarationController::class, 'editdeclaration']);

    // --- Centre Ordonnancement ---
    Route::get('centre_ordonnancements/all', [CentreOrdonnancementController::class, 'getAll']);
    Route::post('centre_ordonnancements/search', [CentreOrdonnancementController::class, 'searchcentre']);
    Route::post('centre_ordonnancements', [CentreOrdonnancementController::class, 'addcentre'])->middleware('permission:creer_centre');
    Route::get('centre_ordonnancements/{id}', [CentreOrdonnancementController::class, 'editcentre']);
    Route::put('centre_ordonnancements/{id}', [CentreOrdonnancementController::class, 'updatecentre'])->middleware('permission:modifier_centre');
    Route::delete('centre_ordonnancements/{id}', [CentreOrdonnancementController::class, 'supprimercentre']);
    Route::get('centre', [CentreOrdonnancementController::class, 'getcentre']);

    // --- Classeur ---
    Route::get('/classeurs', [ClasseurController::class, 'getAll']);
    Route::get('/classeurs/search', [ClasseurController::class, 'searchClasseur']);
    Route::post('/classeurs', [ClasseurController::class, 'addClasseur'])->middleware('permission:creer_classeur');
    Route::get('/classeurs/{id}', [ClasseurController::class, 'editClasseur']);
    Route::put('/classeurs/{id}', [ClasseurController::class, 'updateClasseur'])->middleware('permission:modifier_classeur');
    Route::delete('/classeurs/{id}', [ClasseurController::class, 'supprimerClasseur'])->middleware('permission:supprimer_classeur');
    Route::get('/classeur', [ClasseurController::class, 'getAllclasseur']);

    // --- Emplacement ---
    Route::get('/emplacements', [EmplacementController::class, 'getAll']);
    Route::get('/emplacements/search', [EmplacementController::class, 'searchEmplacement']);
    Route::post('/emplacements', [EmplacementController::class, 'addEmplacement'])->middleware('permission:creer_emplacement');
    Route::get('/emplacements/{id}', [EmplacementController::class, 'editEmplacement']);
    Route::put('/emplacements/{id}', [EmplacementController::class, 'updateEmplacement'])->middleware('permission:modifier_emplacement');
    Route::delete('/emplacements/{id}', [EmplacementController::class, 'supprimerEmplacement'])->middleware('permission:supprimer_emplacement');
    Route::get('/emplacement', [EmplacementController::class, 'getAllemplacement']);

    // --- Direction (legacy) - TOUS sous auth + permission ---
    Route::post('/directions', [DirectionController::class, 'createdirection'])->middleware('permission:creer_direction');
    Route::put('/directions/{id}', [DirectionController::class, 'updatedirection'])->middleware('permission:modifier_direction');
    Route::delete('/directions/{id}', [DirectionController::class, 'deletedirection'])->middleware('permission:supprimer_direction');
    Route::get('/direction', [DirectionController::class, 'getAlldirection']);

    // --- Assujetti ---
    Route::get('/assujettis', [AssujettiController::class, 'getassujetti']);
    Route::get('/assujettis/search', [AssujettiController::class, 'searchassujetti']);
    Route::post('/assujettis', [AssujettiController::class, 'createassujetti']);
    Route::get('/assujettis/{id}', [AssujettiController::class, 'editassujetti']);
    Route::put('/assujettis/{id}', [AssujettiController::class, 'updateassujetti']);
    Route::delete('/assujettis/{id}', [AssujettiController::class, 'supprimerassujetti']);

    // --- Notes Perception ---
    Route::get('/notes', [NotePerceptionController::class, 'getNote']);
    Route::post('/notes/search', [NotePerceptionController::class, 'searchnote']);
    Route::post('/notes', [NotePerceptionController::class, 'createnote']);
    Route::get('/notes/{id}', [NotePerceptionController::class, 'editnote']);
    Route::put('/notes/{id}', [NotePerceptionController::class, 'note']);
    Route::delete('/notes/{id}', [NotePerceptionController::class, 'deletenote']);
    Route::get('/noteid-searchnote/{id}', [NotePerceptionController::class, 'searchnote_idcentre']);
    Route::get('/note-centre/{id}', [NotePerceptionController::class, 'getNote_centre']);
    Route::post('/search-note/{id}', [NotePerceptionController::class, 'searchnote_id']);
    Route::post('/notes-perception/advanced-search', [NotePerceptionController::class, 'advancedSearch']);

    // --- Article Budgétaire ---
    Route::get('/article', [ArticleBudgetaireController::class, 'getArticle']);
    Route::get('/articleall', [ArticleBudgetaireController::class, 'getArticleAll']);
    Route::post('/search-article', [ArticleBudgetaireController::class, 'searchArticle']);
    Route::post('/create-article', [ArticleBudgetaireController::class, 'creerArticle'])->middleware('permission:creer_service_assiette');
    Route::get('/edit-article/{id}', [ArticleBudgetaireController::class, 'editArticle']);
    Route::put('/update-article/{id}', [ArticleBudgetaireController::class, 'updateArticle'])->middleware('permission:modifier_service_assiette');
    Route::delete('delete-article/{id}', [ArticleBudgetaireController::class, 'deleteArticle'])->middleware('permission:supprimer_service_assiette');
});

// --- Document Note Perception (public download/delete) ---
Route::get('/notes/downloads/{id}', [DocumentNotePerceptionController::class, 'download']);
Route::get('/notes/download/{id}', [DocumentNotePerceptionController::class, 'getallpdf']);
Route::delete('/notes/delete/{id}', [DocumentNotePerceptionController::class, 'deleteDocument']);
Route::post('/notes/upload', [DocumentNotePerceptionController::class, 'uploadMultiple']);
Route::put('/notes/{id}/update-text', [DocumentNotePerceptionController::class, 'updateOCRText']);

// --- Document Déclaration (public download/delete) ---
Route::get('/documents-declaration/download/{id}', [DocumentDeclarationController::class, 'download']);
Route::delete('/delete-document/{id}', [DocumentDeclarationController::class, 'deleteDocument']);
