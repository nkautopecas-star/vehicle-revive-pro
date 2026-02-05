import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, AlertCircle } from "lucide-react";
import { MarketplaceListing } from "@/hooks/useMarketplaceListings";
import { useImportListingsAsParts } from "@/hooks/useImportListingsAsParts";

interface ImportListingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: MarketplaceListing[];
}

export function ImportListingsDialog({
  open,
  onOpenChange,
  listings,
}: ImportListingsDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const importMutation = useImportListingsAsParts();

  // Filter unlinked listings only
  const unlinkedListings = listings.filter((l) => !l.part_id);
  
  // Filter by search
  const filteredListings = unlinkedListings.filter((l) =>
    l.titulo.toLowerCase().includes(search.toLowerCase())
  );

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearch("");
    }
  }, [open]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredListings.map((l) => l.id)));
    }
  };

  const handleImport = async () => {
    const selectedListings = listings.filter((l) => selectedIds.has(l.id));
    await importMutation.mutateAsync(selectedListings);
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Importar Anúncios como Peças
          </DialogTitle>
          <DialogDescription>
            Selecione os anúncios que deseja importar para o estoque como novas peças.
            Apenas anúncios não vinculados são exibidos.
          </DialogDescription>
        </DialogHeader>

        {unlinkedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-center">
              Todos os anúncios já estão vinculados a peças.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar anúncios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                  disabled={filteredListings.length === 0}
                >
                  {selectedIds.size === filteredListings.length && filteredListings.length > 0
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedIds.size} de {unlinkedListings.length} selecionado(s)
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredListings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum anúncio encontrado
                  </div>
                ) : (
                  filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIds.has(listing.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleSelection(listing.id)}
                    >
                      <Checkbox
                        checked={selectedIds.has(listing.id)}
                        onCheckedChange={() => toggleSelection(listing.id)}
                      />
                      {listing.image_url && (
                        <img
                          src={listing.image_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {listing.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {listing.external_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={listing.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {listing.status === "active"
                            ? "Ativo"
                            : listing.status === "paused"
                            ? "Pausado"
                            : listing.status === "sold"
                            ? "Vendido"
                            : listing.status}
                        </Badge>
                        <span className="font-medium text-sm">
                          {formatPrice(listing.preco)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || importMutation.isPending}
          >
            {importMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
