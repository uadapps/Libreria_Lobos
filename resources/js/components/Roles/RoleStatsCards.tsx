// components/Roles/RoleStatsCardsNeon.tsx - VERSIÓN BONUS: NEON/CYBERPUNK (DUAL THEME)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Shield, UserCheck, Users } from 'lucide-react';
import { memo } from 'react';

interface StatsProps {
    totalRoles: number;
    totalPermisos: number;
    usuariosAsignados: number;
    rolesActivos: number;
}

const NeonStatsCard = memo(
    ({
        title,
        value,
        icon: Icon,
        neonColor,
        shadowColor,
    }: {
        title: string;
        value: number;
        icon: React.ElementType;
        neonColor: string;
        shadowColor: string;
        lightColor: string;
    }) => (
        <Card
            className={`border-2 bg-black bg-white/5 dark:bg-black ${neonColor} group relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105`}
            style={{
                boxShadow: `0 0 20px ${shadowColor}40, inset 0 0 20px ${shadowColor}10`,
            }}
        >
            {/* Efecto de brillo animado */}
            <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                style={{
                    background: `linear-gradient(135deg, ${shadowColor} 0%, ${shadowColor}50 100%)`,
                }}
            />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</CardTitle>
                <div className={`rounded-full border-2 p-2 ${neonColor} bg-white/10 backdrop-blur-sm dark:bg-black`}>
                    <Icon className="h-4 w-4 text-gray-800 dark:text-white" style={{ filter: `drop-shadow(0 0 8px ${shadowColor})` }} />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    style={{
                        textShadow: `0 0 10px ${shadowColor}, 0 0 20px ${shadowColor}, 0 0 30px ${shadowColor}`,
                    }}
                >
                    {value.toLocaleString()}
                </div>
            </CardContent>
        </Card>
    ),
);

NeonStatsCard.displayName = 'NeonStatsCard';

export const RoleStatsCards = memo(({ totalRoles, totalPermisos, usuariosAsignados, rolesActivos }: StatsProps) => (
    <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-100 p-4 md:grid-cols-2 lg:grid-cols-4 dark:border-gray-800 dark:bg-black">
        <NeonStatsCard title="Total Roles" value={totalRoles} icon={Shield} neonColor="border-cyan-400" shadowColor="#00ffff" lightColor="#0891b2" />
        <NeonStatsCard
            title="Total Permisos"
            value={totalPermisos}
            icon={Activity}
            neonColor="border-green-400"
            shadowColor="#00ff00"
            lightColor="#16a34a"
        />
        <NeonStatsCard
            title="Usuarios Asignados"
            value={usuariosAsignados}
            icon={Users}
            neonColor="border-purple-400"
            shadowColor="#ff00ff"
            lightColor="#9333ea"
        />
        <NeonStatsCard
            title="Roles Activos"
            value={rolesActivos}
            icon={UserCheck}
            neonColor="border-yellow-400"
            shadowColor="#ffff00"
            lightColor="#eab308"
        />
    </div>
));

RoleStatsCards.displayName = 'RoleStatsCards';
