import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  Tag, 
  Car, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  RefreshCw,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePartDetails } from "@/hooks/usePartDetails";
import { usePartCompatibilities } from "@/hooks/usePartCompatibilities";
import { usePartStockMovements } from "@/hooks/useStockMovements";
import { PartImageGallery } from "@/components/parts/PartImageGallery";
import { StockMovementDialog } from "@/components/parts/StockMovementDialog";

const statusConfig = {
  ativa: { label: "Ativa", className: "bg-success/20 text-success" },
  vendida: { label: "Vendida", className: "bg-info/20 text-info" },
  pausada: { label: "Pausada", className: "bg-warning/20 text-warning" },
};

const condicaoConfig = {
  nova: { label: "Nova", className: "bg-success/20 text-success" },
  usada: { label: "Usada", className: "bg-muted text-muted-foreground" },
  recondicionada: { label: "Recondicionada", className: "bg-info/20 text-info" },
};

const movementTypeConfig = {
  entrada: { label: "Entrada", icon: TrendingUp, className: "text-success" },
  saida: { label: "Saída", icon: TrendingDown, className: "text-destructive" },
  ajuste: { label: "Ajuste", icon: RefreshCw, className: "text-warning" },
};

const PecaDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: part, isLoading: isLoadingPart } = usePartDetails(id);
  const { data: compatibilities = [], isLoading: isLoadingCompat } = usePartCompatibilities(id);
  const { data: movements = [], isLoading: isLoadingMovements } = usePartStockMovements(id);

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatYearRange = (inicio: number | null, fim: number | null) => {
    if (inicio && fim) return `${inicio} - ${fim}`;
    if (inicio) return `${inicio}+`;
    if (fim) return `até ${fim}`;
    return "-";
  };

  if (isLoadingPart) {
    return (
      <AppLayout title="Carregando..." description="">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!part) {
    return (
      <AppLayout title="Peça não encontrada" description="">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Peça não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A peça que você está procurando não existe ou foi removida.
          </p>
          <Button asChild>
            <Link to="/pecas">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Peças
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title={part.nome} 
      description={`Detalhes da peça ${part.codigo_interno || ""}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/pecas">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/pecas?duplicate=${part.id}`}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/pecas?edit=${part.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Peça
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Part Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{part.nome}</CardTitle>
                    <Badge className={cn("font-medium", statusConfig[part.status].className)}>
                      {statusConfig[part.status].label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn(condicaoConfig[part.condicao].className)}>
                      {condicaoConfig[part.condicao].label}
                    </Badge>
                    {part.categoria_nome && (
                      <Badge variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {part.categoria_nome}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Código Interno</p>
                  <p className="font-mono font-medium">{part.codigo_interno || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Código OEM</p>
                  <p className="font-mono font-medium">{part.codigo_oem || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quantidade</p>
                  <p className="font-medium text-lg">{part.quantidade}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Qtd. Mínima</p>
                  <p className="font-medium">{part.quantidade_minima}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Preço de Venda
                  </p>
                  <p className="font-medium text-primary text-lg">
                    {formatCurrency(part.preco_venda)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Preço de Custo</p>
                  <p className="font-medium">{formatCurrency(part.preco_custo)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Localização
                  </p>
                  <p className="font-mono font-medium">{part.localizacao || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Car className="w-3 h-3" /> Veículo de Origem
                  </p>
                  <p className="font-medium text-sm">{part.veiculo_info || "-"}</p>
                </div>
              </div>

              {part.observacoes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{part.observacoes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Criado em {format(new Date(part.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span>
                  Atualizado em {format(new Date(part.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Compatibilities Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-4 h-4" />
                Compatibilidades ({compatibilities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCompat ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : compatibilities.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Nenhuma compatibilidade cadastrada.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {compatibilities.map((compat) => (
                    <div
                      key={compat.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {compat.marca} {compat.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatYearRange(compat.ano_inicio, compat.ano_fim)}
                        </p>
                      </div>
                      {compat.observacoes && (
                        <Badge variant="outline" className="text-xs">
                          {compat.observacoes}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image Gallery */}
        <Card>
          <CardContent className="pt-6">
            <PartImageGallery partId={part.id} partName={part.nome} />
          </CardContent>
        </Card>

        {/* Stock Movements History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Histórico de Movimentações
            </CardTitle>
            <StockMovementDialog
              partId={part.id}
              partName={part.nome}
              currentQuantity={part.quantidade}
            >
              <Button size="sm">
                <Package className="w-4 h-4 mr-2" />
                Nova Movimentação
              </Button>
            </StockMovementDialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Data</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground text-right">Quantidade</TableHead>
                  <TableHead className="text-muted-foreground">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMovements ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação registrada para esta peça.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => {
                    const config = movementTypeConfig[movement.tipo];
                    const Icon = config.icon;
                    return (
                      <TableRow key={movement.id} className="border-border">
                        <TableCell className="text-sm">
                          {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center gap-1", config.className)}>
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{config.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {movement.tipo === 'entrada' ? '+' : movement.tipo === 'saida' ? '-' : ''}
                          {movement.quantidade}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {movement.motivo || "-"}
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
    </AppLayout>
  );
};

export default PecaDetalhes;
