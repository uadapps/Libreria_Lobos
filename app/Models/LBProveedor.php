<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBProveedor extends Model
{
    protected $table = 'LB_proveedores';
    protected $fillable = [
        'nombre',
        'contacto',
        'telefono',
        'correo',
        'direccion',
        'created_at',
        'updated_at'
    ];

    public function facturas()
    {
        return $this->hasMany(LBFacturaLibro::class, 'proveedor_id');
    }
}
