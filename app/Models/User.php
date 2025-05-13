<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use Notifiable, HasFactory;

    // 🔁 Esta es tu tabla real
    protected $table = 'LB_usuarios';

    // 🧠 Ajusta esto si tu PK no se llama 'id'
    protected $primaryKey = 'id_empleado';

    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'id_empleado',
        'nombres',
        'apellidos',
        'username',
        'email',
        'mobile',
        'password',
        'avatar',
        'visible',
        'status',
        'last_login_at',
        'role_id',
        'created_by',
        'updated_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'visible' => 'boolean',
        'status' => 'boolean',
    ];

    public $timestamps = false;
    public function getNombreCompletoAttribute()
    {
        return "{$this->nombres} {$this->apellidos}";
    }
    public function setPasswordAttribute($value)
    {
        if (!empty($value) && !Hash::needsRehash($value)) {
            $this->attributes['password'] = bcrypt($value);
        } else {
            $this->attributes['password'] = $value;
        }
    }
    protected $appends = ['full_name'];

    public function getFullNameAttribute()
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
