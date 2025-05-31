import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState, ChangeEvent } from 'react';

interface PasswordFieldProps {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    name?: string;
}

export default function PasswordField_view({
    label,
    value,
    onChange,
    error,
    name,
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="w-full">
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock size={18} />
                </span>
                <input
                    type={visible ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="••••••••"
                    className="w-full rounded-lg border px-10 py-2 pr-10 shadow-sm focus:ring-2 focus:ring-[#c10230] dark:bg-zinc-900 dark:text-white"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#c10230] hover:text-[#a1001f]"
                    title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
