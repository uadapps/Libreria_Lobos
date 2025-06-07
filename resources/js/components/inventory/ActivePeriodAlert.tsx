import React from 'react';
import { Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryPeriod } from '@/types/inventory';

interface Props {
    activePeriod: InventoryPeriod;
    onClose?: (period: InventoryPeriod) => void;
    canClose?: boolean;
}
export const ActivePeriodAlert: React.FC<Props> = ({ 
    activePeriod, 
    onClose,
    canClose = false 
}) => (
    <div className="mx-6 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 dark:bg-emerald-950/50 dark:border-emerald-800/50">
        <div className="flex items-center gap-3">
            <Unlock className="text-emerald-600 dark:text-emerald-400" size={20} />
            <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                    Período Activo
                </h3>
                <p className="text-emerald-800 dark:text-emerald-200">
                    <strong>{activePeriod.name}</strong>
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {activePeriod.total_movements} movimientos registrados
                </p>
            </div>
            
           
            {canClose && onClose && (
                <Button
                    onClick={() => onClose(activePeriod)}
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                >
                    Cerrar Período
                </Button>
            )}
            {!canClose && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                   
                </div>
            )}
        </div>
    </div>
);