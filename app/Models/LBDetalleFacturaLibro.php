<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBDetalleFacturaLibro extends Model
{
    protected $table = 'LB_detalles_factura_libros';

    protected $fillable = [
        'factura_id',
        'libro_id',
        'cantidad',
        'precio_unitario'
    ];

    public function libro()
    {
        return $this->belongsTo(LBLibro::class, 'libro_id');
    }

    public function factura()
    {
        return $this->belongsTo(LBFacturaLibro::class, 'factura_id');
    }
}
