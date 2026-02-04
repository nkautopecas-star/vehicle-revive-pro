import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, Check, X, Unlink } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import { cn } from "@/lib/utils";

interface LinkPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  currentPartId: string | null;
  onLink: (partId: string | null) => void;
  isLinking: boolean;
}

export function LinkPartDialog({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  currentPartId,
  onLink,
  isLinking,
}: LinkPartDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(currentPartId);
  const { data: parts, isLoading } = useParts();

  const filteredParts = parts?.filter((part) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      part.nome.toLowerCase().includes(searchLower) ||
      part.codigo_interno?.toLowerCase().includes(searchLower) ||
      part.codigo_oem?.toLowerCase().includes(searchLower)
    );
  });

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleConfirm = () => {
    onLink(selectedPartId);
  };

  const handleUnlink = () => {
    setSelectedPartId(null);
    onLink(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Peça ao Anúncio</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {listingTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código interno ou OEM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Current link info */}
          {currentPartId && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-primary" />
                <span>
                  Atualmente vinculado a:{" "}
                  <strong>
                    {parts?.find((p) => p.id === currentPartId)?.nome || "Peça"}
                  </strong>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlink}
                disabled={isLinking}
                className="text-destructive hover:text-destructive"
              >
                <Unlink className="h-4 w-4 mr-1" />
                Desvincular
              </Button>
            </div>
          )}

          {/* Parts list */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-2 pr-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))
              ) : filteredParts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma peça encontrada</p>
                </div>
              ) : (
                filteredParts?.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => setSelectedPartId(part.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedPartId === part.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{part.nome}</span>
                          {selectedPartId === part.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {part.codigo_interno && (
                            <span>Cód: {part.codigo_interno}</span>
                          )}
                          {part.codigo_oem && (
                            <span>OEM: {part.codigo_oem}</span>
                          )}
                        </div>
                        {part.veiculo_info && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {part.veiculo_info}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          variant={part.quantidade > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          Qtd: {part.quantidade}
                        </Badge>
                        <div className="text-sm font-medium mt-1">
                          {formatPrice(part.preco_venda)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLinking}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLinking || selectedPartId === currentPartId}
          >
            {isLinking ? (
              "Vinculando..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Vincular Peça
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
