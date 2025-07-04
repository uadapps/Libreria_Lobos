import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { ColorTheme, useColorTheme } from '@/hooks/use-color-theme';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun, Palette } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleTab({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();
    const { colorTheme, updateColorTheme } = useColorTheme();

    const appearanceTabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    const colorTabs: { value: ColorTheme; label: string; color: string }[] = [
        { value: 'default', label: 'Default', color: '#3b82f6' },
        { value: 'red', label: 'Red', color: '#ef4444' },
        { value: 'rose', label: 'Rose', color: '#f43f5e' },
        { value: 'orange', label: 'Orange', color: '#f97316' },
        { value: 'green', label: 'Green', color: '#22c55e' },
        { value: 'blue', label: 'Blue', color: '#3b82f6' },
        { value: 'yellow', label: 'Yellow', color: '#eab308' },
        { value: 'violet', label: 'Violet', color: '#8b5cf6' },
    ];

    return (
        <div className={cn('space-y-6', className)} {...props}>
            {/* Appearance Settings Section */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Monitor className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Appearance Mode
                    </span>
                </div>
                <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                    {appearanceTabs.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => updateAppearance(value)}
                            className={cn(
                                'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                                appearance === value
                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                            )}
                        >
                            <Icon className="-ml-1 h-4 w-4" />
                            <span className="ml-1.5 text-sm">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Theme Section */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Color Theme
                    </span>
                </div>
                <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    {colorTabs.map(({ value, label, color }) => (
                        <button
                            key={value}
                            onClick={() => updateColorTheme(value)}
                            className={cn(
                                'group relative flex flex-col items-center gap-1.5 rounded-md p-2 transition-all',
                                colorTheme === value
                                    ? 'bg-white shadow-xs dark:bg-neutral-700'
                                    : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60',
                            )}
                            title={`Activar tema ${label}`}
                        >
                            <div
                                className={cn(
                                    'h-4 w-4 rounded-full border-2 transition-all',
                                    colorTheme === value
                                        ? 'border-white shadow-sm'
                                        : 'border-neutral-300 dark:border-neutral-600'
                                )}
                                style={{ backgroundColor: color }}
                            />
                            <span className={cn(
                                'text-xs transition-colors',
                                colorTheme === value
                                    ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                                    : 'text-neutral-500 dark:text-neutral-400'
                            )}>
                                {label}
                            </span>

                            {/* Indicador de selección */}
                            {colorTheme === value && (
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-neutral-700">
                                    <div className="h-full w-full rounded-full bg-white scale-50" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Section */}
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Vista previa
                    </span>
                    <div className="flex gap-1">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: colorTabs.find(t => t.value === colorTheme)?.color }}
                        />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                            {appearance} • {colorTabs.find(t => t.value === colorTheme)?.label}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="h-6 w-12 rounded bg-primary/20 border border-primary/30" />
                    <div className="h-6 w-12 rounded bg-neutral-200 dark:bg-neutral-600" />
                    <div className="h-6 w-12 rounded border border-neutral-300 dark:border-neutral-600" />
                </div>
            </div>
        </div>
    );
}
