<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Editorial extends Model
{
    use HasFactory;

    protected $table = 'LB_editoriales';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nombre',
        'contacto',
        'telefono',
        'email',
        'direccion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function libros()
    {
        return $this->hasMany(Libro::class, 'editorial_id');
    }

    // Scope para editoriales activas
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

        public function scopeBuscar($query, $termino)
    {
        return $query->where(function ($q) use ($termino) {
            $q->where('nombre', 'LIKE', "%{$termino}%")
              ->orWhere('contacto', 'LIKE', "%{$termino}%")
              ->orWhere('email', 'LIKE', "%{$termino}%");
        });
    }

    // Método para obtener información de contacto
    public function getContactoCompletoAttribute()
    {
        $contacto = [];
        if ($this->email) $contacto[] = $this->email;
        if ($this->telefono) $contacto[] = $this->telefono;
        return implode(' | ', $contacto);
    }
}
