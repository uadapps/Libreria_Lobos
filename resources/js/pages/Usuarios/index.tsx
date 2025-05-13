import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import Form from '@/components/usuarios/Form'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function UsuariosIndex({ usuarios, links }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const handleOpen = (user = null) => {
    setEditingUser(user)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingUser(null)
  }

  const handleSearch = (e) => {
    router.get('/usuarios', { search: e.target.value }, { preserveState: true })
  }

  return (
    <>
      <Head title="Usuarios" />

      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar usuario..."
            onChange={handleSearch}
            className="w-64"
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpen()} className="bg-[#c10230] text-white hover:bg-[#a1001f]">
                <Plus className="mr-2 h-4 w-4" /> Crear
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
                </DialogTitle>
              </DialogHeader>
              <Form user={editingUser ?? {}} onSuccess={handleClose} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card mx-6 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(usuarios?.data ?? usuarios)?.length > 0 ? (
  (usuarios?.data ?? usuarios).map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.name}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(usuario)}
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4 px-6">
        <span className="text-sm text-muted-foreground">
          Página {usuarios.current_page} de {usuarios.last_page}
        </span>
        <div className="space-x-2">
          {usuarios.prev_page_url && (
            <Button
              variant="ghost"
              onClick={() => router.get(usuarios.prev_page_url)}
            >
              Anterior
            </Button>
          )}
          {usuarios.next_page_url && (
            <Button
              variant="ghost"
              onClick={() => router.get(usuarios.next_page_url)}
            >
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

UsuariosIndex.layout = (page) => <AppLayout children={page} />

