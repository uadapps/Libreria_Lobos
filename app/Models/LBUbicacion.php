<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBUbicacion extends Model
{
    protected $table = 'LB_ubicaciones';

    protected $fillable = ['nombre', 'tipo_id', 'descripcion'];

    public function tipo()
    {
        return $this->belongsTo(LBTipoUbicacion::class, 'tipo_id');
    }

    public function inventario()
    {
        return $this->hasMany(LBInventario::class, 'ubicacion_id');
    }
}
