<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBLibro extends Model
{
    protected $table = 'LB_libros';

    protected $fillable = [
        'isbn',
        'titulo',
        'editorial_id',
        'edicion',
        'anio',
        'genero',
        'precio_compra',
        'precio_venta',
        'autor'
    ];

    public function detallesFactura()
    {
        return $this->hasMany(LBDetalleFacturaLibro::class, 'libro_id');
    }

    public function inventario()
    {
        return $this->hasMany(LBInventario::class, 'libro_id');
    }
}
