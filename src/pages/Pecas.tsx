import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Sparkles, MapPin, Package, Download, FileSpreadsheet, Upload, Car, Eye, Copy, X, ExternalLink, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useParts, useCategories, useCreatePart, useUpdatePart, useDeletePart, type Part } from "@/hooks/useParts";
import type { ExtendedPartFormData } from "@/hooks/useParts";
import { useAllPartCompatibilities, filterPartsByAdvancedCompatibility, type AdvancedCompatibilityFilter, useCreatePartCompatibility } from "@/hooks/usePartsWithCompatibilities";
import { PartFormDialog } from "@/components/parts/PartFormDialog";
import { PartFormWizard, type MarketplaceConfig, type NewCompatibility, type MarketplaceAccountSelection } from "@/components/parts/PartFormWizard";
import type { PendingImage } from "@/components/parts/WizardImageUpload";
import { ImageUploadProgressDialog } from "@/components/parts/ImageUploadProgressDialog";
import { useUploadPartImage } from "@/hooks/usePartImages";
import { useMercadoLivre } from "@/hooks/useMercadoLivre";
import { DeletePartDialog } from "@/components/parts/DeletePartDialog";
import { PartThumbnail } from "@/components/parts/PartThumbnail";
import { ImportPartsDialog } from "@/components/parts/ImportPartsDialog";
import { CompatibilityFilterDialog, type CompatibilityFilter } from "@/components/parts/CompatibilityFilterDialog";
import { exportToCSV, exportToExcel } from "@/utils/exportUtils";
import { usePartsMLStatus } from "@/hooks/usePartsMLStatus";
import { MLStatusBadge } from "@/components/parts/MLStatusBadge";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [compatibilityFilter, setCompatibilityFilter] = useState<CompatibilityFilter>({ marca: "", modelo: "", ano: null });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [mlFilter, setMlFilter] = useState<string>("all");
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [duplicatingPart, setDuplicatingPart] = useState<Part | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [partsToDelete, setPartsToDelete] = useState<Part[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Image upload progress state
  const [uploadProgress, setUploadProgress] = useState({
    open: false,
    currentIndex: 0,
    totalImages: 0,
    currentFileName: "",
  });

  const { data: parts = [], isLoading } = useParts();
  const { data: categories = [] } = useCategories();
  const { data: compatibilityMap = new Map() } = useAllPartCompatibilities();
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const deleteMutation = useDeletePart();
  const createCompatibilityMutation = useCreatePartCompatibility();
  const { createListing, isCreatingListing, accounts: mlAccounts = [] } = useMercadoLivre();
  const uploadImageMutation = useUploadPartImage();
  const { toast } = useToast();
  
  // Fetch ML status for all parts
  const partIds = useMemo(() => parts.map(p => p.id), [parts]);
  const { data: mlStatusMap = new Map() } = usePartsMLStatus(partIds);

  // Handle edit/duplicate from URL params
  useEffect(() => {
    const editId = searchParams.get('edit');
    const duplicateId = searchParams.get('duplicate');
    
    if (editId && parts.length > 0) {
      const partToEdit = parts.find(p => p.id === editId);
      if (partToEdit) {
        setEditingPart(partToEdit);
        setDuplicatingPart(null);
        setIsFormDialogOpen(true);
        // Clear the URL param
        setSearchParams({}, { replace: true });
      }
    } else if (duplicateId && parts.length > 0) {
      const partToDuplicate = parts.find(p => p.id === duplicateId);
      if (partToDuplicate) {
        // Create a copy with modified name and reset quantity
        const duplicatedPart: Part = {
          ...partToDuplicate,
          id: '', // Will be assigned on creation
          nome: `${partToDuplicate.nome} (Cópia)`,
          quantidade: 1,
          codigo_interno: partToDuplicate.codigo_interno ? `${partToDuplicate.codigo_interno}-COPIA` : '',
        };
        setDuplicatingPart(duplicatedPart);
        setEditingPart(null);
        setIsFormDialogOpen(true);
        // Clear the URL param
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, parts, setSearchParams]);

  // Get parts that match compatibility filter
  const compatiblePartIds = useMemo(() => {
    const hasFilter = compatibilityFilter.marca || compatibilityFilter.modelo || compatibilityFilter.ano;
    if (!hasFilter) return null;
    return filterPartsByAdvancedCompatibility(
      parts.map(p => p.id),
      compatibilityMap,
      compatibilityFilter as AdvancedCompatibilityFilter
    );
  }, [parts, compatibilityMap, compatibilityFilter]);

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (part.codigo_oem?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (part.veiculo_info?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || part.status === statusFilter;
    const matchesCategoria = categoriaFilter === "all" || part.categoria_id === categoriaFilter;
    const matchesCompatibility = compatiblePartIds === null || compatiblePartIds.has(part.id);
    
    // ML filter
    const mlStatus = mlStatusMap.get(part.id);
    const matchesMl = mlFilter === "all" || 
      (mlFilter === "published" && mlStatus !== undefined) ||
      (mlFilter === "not_published" && mlStatus === undefined) ||
      (mlFilter === "active" && mlStatus?.status === "active") ||
      (mlFilter === "paused" && mlStatus?.status === "paused") ||
      (mlFilter === "sold" && mlStatus?.status === "sold");
    
    return matchesSearch && matchesStatus && matchesCategoria && matchesCompatibility && matchesMl;
  });

  const totalEstoque = filteredParts.reduce((acc, p) => acc + p.quantidade, 0);
  const valorEstoque = filteredParts.reduce((acc, p) => acc + (p.preco_venda || 0) * p.quantidade, 0);
  const uniqueCategories = [...new Set(parts.map((p) => p.categoria_nome).filter(Boolean))];

  const handleCreatePart = async (data: ExtendedPartFormData, marketplaces: MarketplaceConfig, newCompatibilities: NewCompatibility[], accountSelection: MarketplaceAccountSelection, pendingImages: PendingImage[]) => {
    createMutation.mutate(data, {
      onSuccess: async (partId) => {
        setIsFormDialogOpen(false);
        
        // Upload pending images if any
        if (pendingImages.length > 0 && partId) {
          setUploadProgress({
            open: true,
            currentIndex: 0,
            totalImages: pendingImages.length,
            currentFileName: pendingImages[0]?.file.name || "",
          });
          
          for (let i = 0; i < pendingImages.length; i++) {
            const pendingImage = pendingImages[i];
            setUploadProgress(prev => ({
              ...prev,
              currentIndex: i,
              currentFileName: pendingImage.file.name,
            }));
            
            try {
              await uploadImageMutation.mutateAsync({ partId, file: pendingImage.file });
              // Clean up the preview URL
              URL.revokeObjectURL(pendingImage.previewUrl);
            } catch (error) {
              console.error('Failed to upload image:', error);
            }
          }
          
          // Mark as complete briefly before closing
          setUploadProgress(prev => ({
            ...prev,
            currentIndex: pendingImages.length,
          }));
          
          // Close after a short delay to show completion
          setTimeout(() => {
            setUploadProgress({
              open: false,
              currentIndex: 0,
              totalImages: 0,
              currentFileName: "",
            });
          }, 1000);
        }
        
        // Save compatibilities if any
        if (newCompatibilities.length > 0 && partId) {
          for (const compat of newCompatibilities) {
            await createCompatibilityMutation.mutateAsync({
              part_id: partId,
              marca: compat.marca,
              modelo: compat.modelo,
              ano_inicio: compat.ano_inicio,
              ano_fim: compat.ano_fim,
            });
          }
        }
        
        // Create ML listing if marketplace selected
        if (marketplaces.mercadolivre && partId) {
          const activeAccounts = mlAccounts.filter(acc => acc.status === 'active');
          const accountId = accountSelection.mercadolivre_account_id || 
            (activeAccounts.length === 1 ? activeAccounts[0].id : undefined);
          
          if (accountId) {
            try {
              const result = await createListing({ 
                accountId, 
                partId,
                listingData: {
                  // Pass selected category
                  category_id: accountSelection.mercadolivre_category_id || 'MLB1747',
                  // Pass shipping dimensions
                  shipping: data.peso_gramas && data.comprimento_cm && data.largura_cm && data.altura_cm ? {
                    dimensions: {
                      height: data.altura_cm,
                      width: data.largura_cm,
                      length: data.comprimento_cm,
                    },
                    weight: data.peso_gramas,
                  } : undefined,
                }
              });
              
              if (result?.permalink) {
                toast({
                  title: "Anúncio publicado no Mercado Livre!",
                  description: (
                    <div className="flex flex-col gap-2">
                      <span>ID: {result.ml_id}</span>
                      <a 
                        href={result.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver anúncio no Mercado Livre
                      </a>
                    </div>
                  ),
                  duration: 10000, // 10 seconds to give time to click
                });
              } else {
                toast({
                  title: "Anúncio criado!",
                  description: "O anúncio foi publicado no Mercado Livre",
                });
              }
            } catch (error) {
              // Error toast is already shown by useMercadoLivre hook
              console.error('Failed to create ML listing:', error);
            }
          }
        }
      },
    });
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setDuplicatingPart(null);
    setIsFormDialogOpen(true);
  };

  const handleDuplicatePart = (part: Part) => {
    const duplicatedPart: Part = {
      ...part,
      id: '',
      nome: `${part.nome} (Cópia)`,
      quantidade: 1,
      codigo_interno: part.codigo_interno ? `${part.codigo_interno}-COPIA` : '',
    };
    setDuplicatingPart(duplicatedPart);
    setEditingPart(null);
    setIsFormDialogOpen(true);
  };

  const handleUpdatePart = async (data: ExtendedPartFormData, marketplaces: MarketplaceConfig, newCompatibilities: NewCompatibility[], accountSelection: MarketplaceAccountSelection, _pendingImages: PendingImage[]) => {
    if (!editingPart) return;
    updateMutation.mutate({ id: editingPart.id, data }, {
      onSuccess: async () => {
        setIsFormDialogOpen(false);
        setEditingPart(null);
        // Save new compatibilities if any
        if (newCompatibilities.length > 0) {
          for (const compat of newCompatibilities) {
            await createCompatibilityMutation.mutateAsync({
              part_id: editingPart.id,
              marca: compat.marca,
              modelo: compat.modelo,
              ano_inicio: compat.ano_inicio,
              ano_fim: compat.ano_fim,
            });
          }
        }
      },
    });
  };

  const handleDeleteClick = (part: Part) => {
    setPartToDelete(part);
    setPartsToDelete([]);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    const partsToDeleteArray = filteredParts.filter(p => selectedParts.has(p.id));
    setPartsToDelete(partsToDeleteArray);
    setPartToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (partsToDelete.length > 0) {
      // Bulk delete
      let successCount = 0;
      for (const part of partsToDelete) {
        try {
          await new Promise<void>((resolve, reject) => {
            deleteMutation.mutate(part.id, {
              onSuccess: () => resolve(),
              onError: reject,
            });
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to delete part ${part.id}:`, error);
        }
      }
      setDeleteDialogOpen(false);
      setPartsToDelete([]);
      setSelectedParts(new Set());
      toast({
        title: "Peças excluídas",
        description: `${successCount} peça(s) excluída(s) com sucesso.`,
      });
    } else if (partToDelete) {
      // Single delete
      deleteMutation.mutate(partToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPartToDelete(null);
        },
      });
    }
  };

  const togglePartSelection = (partId: string) => {
    setSelectedParts(prev => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedParts.size === filteredParts.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(filteredParts.map(p => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedParts(new Set());
  };

  const handleDialogClose = (open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setEditingPart(null);
      setDuplicatingPart(null);
    }
  };

  // Determine which part data to use for the form
  const formPart = editingPart || duplicatingPart;

  return (
    <AppLayout title="Peças" description="Gerencie o catálogo de peças do seu estoque">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <CompatibilityFilterDialog
              filter={compatibilityFilter}
              onFilterChange={setCompatibilityFilter}
            />
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
            <Select value={mlFilter} onValueChange={setMlFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Mercado Livre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ML</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="not_published">Não publicados</SelectItem>
                <SelectItem value="active">ML Ativo</SelectItem>
                <SelectItem value="paused">ML Pausado</SelectItem>
                <SelectItem value="sold">ML Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="w-4 h-4" />
              Importar
            </Button>
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

        {/* Selection Bar */}
        {selectedParts.size > 0 && (
          <Card className="p-3 bg-primary/10 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedParts.size === filteredParts.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedParts.size} peça{selectedParts.size > 1 ? 's' : ''} selecionada{selectedParts.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar seleção
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir selecionadas
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={filteredParts.length > 0 && selectedParts.size === filteredParts.length}
                      onCheckedChange={toggleSelectAll}
                      disabled={filteredParts.length === 0}
                    />
                  </TableHead>
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
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
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
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      {parts.length === 0 
                        ? "Nenhuma peça cadastrada. Clique em 'Nova Peça' para começar."
                        : "Nenhuma peça encontrada com os filtros aplicados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow 
                      key={part.id} 
                      className={cn(
                        "border-border hover:bg-muted/50",
                        selectedParts.has(part.id) && "bg-primary/5"
                      )}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedParts.has(part.id)}
                          onCheckedChange={() => togglePartSelection(part.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link to={`/pecas/${part.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <PartThumbnail partId={part.id} partName={part.nome} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium hover:text-primary transition-colors">{part.nome}</p>
                              {mlStatusMap.get(part.id) && (
                                <MLStatusBadge status={mlStatusMap.get(part.id)!} />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{part.categoria_nome || "Sem categoria"}</p>
                          </div>
                        </Link>
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
                            <DropdownMenuItem className="gap-2" asChild>
                              <Link to={`/pecas/${part.id}`}>
                                <Eye className="w-4 h-4" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Sparkles className="w-4 h-4" />
                              Gerar anúncio IA
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEditPart(part)}>
                              <Edit className="w-4 h-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleDuplicatePart(part)}>
                              <Copy className="w-4 h-4" />
                              Duplicar
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
       <PartFormWizard
        open={isFormDialogOpen}
        onOpenChange={handleDialogClose}
        part={formPart}
        onSubmit={editingPart ? handleUpdatePart : handleCreatePart}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isDuplicating={!!duplicatingPart}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePartDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        partName={partToDelete?.nome}
        partNames={partsToDelete.length > 0 ? partsToDelete.map(p => p.nome) : undefined}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Import Parts Dialog */}
      <ImportPartsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />

      {/* Image Upload Progress Dialog */}
      <ImageUploadProgressDialog
        open={uploadProgress.open}
        currentIndex={uploadProgress.currentIndex}
        totalImages={uploadProgress.totalImages}
        currentFileName={uploadProgress.currentFileName}
      />
    </AppLayout>
  );
};

export default Pecas;
