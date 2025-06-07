<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBInventario extends Model
{
    protected $table = 'LB_inventario';

    protected $fillable = ['libro_id', 'ubicacion_id', 'cantidad', 'updated_at'];

    public function libro()
    {
        return $this->belongsTo(LBLibro::class, 'libro_id');
    }

    public function ubicacion()
    {
        return $this->belongsTo(LBUbicacion::class, 'ubicacion_id');
    }
}
