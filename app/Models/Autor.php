<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Autor extends Model
{
    use HasFactory;

    protected $table = 'LB_autores';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nombre',
        'seudonimo',
        'nacionalidad',
        'biografia',
        'fecha_nacimiento',
        'fecha_muerte',
        'activo',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'fecha_muerte' => 'date',
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación uno a muchos con libros
    public function libros()
    {
        return $this->hasMany(Libro::class, 'id_autor');
    }

  

    // Scope para autores activos
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
 public function scopeBuscar($query, $termino)
    {
        return $query->where(function ($q) use ($termino) {
            $q->where('nombre', 'LIKE', "%{$termino}%")
              ->orWhere('seudónimo', 'LIKE', "%{$termino}%");
        });
    }
    // Scope para autores vivos
    public function scopeVivo($query)
    {
        return $query->whereNull('fecha_muerte');
    }

       public function getNombreCompletoAttribute()
    {
        if ($this->seudónimo) {
            return "{$this->nombre} ({$this->seudónimo})";
        }
        return $this->nombre;
    }

    public function getNombreParaMostrarAttribute()
    {
        return $this->seudónimo ?: $this->nombre;
    }
}
