import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Car, Package, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehicles, Vehicle, VehicleStatus } from "@/hooks/useVehicles";
import { VehicleFormDialog } from "@/components/vehicles/VehicleFormDialog";
import { DeleteVehicleDialog } from "@/components/vehicles/DeleteVehicleDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusConfig: Record<VehicleStatus, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-success/20 text-success hover:bg-success/30" },
  desmontando: { label: "Desmontando", className: "bg-info/20 text-info hover:bg-info/30" },
  desmontado: { label: "Desmontado", className: "bg-warning/20 text-warning hover:bg-warning/30" },
  finalizado: { label: "Finalizado", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const Veiculos = () => {
  const { hasAnyRole, hasRole } = useAuth();
  const { data: vehicles = [], isLoading, error } = useVehicles();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const canEdit = hasAnyRole(['admin', 'operador']);
  const canDelete = hasRole('admin');

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.chassi?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    ativo: vehicles.filter((v) => v.status === "ativo").length,
    desmontando: vehicles.filter((v) => v.status === "desmontando").length,
    desmontado: vehicles.filter((v) => v.status === "desmontado").length,
    totalParts: vehicles.reduce((acc, v) => acc + (v.parts_count || 0), 0),
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteOpen(true);
  };

  const handleNewVehicle = () => {
    setSelectedVehicle(null);
    setIsFormOpen(true);
  };

  if (error) {
    return (
      <AppLayout title="Veículos" description="Gerencie os veículos do seu estoque">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar veículos. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Veículos" description="Gerencie os veículos do seu estoque">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, modelo, chassi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="desmontando">Desmontando</SelectItem>
                <SelectItem value="desmontado">Desmontado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canEdit && (
            <Button className="gap-2 shrink-0" onClick={handleNewVehicle}>
              <Plus className="w-4 h-4" />
              Novo Veículo
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <Car className="w-5 h-5 text-success" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.ativo}</p>
                )}
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10">
                <Car className="w-5 h-5 text-info" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.desmontando}</p>
                )}
                <p className="text-xs text-muted-foreground">Desmontando</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                <Car className="w-5 h-5 text-warning" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.desmontado}</p>
                )}
                <p className="text-xs text-muted-foreground">Desmontados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalParts}</p>
                )}
                <p className="text-xs text-muted-foreground">Total de Peças</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Placa</TableHead>
                  <TableHead className="text-muted-foreground">Veículo</TableHead>
                  <TableHead className="text-muted-foreground">Ano</TableHead>
                  <TableHead className="text-muted-foreground">Cor</TableHead>
                  <TableHead className="text-muted-foreground">Entrada</TableHead>
                  <TableHead className="text-muted-foreground">Peças</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "Nenhum veículo encontrado com os filtros aplicados."
                        : "Nenhum veículo cadastrado. Clique em 'Novo Veículo' para começar."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">{vehicle.placa}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.motorizacao || "-"} - {vehicle.combustivel || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.ano}</TableCell>
                      <TableCell>{vehicle.cor || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(vehicle.data_entrada).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{vehicle.parts_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", statusConfig[vehicle.status].className)}>
                          {statusConfig[vehicle.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Package className="w-4 h-4" />
                              Ver peças
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem 
                                className="gap-2" 
                                onClick={() => handleEdit(vehicle)}
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem 
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => handleDelete(vehicle)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <VehicleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vehicle={selectedVehicle}
      />

      {/* Delete Dialog */}
      <DeleteVehicleDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        vehicle={selectedVehicle}
      />
    </AppLayout>
  );
};

export default Veiculos;
