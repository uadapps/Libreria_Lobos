<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBProveedor extends Model
{
    protected $table = 'LB_proveedores';
    protected $fillable = [
        'id',
        'nombre',
        'rfc',
        'regimen_fiscal',
        'contacto',
        'telefono',
        'email',
        'direccion',
        'codigo_postal',
        'terminos_pago',
        'activo',
    ];
 
    protected $casts = [
        'activo' => 'boolean',
    ];
 

   
    public function facturas()
    {
        return $this->hasMany(LBFacturasLibros::class, 'proveedor_id');
    }
}
