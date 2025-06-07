<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBMovimientoInventario extends Model
{
    protected $table = 'LB_movimientos_inventario';

    protected $fillable = [
        'libro_id',
        'tipo_movimiento',
        'cantidad',
        'origen',
        'destino',
        'fecha',
        'usuario_id',
        'motivo'
    ];

    public function libro()
    {
        return $this->belongsTo(LBLibro::class, 'libro_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id'); // asumiendo modelo User
    }
}
