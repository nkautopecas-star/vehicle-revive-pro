import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ShoppingBag, 
  Pause, 
  Play, 
  ExternalLink, 
  Loader2,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PartMLListingsProps {
  partId: string;
}

interface Listing {
  id: string;
  external_id: string | null;
  titulo: string;
  preco: number;
  status: "active" | "paused" | "sold" | "deleted";
  last_sync: string | null;
  marketplace_account: {
    id: string;
    nome_conta: string;
  } | null;
}

const statusConfig = {
  active: { 
    label: "Ativo", 
    className: "bg-success/20 text-success",
    icon: Play,
  },
  paused: { 
    label: "Pausado", 
    className: "bg-warning/20 text-warning",
    icon: Pause,
  },
  sold: { 
    label: "Vendido", 
    className: "bg-info/20 text-info",
    icon: ShoppingBag,
  },
  deleted: { 
    label: "Deletado", 
    className: "bg-destructive/20 text-destructive",
    icon: Trash2,
  },
};

export function PartMLListings({ partId }: PartMLListingsProps) {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    listingId: string;
    action: "pause" | "activate" | "delete";
    title: string;
  } | null>(null);

  // Fetch listings for this part
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["part-ml-listings", partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select(`
          id,
          external_id,
          titulo,
          preco,
          status,
          last_sync,
          marketplace_account:marketplace_accounts(id, nome_conta)
        `)
        .eq("part_id", partId)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!partId,
  });

  // Update listing status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      listingId, 
      accountId, 
      newStatus 
    }: { 
      listingId: string; 
      accountId: string;
      newStatus: "active" | "paused";
    }) => {
      const { data, error } = await supabase.functions.invoke("ml-sync", {
        body: {
          action: "update_listing",
          account_id: accountId,
          listing_id: listingId,
          status: newStatus,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const action = variables.newStatus === "paused" ? "pausado" : "reativado";
      toast.success(`Anúncio ${action} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["part-ml-listings", partId] });
      queryClient.invalidateQueries({ queryKey: ["parts-ml-status"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
    },
    onError: (error) => {
      console.error("Error updating listing:", error);
      toast.error("Erro ao atualizar anúncio. Verifique a conexão com o Mercado Livre.");
    },
  });

  const handleStatusChange = (listing: Listing, newStatus: "active" | "paused") => {
    if (!listing.marketplace_account) {
      toast.error("Conta do marketplace não encontrada");
      return;
    }

    const action = newStatus === "paused" ? "pause" : "activate";
    const title = newStatus === "paused" 
      ? "Pausar anúncio?" 
      : "Reativar anúncio?";

    setConfirmDialog({
      open: true,
      listingId: listing.id,
      action,
      title,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;

    const listing = listings.find(l => l.id === confirmDialog.listingId);
    if (!listing || !listing.marketplace_account) return;

    const newStatus = confirmDialog.action === "pause" ? "paused" : "active";
    
    updateStatusMutation.mutate({
      listingId: listing.id,
      accountId: listing.marketplace_account.id,
      newStatus,
    });

    setConfirmDialog(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Anúncios no Mercado Livre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (listings.length === 0) {
    return null; // Don't show the card if there are no listings
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Anúncios no Mercado Livre ({listings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listings.map((listing) => {
            const config = statusConfig[listing.status];
            const StatusIcon = config.icon;
            const mlUrl = listing.external_id 
              ? `https://www.mercadolivre.com.br/MLB-${listing.external_id.replace("MLB", "")}`
              : null;

            return (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {listing.titulo}
                    </p>
                    <Badge className={cn("shrink-0", config.className)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">
                      {formatCurrency(listing.preco)}
                    </span>
                    {listing.marketplace_account && (
                      <span>• {listing.marketplace_account.nome_conta}</span>
                    )}
                    {listing.last_sync && (
                      <span>
                        • Sincronizado em {format(new Date(listing.last_sync), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {listing.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(listing, "paused")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pausar
                    </Button>
                  )}
                  {listing.status === "paused" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(listing, "active")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Ativar
                    </Button>
                  )}
                  {mlUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a 
                        href={mlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Ver no Mercado Livre"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog 
        open={confirmDialog?.open ?? false} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "pause"
                ? "O anúncio será pausado no Mercado Livre e não aparecerá nas buscas. Você poderá reativá-lo a qualquer momento."
                : "O anúncio será reativado e voltará a aparecer nas buscas do Mercado Livre."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
