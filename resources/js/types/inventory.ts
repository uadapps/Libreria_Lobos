export interface InventoryPeriod {
    id: number;
    name: string;
    status: 'abierto' | 'cerrado';
    created_at: string;
    closed_at?: string;
    created_by: string;
    total_movements: number;
    total_books: number;
}

export interface InventoryPeriodsPageProps {
    periods: InventoryPeriod[];
    error?: string;
}