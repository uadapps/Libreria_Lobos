<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Etiqueta as LbEtiqueta;
class LbEtiquetasLibros extends Model
{
    use HasFactory;

    protected $table = 'LB_Etiquetas_Libros';

    protected $fillable = [
        'id_etiqueta',
        'id_libro',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // Relaciones
    public function etiqueta()
    {
        return $this->belongsTo(LbEtiqueta::class, 'id_etiqueta');
    }

    public function libro()
    {
        return $this->belongsTo(LbLibro::class, 'id_libro');
    }
}
