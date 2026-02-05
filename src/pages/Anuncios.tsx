import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Package,
  Filter,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  useMarketplaceAccounts,
  useLinkListingToPart,
  useMarketplaceListingStats,
  MarketplaceListing,
} from "@/hooks/useMarketplaceListings";
import { useGroupedListings } from "@/hooks/useGroupedListings";
import { LinkPartDialog } from "@/components/anuncios/LinkPartDialog";
import { AnunciosPagination } from "@/components/anuncios/AnunciosPagination";
import { GroupedListingRow } from "@/components/anuncios/GroupedListingRow";

export default function Anuncios() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'preco' | 'titulo'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: accounts } = useMarketplaceAccounts();
  const { data: groupedResult, isLoading, refetch, isFetching } = useGroupedListings({
    accountId: accountFilter !== "all" ? accountFilter : undefined,
    status: statusFilter,
    search: search.length >= 2 ? search : undefined,
    page: currentPage,
    pageSize,
    sortBy,
    sortOrder,
  });
  const { data: stats } = useMarketplaceListingStats(
    accountFilter !== "all" ? accountFilter : undefined
  );
  const linkMutation = useLinkListingToPart();

  const groups = groupedResult?.data || [];

  const handleOpenLinkDialog = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setLinkDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
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
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-') as ['created_at' | 'updated_at' | 'preco' | 'titulo', 'asc' | 'desc'];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Mais recentes</SelectItem>
                  <SelectItem value="created_at-asc">Mais antigos</SelectItem>
                  <SelectItem value="preco-desc">Maior preço</SelectItem>
                  <SelectItem value="preco-asc">Menor preço</SelectItem>
                  <SelectItem value="titulo-asc">Título A-Z</SelectItem>
                  <SelectItem value="titulo-desc">Título Z-A</SelectItem>
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
                  <TableHead className="w-8"></TableHead>
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
                      <td className="p-2"><Skeleton className="h-4 w-4" /></td>
                      <td className="p-2"><Skeleton className="h-10 w-10 rounded" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-[250px]" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-[80px]" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-[60px]" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-[120px]" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-[80px]" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-[40px]" /></td>
                    </TableRow>
                  ))
                ) : groups.length === 0 ? (
                  <TableRow>
                    <td colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="h-8 w-8" />
                        <p>Nenhum anúncio encontrado</p>
                        <p className="text-sm">
                          Sincronize seus anúncios na página de Integrações
                        </p>
                      </div>
                    </td>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <GroupedListingRow
                      key={group.groupKey}
                      group={group}
                      onOpenLinkDialog={handleOpenLinkDialog}
                      formatPrice={formatPrice}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {groupedResult && groupedResult.totalCount > 0 && (
          <AnunciosPagination
            currentPage={currentPage}
            totalPages={groupedResult.totalPages}
            totalCount={groupedResult.totalCount}
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
