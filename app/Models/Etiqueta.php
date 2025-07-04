<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etiqueta extends Model
{
    use HasFactory;

    protected $table = 'LB_Etiquetas';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación muchos a muchos con libros
    public function libros()
    {
        return $this->belongsToMany(
            Libro::class,
            'LB_Etiquetas_Libros', // tabla pivote
            'id_etiqueta',         // foreign key de etiquetas
            'id_libro'             // foreign key de libros
        );
    }

    // Scope para etiquetas activas
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
       public function scopeBuscar($query, $termino)
    {
        return $query->where(function ($q) use ($termino) {
            $q->where('nombre', 'LIKE', "%{$termino}%")
              ->orWhere('descripcion', 'LIKE', "%{$termino}%");
        });
    }
}
