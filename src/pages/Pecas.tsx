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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Sparkles, MapPin, Package, Download, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParts, useCategories, useCreatePart, useUpdatePart, useDeletePart, type Part, type PartFormData } from "@/hooks/useParts";
import { PartFormDialog } from "@/components/parts/PartFormDialog";
import { DeletePartDialog } from "@/components/parts/DeletePartDialog";
import { PartThumbnail } from "@/components/parts/PartThumbnail";
import { exportToCSV, exportToExcel } from "@/utils/exportUtils";

const statusConfig = {
  ativa: { label: "Ativa", className: "bg-success/20 text-success hover:bg-success/30" },
  vendida: { label: "Vendida", className: "bg-info/20 text-info hover:bg-info/30" },
  pausada: { label: "Pausada", className: "bg-warning/20 text-warning hover:bg-warning/30" },
};

const condicaoConfig = {
  nova: { label: "Nova", className: "bg-success/20 text-success" },
  usada: { label: "Usada", className: "bg-muted text-muted-foreground" },
  recondicionada: { label: "Recondicionada", className: "bg-info/20 text-info" },
};

const Pecas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);

  const { data: parts = [], isLoading } = useParts();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const deleteMutation = useDeletePart();

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (part.codigo_oem?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (part.veiculo_info?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || part.status === statusFilter;
    const matchesCategoria = categoriaFilter === "all" || part.categoria_id === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const totalEstoque = filteredParts.reduce((acc, p) => acc + p.quantidade, 0);
  const valorEstoque = filteredParts.reduce((acc, p) => acc + (p.preco_venda || 0) * p.quantidade, 0);
  const uniqueCategories = [...new Set(parts.map((p) => p.categoria_nome).filter(Boolean))];

  const handleCreatePart = (data: PartFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsFormDialogOpen(false);
      },
    });
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setIsFormDialogOpen(true);
  };

  const handleUpdatePart = (data: PartFormData) => {
    if (!editingPart) return;
    updateMutation.mutate({ id: editingPart.id, data }, {
      onSuccess: () => {
        setIsFormDialogOpen(false);
        setEditingPart(null);
      },
    });
  };

  const handleDeleteClick = (part: Part) => {
    setPartToDelete(part);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!partToDelete) return;
    deleteMutation.mutate(partToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setPartToDelete(null);
      },
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setEditingPart(null);
    }
  };

  return (
    <AppLayout title="Peças" description="Gerencie o catálogo de peças do seu estoque">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="vendida">Vendida</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="gap-2"
                  onClick={() => exportToCSV(filteredParts)}
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2"
                  onClick={() => exportToExcel(filteredParts)}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </Button>
            <Button className="gap-2" onClick={() => { setEditingPart(null); setIsFormDialogOpen(true); }}>
              <Plus className="w-4 h-4" />
              Nova Peça
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{filteredParts.length}</p>
                )}
                <p className="text-xs text-muted-foreground">Tipos de Peças</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <Package className="w-5 h-5 text-success" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalEstoque}</p>
                )}
                <p className="text-xs text-muted-foreground">Unidades em Estoque</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10">
                <MapPin className="w-5 h-5 text-info" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{uniqueCategories.length}</p>
                )}
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                <span className="text-lg font-bold text-warning">R$</span>
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {valorEstoque >= 1000 
                      ? `${(valorEstoque / 1000).toFixed(0)}k` 
                      : valorEstoque.toFixed(0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Valor em Estoque</p>
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
                  <TableHead className="text-muted-foreground">Peça</TableHead>
                  <TableHead className="text-muted-foreground">Códigos</TableHead>
                  <TableHead className="text-muted-foreground">Veículo</TableHead>
                  <TableHead className="text-muted-foreground">Condição</TableHead>
                  <TableHead className="text-muted-foreground text-right">Qtd</TableHead>
                  <TableHead className="text-muted-foreground">Local</TableHead>
                  <TableHead className="text-muted-foreground text-right">Preço</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {parts.length === 0 
                        ? "Nenhuma peça cadastrada. Clique em 'Nova Peça' para começar."
                        : "Nenhuma peça encontrada com os filtros aplicados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PartThumbnail partId={part.id} partName={part.nome} />
                          <div>
                            <p className="font-medium">{part.nome}</p>
                            <p className="text-xs text-muted-foreground">{part.categoria_nome || "Sem categoria"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          <p>{part.codigo_interno || "-"}</p>
                          <p className="text-muted-foreground">{part.codigo_oem || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.veiculo_info || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", condicaoConfig[part.condicao].className)}>
                          {condicaoConfig[part.condicao].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{part.quantidade}</TableCell>
                      <TableCell className="font-mono text-sm">{part.localizacao || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium text-primary">
                            {part.preco_venda 
                              ? `R$ ${part.preco_venda.toLocaleString("pt-BR")}`
                              : "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {part.preco_custo 
                              ? `Custo: R$ ${part.preco_custo.toLocaleString("pt-BR")}`
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", statusConfig[part.status].className)}>
                          {statusConfig[part.status].label}
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
                              <Sparkles className="w-4 h-4" />
                              Gerar anúncio IA
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEditPart(part)}>
                              <Edit className="w-4 h-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(part)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </DropdownMenuItem>
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

      {/* Part Form Dialog */}
      <PartFormDialog
        open={isFormDialogOpen}
        onOpenChange={handleDialogClose}
        part={editingPart}
        onSubmit={editingPart ? handleUpdatePart : handleCreatePart}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePartDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        partName={partToDelete?.nome || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
};

export default Pecas;
