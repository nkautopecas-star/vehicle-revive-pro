import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Search,
  ExternalLink,
  Package,
  Filter,
  RefreshCw,
  ShoppingBag,
  Link2,
  ImageIcon,
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  useMarketplaceListings,
  useMarketplaceAccounts,
  useLinkListingToPart,
  useMarketplaceListingStats,
  MarketplaceListing,
} from "@/hooks/useMarketplaceListings";
import { LinkPartDialog } from "@/components/anuncios/LinkPartDialog";
import { AnunciosPagination } from "@/components/anuncios/AnunciosPagination";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function Anuncios() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: accounts, isLoading: accountsLoading } = useMarketplaceAccounts();
  const { data: paginatedResult, isLoading, refetch, isFetching } = useMarketplaceListings({
    accountId: accountFilter !== "all" ? accountFilter : undefined,
    status: statusFilter,
    search: search.length >= 2 ? search : undefined,
    page: currentPage,
    pageSize,
  });
  const { data: stats } = useMarketplaceListingStats(
    accountFilter !== "all" ? accountFilter : undefined
  );
  const linkMutation = useLinkListingToPart();

  const listings = paginatedResult?.data || [];

  const handleOpenLinkDialog = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setLinkDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleLinkPart = (partId: string | null) => {
    if (!selectedListing) return;
    linkMutation.mutate(
      { listingId: selectedListing.id, partId },
      {
        onSuccess: () => {
          setLinkDialogOpen(false);
          setSelectedListing(null);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-0">Ativo</Badge>;
      case "paused":
        return <Badge variant="secondary">Pausado</Badge>;
      case "sold":
        return <Badge className="bg-primary/20 text-primary border-0">Vendido</Badge>;
      case "deleted":
        return <Badge variant="destructive">Excluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <AppLayout title="Anúncios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Anúncios do Mercado Livre</h1>
            <p className="text-muted-foreground">
              Gerencie seus anúncios importados do Mercado Livre
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Anúncios</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <div className="h-2 w-2 rounded-full bg-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pausados</CardTitle>
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.paused || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
              <div className="h-2 w-2 rounded-full bg-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.sold || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vinculados a Peças</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.linked || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                  <SelectItem value="sold">Vendidos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome_conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
                  <TableHead className="w-[350px]">Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Peça Vinculada</TableHead>
                  <TableHead>Última Sinc.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                    </TableRow>
                  ))
                ) : listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="h-8 w-8" />
                        <p>Nenhum anúncio encontrado</p>
                        <p className="text-sm">
                          Sincronize seus anúncios na página de Integrações
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        {listing.image_url ? (
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer">
                                <AspectRatio ratio={1}>
                                  <img
                                    src={listing.image_url}
                                    alt={listing.titulo}
                                    className="w-full h-full object-cover"
                                  />
                                </AspectRatio>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-64 p-2">
                              <AspectRatio ratio={1}>
                                <img
                                  src={listing.image_url}
                                  alt={listing.titulo}
                                  className="w-full h-full object-cover rounded"
                                />
                              </AspectRatio>
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium line-clamp-1">
                            {listing.titulo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {listing.external_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(listing.preco)}
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell>
                        {listing.part ? (
                          <Link
                            to={`/pecas/${listing.part.id}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Package className="h-3 w-3" />
                            {listing.part.codigo_interno || listing.part.nome}
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenLinkDialog(listing)}
                            className="text-muted-foreground hover:text-primary h-auto py-1 px-2"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Vincular peça
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {listing.last_sync
                          ? formatDistanceToNow(new Date(listing.last_sync), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenLinkDialog(listing)}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {listing.part ? "Alterar vínculo" : "Vincular peça"}
                            </TooltipContent>
                          </Tooltip>
                          {listing.external_id && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-8 w-8"
                                >
                                  <a
                                    href={`https://www.mercadolivre.com.br/p/${listing.external_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Abrir no Mercado Livre</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {paginatedResult && paginatedResult.totalCount > 0 && (
          <AnunciosPagination
            currentPage={currentPage}
            totalPages={paginatedResult.totalPages}
            totalCount={paginatedResult.totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Link Part Dialog */}
        {selectedListing && (
          <LinkPartDialog
            open={linkDialogOpen}
            onOpenChange={setLinkDialogOpen}
            listingId={selectedListing.id}
            listingTitle={selectedListing.titulo}
            currentPartId={selectedListing.part_id}
            onLink={handleLinkPart}
            isLinking={linkMutation.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}
