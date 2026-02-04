import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Shield, AlertCircle, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers, useUpdateUserRole, UserWithRole, AppRole } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";

const roleConfig: Record<AppRole, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-destructive/20 text-destructive" },
  vendedor: { label: "Vendedor", className: "bg-success/20 text-success" },
};

const Usuarios = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, error } = useUsers();
  const updateRoleMutation = useUpdateUserRole();
  
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRoleChange = (user: UserWithRole, role: AppRole) => {
    if (role !== user.role) {
      setSelectedUser(user);
      setNewRole(role);
      setIsDialogOpen(true);
    }
  };

  const confirmRoleChange = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({ 
        userId: selectedUser.user_id, 
        newRole 
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setNewRole(null);
    }
  };

  const cancelRoleChange = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setNewRole(null);
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    vendedores: users.filter(u => u.role === 'vendedor').length,
  };

  if (error) {
    return (
      <AppLayout title="Usuários" description="Gerencie os usuários e permissões do sistema">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar usuários. Verifique suas permissões de administrador.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Usuários" description="Gerencie os usuários e permissões do sistema">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                )}
                <p className="text-xs text-muted-foreground">Total de Usuários</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.admins}</p>
                )}
                <p className="text-xs text-muted-foreground">Administradores</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.vendedores}</p>
                )}
                <p className="text-xs text-muted-foreground">Vendedores</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Usuário</TableHead>
                  <TableHead className="text-muted-foreground">Cadastrado em</TableHead>
                  <TableHead className="text-muted-foreground">Role Atual</TableHead>
                  <TableHead className="text-muted-foreground">Alterar Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = user.user_id === currentUser?.id;
                    const initials = user.full_name
                      ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : 'U';

                    return (
                      <TableRow key={user.id} className="border-border hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.full_name || 'Usuário sem nome'}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {user.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-medium", roleConfig[user.role].className)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {roleConfig[user.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value: AppRole) => handleRoleChange(user, value)}
                            disabled={isCurrentUser || updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="vendedor">Vendedor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteração de role</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar o role de{' '}
              <strong>{selectedUser?.full_name || 'este usuário'}</strong> de{' '}
              <Badge className={cn("mx-1", roleConfig[selectedUser?.role || 'vendedor'].className)}>
                {roleConfig[selectedUser?.role || 'vendedor'].label}
              </Badge>{' '}
              para{' '}
              <Badge className={cn("mx-1", roleConfig[newRole || 'vendedor'].className)}>
                {roleConfig[newRole || 'vendedor'].label}
              </Badge>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelRoleChange}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? 'Atualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Usuarios;
