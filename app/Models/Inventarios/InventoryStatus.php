// app/Models/InventoryStatus.php
<?php

namespace App\Models\Inventarios;

use Illuminate\Database\Eloquent\Model;

class InventoryStatus extends Model
{
    protected $table = 'LB_status_inventario';
    
    protected $fillable = ['nombre', 'descripcion'];

    public $timestamps = false;
}