import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, MoreHorizontal, Car, Package, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  placa: string;
  chassi: string;
  marca: string;
  modelo: string;
  ano: number;
  motorizacao: string;
  combustivel: string;
  cor: string;
  dataEntrada: string;
  status: "ativo" | "desmontando" | "desmontado" | "finalizado";
  pecasCount: number;
}

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    placa: "ABC-1234",
    chassi: "9BWZZZ377VT004251",
    marca: "Honda",
    modelo: "Civic",
    ano: 2019,
    motorizacao: "2.0",
    combustivel: "Flex",
    cor: "Preto",
    dataEntrada: "2024-01-15",
    status: "ativo",
    pecasCount: 45,
  },
  {
    id: "2",
    placa: "XYZ-5678",
    chassi: "9BWZZZ377VT004252",
    marca: "Toyota",
    modelo: "Corolla",
    ano: 2020,
    motorizacao: "2.0",
    combustivel: "Flex",
    cor: "Branco",
    dataEntrada: "2024-01-20",
    status: "desmontando",
    pecasCount: 28,
  },
  {
    id: "3",
    placa: "DEF-9012",
    chassi: "9BWZZZ377VT004253",
    marca: "Volkswagen",
    modelo: "Polo",
    ano: 2021,
    motorizacao: "1.0 TSI",
    combustivel: "Flex",
    cor: "Prata",
    dataEntrada: "2024-02-01",
    status: "desmontado",
    pecasCount: 62,
  },
  {
    id: "4",
    placa: "GHI-3456",
    chassi: "9BWZZZ377VT004254",
    marca: "Fiat",
    modelo: "Argo",
    ano: 2020,
    motorizacao: "1.3",
    combustivel: "Flex",
    cor: "Vermelho",
    dataEntrada: "2024-02-10",
    status: "finalizado",
    pecasCount: 0,
  },
  {
    id: "5",
    placa: "JKL-7890",
    chassi: "9BWZZZ377VT004255",
    marca: "Chevrolet",
    modelo: "Onix",
    ano: 2019,
    motorizacao: "1.0",
    combustivel: "Flex",
    cor: "Cinza",
    dataEntrada: "2024-02-15",
    status: "ativo",
    pecasCount: 38,
  },
];

const statusConfig = {
  ativo: { label: "Ativo", className: "bg-success/20 text-success hover:bg-success/30" },
  desmontando: { label: "Desmontando", className: "bg-info/20 text-info hover:bg-info/30" },
  desmontado: { label: "Desmontado", className: "bg-warning/20 text-warning hover:bg-warning/30" },
  finalizado: { label: "Finalizado", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const Veiculos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.chassi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Veículo</DialogTitle>
                <DialogDescription>
                  Preencha os dados do veículo para adicionar ao estoque.
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placa">Placa</Label>
                    <Input id="placa" placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chassi">Chassi</Label>
                    <Input id="chassi" placeholder="9BWZZZ377VT004251" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input id="marca" placeholder="Honda" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input id="modelo" placeholder="Civic" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input id="ano" type="number" placeholder="2019" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motorizacao">Motorização</Label>
                    <Input id="motorizacao" placeholder="2.0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="combustivel">Combustível</Label>
                    <Select>
                      <SelectTrigger id="combustivel">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="gasolina">Gasolina</SelectItem>
                        <SelectItem value="etanol">Etanol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="eletrico">Elétrico</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input id="cor" placeholder="Preto" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataEntrada">Data de Entrada</Label>
                    <Input id="dataEntrada" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" placeholder="Observações sobre o veículo..." rows={3} />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Veículo</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <Car className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockVehicles.filter((v) => v.status === "ativo").length}
                </p>
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
                <p className="text-2xl font-bold">
                  {mockVehicles.filter((v) => v.status === "desmontando").length}
                </p>
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
                <p className="text-2xl font-bold">
                  {mockVehicles.filter((v) => v.status === "desmontado").length}
                </p>
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
                <p className="text-2xl font-bold">
                  {mockVehicles.reduce((acc, v) => acc + v.pecasCount, 0)}
                </p>
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
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">{vehicle.placa}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.motorizacao} - {vehicle.combustivel}</p>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.ano}</TableCell>
                    <TableCell>{vehicle.cor}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(vehicle.dataEntrada).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{vehicle.pecasCount}</span>
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
                          <DropdownMenuItem className="gap-2">
                            <Edit className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Veiculos;
