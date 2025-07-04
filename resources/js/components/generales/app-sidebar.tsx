import { usePage } from '@inertiajs/react';
import { NavFooter } from '@/components/generales/nav-footer';
import { NavMain } from '@/components/generales/nav-main';
import { NavUser } from '@/components/generales/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Plus,Warehouse } from 'lucide-react';
import AppLogo from './app-logo';

type AuthProps = {
    auth?: {
        permissions?: string[];
    };
};

export function AppSidebar() {
    const { props } = usePage<AuthProps>();
    const permisos = props.auth?.permissions || [];

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        ...(permisos.includes('usuarios.ver') || permisos.includes('roles.ver')
            ? [{
                  title: 'Usuarios y Roles',
                  icon: Folder,
                  children: [
                      ...(permisos.includes('usuarios.ver')
                          ? [{ title: 'Usuarios', href: '/usuarios', icon: Users }]
                          : []),
                      ...(permisos.includes('roles.ver')
                          ? [{ title: 'Roles', href: '/roles/gestion', icon: BookOpen }]
                          : []),
                  ],
              }]
            : []),
        ...(permisos.includes('inventario.gestionar')
            ? [{
                  title: 'Inventarios',
                  icon:  Warehouse,
                  children: [
                      ...(permisos.includes('inventario.periodos-listar')
                          ? [{ title: 'Ver Inventarios', href: '/inventario/periodos', icon: BookOpen }]
                          : []),
                        ...(permisos.includes('libros.factura-registrar')
                            ? [{ title: 'Añadir Productos', href: '/libros-factura', icon: Plus }]
                            : []),

                  ],
              }]
            : []),




    ];

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
