<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LBFacturasLibros extends Model
{
    protected $table = 'LB_facturas_libros';
    protected $fillable = [
 'id' ,
  'serie',
  'folio',
  'numero_factura',
  'uuid_fiscal',
  'proveedor_id',
  'fecha',
  'fecha_timbrado',
  'subtotal',
  'descuento',
  'impuestos',  
    'total',    
    'moneda',
    'tipo_cambio',
    'condiciones_pago',
    'metodo_pago',
    'forma_pago',
    'uso_cfdi',
    'tipo_comprobante',
    'lugar_expedicion',
    'exportacion',
    'no_certificado',
    'no_certificado_sat',
    'rfc_prov_certif',
    'estado',
    'observaciones',
    'archivo_xml',
    'archivo_pdf',
    'created_at',
    'updated_at',
    ];
    protected $casts = [
        'fecha' => 'datetime',
        'fecha_timbrado' => 'datetime',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuestos' => 'decimal:2',
        'total' => 'decimal:2',
        'tipo_cambio' => 'decimal:6',
    ];
    public function proveedor()
    {
        return $this->belongsTo(LBProveedor::class, 'proveedor_id');
    }
    public function libros()
    {
        return $this->hasMany(LBLibro::class, 'libro_id');
    }
}
