// components/Roles/RoleFilters.tsx
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export const RoleFilters = memo(({ searchTerm, onSearchChange }: FiltersProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-2">
                <Search className="text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Buscar roles..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="max-w-sm"
                />
            </div>
        </CardContent>
    </Card>
));

RoleFilters.displayName = 'RoleFilters';
