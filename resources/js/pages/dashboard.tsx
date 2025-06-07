import { useState, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Icons
import {
    BookOpen,
    ShoppingCart,
    Package,
    ArrowUp,
    ArrowDown,
    Plus,
    Eye,
    AlertTriangle,
    Download,
    Filter,
    BarChart3,
    Star,
    Users,
    DollarSign,
    Truck} from 'lucide-react';

// Sample data para bookstore
const bookstoreData = {
    stats: {
        totalBooks: 15420,
        todaySales: 89,
        monthlyRevenue: 45680,
        pendingOrders: 23,
        lowStock: 12,
        customers: 2847
    },
    trends: {
        booksGrowth: 8.5,
        salesGrowth: 15.2,
        revenueGrowth: 12.8,
        customersGrowth: 7.3
    },
    bestSellers: [
        { id: 1, title: 'Cien años de soledad', author: 'Gabriel García Márquez', sales: 156, revenue: 3120, cover: null, category: 'Ficción' },
        { id: 2, title: 'El principito', author: 'Antoine de Saint-Exupéry', sales: 142, revenue: 2840, cover: null, category: 'Infantil' },
        { id: 3, title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', sales: 128, revenue: 2560, cover: null, category: 'Clásicos' },
        { id: 4, title: 'Crónica de una muerte anunciada', author: 'Gabriel García Márquez', sales: 115, revenue: 2300, cover: null, category: 'Ficción' },
        { id: 5, title: '1984', author: 'George Orwell', sales: 98, revenue: 1960, cover: null, category: 'Ciencia Ficción' }
    ],
    recentOrders: [
        { id: 1, customer: 'María González', items: 3, total: 67.50, status: 'completed', time: 'hace 5 min', books: ['El amor en los tiempos del cólera', 'La casa de los espíritus'] },
        { id: 2, customer: 'Carlos Rodríguez', items: 1, total: 25.00, status: 'processing', time: 'hace 15 min', books: ['Rayuela'] },
        { id: 3, customer: 'Ana Martínez', items: 5, total: 125.00, status: 'shipped', time: 'hace 30 min', books: ['Saga Harry Potter (5 tomos)'] },
        { id: 4, customer: 'José López', items: 2, total: 45.00, status: 'pending', time: 'hace 1 hora', books: ['El túnel', 'Ficciones'] },
        { id: 5, customer: 'Laura Fernández', items: 4, total: 89.99, status: 'completed', time: 'hace 2 horas', books: ['Trilogía Millennium'] }
    ],
    lowStockBooks: [
        { id: 1, title: 'Sapiens', author: 'Yuval Noah Harari', stock: 3, category: 'Historia', price: 28.50 },
        { id: 2, title: 'El código Da Vinci', author: 'Dan Brown', stock: 2, category: 'Misterio', price: 22.00 },
        { id: 3, title: 'Steve Jobs', author: 'Walter Isaacson', stock: 1, category: 'Biografía', price: 32.00 },
        { id: 4, title: 'Hábitos atómicos', author: 'James Clear', stock: 4, category: 'Autoayuda', price: 24.99 },
        { id: 5, title: 'El alquimista', author: 'Paulo Coelho', stock: 2, category: 'Ficción', price: 18.50 }
    ],
    salesData: [
        { month: 'Ene', sales: 2850, books: 145, revenue: 42500 },
        { month: 'Feb', sales: 3200, books: 162, revenue: 48000 },
        { month: 'Mar', sales: 2950, books: 158, revenue: 44250 },
        { month: 'Abr', sales: 3800, books: 195, revenue: 57000 },
        { month: 'May', sales: 4200, books: 218, revenue: 63000 },
        { month: 'Jun', sales: 4568, books: 235, revenue: 68520 }
    ],
    categories: [
        { name: 'Ficción', books: 3245, percentage: 21 },
        { name: 'No ficción', books: 2890, percentage: 19 },
        { name: 'Infantil', books: 2156, percentage: 14 },
        { name: 'Académico', books: 1876, percentage: 12 },
        { name: 'Biografías', books: 1523, percentage: 10 },
        { name: 'Otros', books: 3730, percentage: 24 }
    ]
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Componente para las métricas principales
type MetricCardProps = {
    title: string;
    value: number | string;
    change: number;
    icon: React.ElementType;
    trend?: unknown;
    color?: "blue" | "green" | "purple" | "orange" | "red" | "emerald";
    prefix?: string;
    suffix?: string;
};

const MetricCard = ({ title, value, change, icon: Icon, color = "blue", prefix = "", suffix = "" }: MetricCardProps) => {
    const isPositive = change > 0;
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
        green: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
        purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
        orange: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
        red: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
        emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
    };

    return (
        <Card className={`${colorClasses[color]} transition-all duration-200 hover:shadow-md hover:scale-105`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {isPositive ? (
                        <ArrowUp className="h-3 w-3 text-green-600" />
                    ) : (
                        <ArrowDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(change)}%
                    </span>
                    <span>vs mes anterior</span>
                </div>
            </CardContent>
        </Card>
    );
};

// Componente para el gráfico de ventas
type SalesChartData = { month: string; sales: number; books: number; revenue: number };

const SalesChart = ({ data }: { data: SalesChartData[] }) => {
    const maxValue = Math.max(...data.map(d => d.revenue));

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>Ingresos mensuales</span>
                <span>Últimos 6 meses</span>
            </div>
            <div className="flex items-end space-x-2 h-32">
                {data.map((item: { revenue: number; month: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<unknown>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<unknown>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, index: Key | null | undefined) => (
                    <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                        <div
                            className="w-full bg-emerald-500 rounded-t transition-all duration-300 hover:bg-emerald-600 relative group"
                            style={{ height: `${(item.revenue / maxValue) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                ${item.revenue.toLocaleString()}
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente principal del Dashboard
export default function BookstoreDashboard() {
    const [timeFilter, setTimeFilter] = useState('30d');

    const getOrderStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Completado</Badge>;
            case 'processing':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Procesando</Badge>;
            case 'shipped':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Enviado</Badge>;
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendiente</Badge>;
            default:
                return <Badge variant="outline">Desconocido</Badge>;
        }
    };

    const getStockWarning = (stock: number) => {
        if (stock <= 2) return 'text-red-600 font-semibold';
        if (stock <= 5) return 'text-orange-600 font-medium';
        return 'text-green-600';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Bookstore" />

            <div className="flex-1 space-y-6 p-6">
                {/* Header del Dashboard */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">📚 Dashboard Librería</h1>
                        <p className="text-muted-foreground">
                            Panel de control y métricas de la librería
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Libro
                        </Button>
                    </div>
                </div>

                {/* Métricas principales */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <MetricCard
                        title="Total Libros"
                        value={bookstoreData.stats.totalBooks}
                        change={bookstoreData.trends.booksGrowth}
                        icon={BookOpen}
                        color="blue" trend={undefined}                    />
                    <MetricCard
                        title="Ventas Hoy"
                        value={bookstoreData.stats.todaySales}
                        change={bookstoreData.trends.salesGrowth}
                        icon={ShoppingCart}
                        color="green" trend={undefined}                    />
                    <MetricCard
                        title="Ingresos Mes"
                        value={bookstoreData.stats.monthlyRevenue}
                        change={bookstoreData.trends.revenueGrowth}
                        icon={DollarSign}
                        color="emerald"
                        prefix="$" trend={undefined}                    />
                    <MetricCard
                        title="Órdenes Pendientes"
                        value={bookstoreData.stats.pendingOrders}
                        change={-5.2}
                        icon={Truck}
                        color="orange" trend={undefined}                    />
                    <MetricCard
                        title="Stock Bajo"
                        value={bookstoreData.stats.lowStock}
                        change={8.1}
                        icon={AlertTriangle}
                        color="red" trend={undefined}                    />
                    <MetricCard
                        title="Clientes"
                        value={bookstoreData.stats.customers}
                        change={bookstoreData.trends.customersGrowth}
                        icon={Users}
                        color="purple" trend={undefined}                    />
                </div>

                {/* Sección principal con gráficos y datos */}
                <div className="grid gap-6 md:grid-cols-7">
                    {/* Gráfico de ventas */}
                    <Card className="md:col-span-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Ingresos por Ventas</CardTitle>
                                    <CardDescription>
                                        Evolución de ingresos en los últimos 6 meses
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" className={timeFilter === '7d' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setTimeFilter('7d')}>
                                        7d
                                    </Button>
                                    <Button variant="outline" size="sm" className={timeFilter === '30d' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setTimeFilter('30d')}>
                                        30d
                                    </Button>
                                    <Button variant="outline" size="sm" className={timeFilter === '90d' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setTimeFilter('90d')}>
                                        90d
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <SalesChart data={bookstoreData.salesData} />
                        </CardContent>
                    </Card>

                    {/* Panel de acciones rápidas */}
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>Gestión Rápida</CardTitle>
                            <CardDescription>
                                Herramientas de administración
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full justify-start" variant="outline">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Gestionar Inventario
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Procesar Órdenes
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Users className="h-4 w-4 mr-2" />
                                Gestionar Clientes
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Ver Reportes
                            </Button>

                            {/* Categorías populares */}
                            <div className="pt-4 border-t space-y-3">
                                <h4 className="font-medium text-sm">Categorías Populares</h4>
                                {bookstoreData.categories.slice(0, 4).map((category, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{category.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                                                <div
                                                    className="h-2 bg-blue-500 rounded-full"
                                                    style={{ width: `${category.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-medium">{category.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tablas de datos */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Libros más vendidos */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>📈 Libros Más Vendidos</CardTitle>
                                    <CardDescription>
                                        Top libros este mes
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm">
                                    Ver todos
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Libro</TableHead>
                                        <TableHead>Ventas</TableHead>
                                        <TableHead>Ingresos</TableHead>
                                        <TableHead className="text-right">Ranking</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookstoreData.bestSellers.map((book, index) => (
                                        <TableRow key={book.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{book.title}</div>
                                                    <div className="text-sm text-muted-foreground">{book.author}</div>
                                                    <Badge variant="outline" className="text-xs">{book.category}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{book.sales}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">${book.revenue.toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Star className="h-4 w-4 text-yellow-500" />
                                                    <span className="font-bold">#{index + 1}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Órdenes recientes */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>🛒 Órdenes Recientes</CardTitle>
                                    <CardDescription>
                                        Últimas transacciones
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver todas
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {bookstoreData.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                                {order.customer.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm">{order.customer}</div>
                                                <div className="font-bold text-sm">${order.total}</div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.items} libro{order.items !== 1 ? 's' : ''} • {order.time}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {getOrderStatusBadge(order.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock bajo - Alerta importante */}
                <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <CardTitle className="text-orange-900 dark:text-orange-100">⚠️ Libros con Stock Bajo</CardTitle>
                            <CardDescription className="text-orange-700 dark:text-orange-300">
                                Requieren reposición urgente
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Libro</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookstoreData.lowStockBooks.map((book) => (
                                    <TableRow key={book.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">{book.title}</div>
                                                <div className="text-sm text-muted-foreground">{book.author}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{book.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={getStockWarning(book.stock)}>
                                                {book.stock} unidades
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">${book.price}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline">
                                                <Package className="h-4 w-4 mr-1" />
                                                Reponer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Footer con información de la tienda */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">📊 Inventario</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total libros</span>
                                <span className="font-medium">15,420</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Categorías</span>
                                <span className="font-medium">24</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Autores</span>
                                <span className="font-medium">3,247</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">💰 Finanzas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ingresos hoy</span>
                                <span className="font-medium">$2,145</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ticket promedio</span>
                                <span className="font-medium">$24.10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Margen promedio</span>
                                <span className="font-medium">35%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">👥 Clientes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Nuevos hoy</span>
                                <span className="font-medium">12</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Clientes VIP</span>
                                <span className="font-medium">156</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Satisfacción</span>
                                <span className="font-medium">4.8⭐</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">🚚 Envíos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pendientes</span>
                                <span className="font-medium">23</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">En tránsito</span>
                                <span className="font-medium">67</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Entregados hoy</span>
                                <span className="font-medium">34</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
