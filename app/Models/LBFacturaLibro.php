<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBFacturaLibro extends Model
{
    protected $table = 'LB_facturas_libros';
    protected $fillable = [
        'numero_factura',
        'proveedor_id',
        'fecha',
        'observaciones'
    ];
    public function proveedor()
    {
        return $this->belongsTo(LBProveedor::class, 'proveedor_id');
    }
    public function detalles()
    {
        return $this->hasMany(LBDetalleFacturaLibro::class, 'factura_id');
    }
}
