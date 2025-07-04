<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBDetalleFacturasLibros extends Model
{
    protected $table = 'LB_detalles_factura_libros';

    protected $fillable = [
        'factura_id',
        'libro_id',
        'clave_prodserv',
        'descripcion',
        'unidad',
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal',
        'impuesto_trasladado',
        'total',
    ];
    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'descuento' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'impuesto_trasladado' => 'decimal:2',
        'total' => 'decimal:2',
    ];
    public function libro()
    {
        return $this->belongsTo(LBLibro::class, 'libro_id');
    }

    public function factura()
    {
        return $this->belongsTo(LBFacturasLibros::class, 'factura_id');
    }
}
