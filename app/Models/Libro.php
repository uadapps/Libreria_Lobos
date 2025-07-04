<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Etiqueta as LbEtiqueta;
class Libro extends Model
{
    use HasFactory;

    protected $table = 'libros'; // Ajusta según tu tabla principal
    protected $primaryKey = 'id';

    protected $fillable = [
        'isbn',
        'titulo',
        'año',
        'precio_compra',
        'precio_venta',
        'autor_id',
        'editorial_id',
        'edicion',
        'paginas',
        'descripcion',
        'imagen_url',
        'activo',
        // Campos adicionales de factura
        'cantidad',
        'valor_unitario',
        'descuento',
        'folio',
        'fecha_factura',
        'fuente',
    ];

    protected $casts = [
        'año' => 'integer',
        'precio_compra' => 'decimal:2',
        'precio_venta' => 'decimal:2',
        'valor_unitario' => 'decimal:2',
        'descuento' => 'decimal:2',
        'cantidad' => 'integer',
        'activo' => 'boolean',
        'fecha_factura' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación muchos a uno con autor
    public function autor()
    {
        return $this->belongsTo(Autor::class, 'autor_id');
    }

    // Relación muchos a uno con editorial
    public function editorial()
    {
        return $this->belongsTo(Editorial::class, 'editorial_id');
    }

    // Relación muchos a muchos con etiquetas
    public function etiquetas()
    {
        return $this->belongsToMany(
            Etiqueta::class,
            'LB_Etiquetas_Libros',
            'id_libro',
            'id_etiqueta'
        );
    }

    // Accessor para calcular total
    public function getTotalAttribute()
    {
        return ($this->valor_unitario * $this->cantidad) - $this->descuento;
    }

    // Scope para libros activos
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    // Scope para buscar por ISBN
    public function scopePorIsbn($query, $isbn)
    {
        return $query->where('isbn', $isbn);
    }

    // Scope para buscar por título
    public function scopePorTitulo($query, $titulo)
    {
        return $query->where('titulo', 'like', "%{$titulo}%");
    }

    // Método para obtener información completa
    public function getInformacionCompletaAttribute()
    {
        return [
            'titulo' => $this->titulo,
            'autor' => $this->autor?->nombre_completo,
            'editorial' => $this->editorial?->nombre,
            'año' => $this->año,
            'isbn' => $this->isbn,
            'etiquetas' => $this->etiquetas->pluck('nombre')->toArray(),
        ];
    }
     public function getImagenUrlCompletaAttribute()
    {
        if ($this->imagen_url) {
            if (str_starts_with($this->imagen_url, 'http')) {
                return $this->imagen_url;
            }
            return asset('storage/' . $this->imagen_url);
        }
        return asset('images/libro-placeholder.png');
    }

    public function getEtiquetasTextoAttribute()
    {
        return $this->etiquetas->pluck('nombre')->implode(', ');
    }

    // Métodos auxiliares
    public function agregarEtiqueta($etiquetaNombre)
    {
        $etiqueta = LbEtiqueta::firstOrCreate(
            ['nombre' => $etiquetaNombre],
            ['descripción' => '', 'activo' => true]
        );

        $this->etiquetas()->syncWithoutDetaching([$etiqueta->id]);
    }

    public function sincronizarEtiquetas(array $etiquetasNombres)
    {
        $etiquetasIds = [];

        foreach ($etiquetasNombres as $nombre) {
            $etiqueta = LbEtiqueta::firstOrCreate(
                ['nombre' => trim($nombre)],
                ['descripción' => '', 'activo' => true]
            );
            $etiquetasIds[] = $etiqueta->id;
        }

        $this->etiquetas()->sync($etiquetasIds);
    }
}

