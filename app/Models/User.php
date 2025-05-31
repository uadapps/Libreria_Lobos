<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Models\Role;


class User extends Authenticatable
{
use HasApiTokens, HasFactory, Notifiable, HasRoles;
    protected $table = 'LB_usuarios';
    protected $primaryKey = 'id';
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
        'remember_token',
    ];
    protected $guard_name = 'web';
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
    public function role()
{
    return $this->belongsTo(Role::class, 'role_id');
}
}
