import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Props {
    status: 'abierto' | 'cerrado';
}
export const PeriodStatusBadge: React.FC<Props> = ({ status }) => (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
        status === 'abierto'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'
    }`}>
        {status === 'abierto' ? <Unlock size={12} /> : <Lock size={12} />}
        {status === 'abierto' ? 'Abierto' : 'Cerrado'}
    </span>
);