import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (title: string) => {
        setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel />
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.children ? (
                            <>
                                <SidebarMenuButton
                                    isActive={item.children.some((child) => child.href === page.url)}
                                    tooltip={{ children: item.title }}
                                    onClick={() => toggleMenu(item.title)}
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <ChevronDown
                                        className={clsx(
                                            'ml-auto h-4 w-4 transition-transform duration-200',
                                            openMenus[item.title] && 'rotate-180'
                                        )}
                                    />
                                </SidebarMenuButton>

                                {/* ✅ Subitems SIN SidebarMenuItem anidados */}
                                <div
                                    className={clsx(
                                        'overflow-hidden transition-all duration-200',
                                        openMenus[item.title] ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                                    )}
                                >
                                    <div className="pl-6 py-1 space-y-1">
                                        {item.children.map((sub) => (
                                            <div key={sub.title} className="group/menu-item relative">
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={sub.href === page.url}
                                                    tooltip={{ children: sub.title }}
                                                    size="sm"
                                                    className="w-full justify-start"
                                                >
                                                    <Link href={sub.href!}>
                                                        {sub.icon && <sub.icon />}
                                                        <span>{sub.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                isActive={item.href === page.url}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href!} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}