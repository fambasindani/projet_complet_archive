<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentScanne extends Model
{
    use HasFactory;

    /**
     * Nom de la table associée au modèle.
     *
     * @var string
     */
    protected $table = 'document_scannes';

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_fichier',
        'nom_original',
        'chemin_fichier',
        'dossier',
        'pages',
        'taille_mo',
        'type_document',
        'id_declaration',
        'id_classeur',
        'id_user',
        'scanned_at',
        'source_scanner',
        'uploaded_by',
        'metadata'
    ];

    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'pages' => 'integer',
        'taille_mo' => 'float',
        'scanned_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Les valeurs par défaut des attributs.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'pages' => 1,
        'taille_mo' => 0.00,
        'type_document' => 'pdf',
        'metadata' => '[]'
    ];

    /**
     * Relation avec la déclaration (si applicable).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function declaration(): BelongsTo
    {
        return $this->belongsTo(Declaration::class, 'id_declaration');
    }

    /**
     * Relation avec le classeur.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function classeur(): BelongsTo
    {
        return $this->belongsTo(Classeur::class, 'id_classeur');
    }

    /**
     * Relation avec l'utilisateur qui a uploadé.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(MonUtilisateur::class, 'uploaded_by');
    }

    /**
     * Obtenir l'URL complète du fichier.
     *
     * @return string
     */
    public function getFileUrlAttribute(): string
    {
        if (str_starts_with($this->chemin_fichier, 'http')) {
            return $this->chemin_fichier;
        }
        
        if (str_starts_with($this->chemin_fichier, 'storage/')) {
            return asset($this->chemin_fichier);
        }
        
        if (str_starts_with($this->chemin_fichier, '/')) {
            return url($this->chemin_fichier);
        }
        
        return asset('storage/' . $this->chemin_fichier);
    }

    /**
     * Obtenir le chemin physique absolu du fichier.
     *
     * @return string
     */
    public function getFilePathAttribute(): string
    {
        if (str_starts_with($this->chemin_fichier, 'storage/')) {
            return storage_path('app/public/' . substr($this->chemin_fichier, 8));
        }
        
        return storage_path('app/public/' . $this->chemin_fichier);
    }

    /**
     * Obtenir la taille formatée.
     *
     * @return string
     */
    public function getFormattedSizeAttribute(): string
    {
        $size = $this->taille_mo;
        
        if ($size < 1) {
            return round($size * 1024, 2) . ' KB';
        }
        
        if ($size < 1024) {
            return round($size, 2) . ' MB';
        }
        
        return round($size / 1024, 2) . ' GB';
    }

    /**
     * Vérifier si le fichier existe physiquement.
     *
     * @return bool
     */
    public function fileExists(): bool
    {
        return file_exists($this->file_path);
    }

    /**
     * Scope pour les documents d'un classeur spécifique.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $classeurId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByClasseur($query, int $classeurId)
    {
        return $query->where('id_classeur', $classeurId);
    }

    /**
     * Scope pour les documents d'une déclaration spécifique.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $declarationId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByDeclaration($query, int $declarationId)
    {
        return $query->where('id_declaration', $declarationId);
    }

    /**
     * Scope pour les documents récents.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $days
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope pour les documents scannés (avec source scanner).
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeScanned($query)
    {
        return $query->whereNotNull('source_scanner');
    }

    /**
     * Boot du modèle.
     */
    protected static function boot()
    {
        parent::boot();

        // Avant la suppression, supprimer le fichier physique
        static::deleting(function ($document) {
            if ($document->fileExists()) {
                @unlink($document->file_path);
            }
        });
    }
}