<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBTipoUbicacion extends Model
{
    protected $table = 'LB_tipos_ubicacion';

    protected $fillable = ['nombre', 'descripcion'];

    public function ubicaciones()
    {
        return $this->hasMany(LBUbicacion::class, 'tipo_id');
    }
}

