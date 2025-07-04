// hooks/use-color-theme.ts
import { useCallback, useEffect, useState } from 'react';

export type ColorTheme = 'default' | 'red' | 'rose' | 'orange' | 'green' | 'blue' | 'yellow' | 'violet';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyColorTheme = (theme: ColorTheme) => {
    if (typeof document === 'undefined') {
        return;
    }

    // Remover temas anteriores
    const themes: ColorTheme[] = ['default', 'red', 'rose', 'orange', 'green', 'blue', 'yellow', 'violet'];
    themes.forEach(t => {
        document.documentElement.classList.remove(`theme-${t}`);
        document.documentElement.removeAttribute(`data-theme-${t}`);
    });

    // Aplicar nuevo tema
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
};

export function initializeColorTheme() {
    const savedTheme = (localStorage.getItem('colorTheme') as ColorTheme) || 'default';
    applyColorTheme(savedTheme);
}

export function useColorTheme() {
    const [colorTheme, setColorTheme] = useState<ColorTheme>('default');

    const updateColorTheme = useCallback((theme: ColorTheme) => {
        setColorTheme(theme);

        // Store in localStorage for client-side persistence
        localStorage.setItem('colorTheme', theme);

        // Store in cookie for SSR
        setCookie('colorTheme', theme);

        applyColorTheme(theme);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('colorTheme') as ColorTheme | null;
        updateColorTheme(savedTheme || 'default');
    }, [updateColorTheme]);

    return { colorTheme, updateColorTheme } as const;
}
