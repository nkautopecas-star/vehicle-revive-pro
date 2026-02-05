import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, ShoppingBag, AlertCircle, CheckCircle2, ImageOff } from "lucide-react";
import { useMercadoLivre } from "@/hooks/useMercadoLivre";
import { usePartImages } from "@/hooks/usePartImages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PublishToMLButtonProps {
  partId: string;
  partName: string;
  preco: number | null;
}

export function PublishToMLButton({ partId, partName, preco }: PublishToMLButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const { toast } = useToast();
  
  const { accounts, isLoadingAccounts, createListing, isCreatingListing } = useMercadoLivre();
  const { data: images = [], isLoading: isLoadingImages } = usePartImages(partId);
  
  // Check if part is already published
  const { data: existingListings, isLoading: isLoadingListings } = useQuery({
    queryKey: ['part-ml-listings', partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          id,
          external_id,
          status,
          marketplace_account:marketplace_accounts(id, nome_conta)
        `)
        .eq('part_id', partId)
        .neq('status', 'deleted');
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });
  
  const activeAccounts = accounts?.filter(acc => acc.status === 'active') || [];
  const hasImages = images.length > 0;
  const hasActiveAccounts = activeAccounts.length > 0;
  const hasPrice = preco !== null && preco > 0;
  
  const canPublish = hasImages && hasActiveAccounts && hasPrice;
  
  const handlePublish = async () => {
    if (!selectedAccountId) {
      toast({
        title: "Selecione uma conta",
        description: "Escolha uma conta do Mercado Livre para publicar",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createListing({
        accountId: selectedAccountId,
        partId,
      });
      
      if (result.success && result.permalink) {
        toast({
          title: "Anúncio criado com sucesso!",
          description: (
            <div className="flex flex-col gap-2">
              <span>Sua peça foi publicada no Mercado Livre.</span>
              <a 
                href={result.permalink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline flex items-center gap-1"
              >
                Ver anúncio <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ),
        });
        setOpen(false);
      }
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error('Failed to publish:', error);
    }
  };
  
  // If part has no images, show disabled button with tooltip-like message
  if (!hasImages && !isLoadingImages) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <ImageOff className="w-4 h-4" />
        Adicione fotos para publicar no ML
      </Button>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 bg-[#FFE600] text-black hover:bg-[#FFE600]/90">
          <ShoppingBag className="w-4 h-4" />
          Publicar no ML
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Publicar no Mercado Livre
          </DialogTitle>
          <DialogDescription>
            Publique esta peça como um novo anúncio no Mercado Livre.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Part info */}
          <div className="rounded-lg border border-border p-3 bg-muted/50">
            <p className="font-medium text-sm">{partName}</p>
            {preco && (
              <p className="text-lg font-bold text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(preco)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{images.length} foto(s)</span>
            </div>
          </div>
          
          {/* Existing listings */}
          {existingListings && existingListings.length > 0 && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Já publicado</p>
                  <p className="text-muted-foreground mt-1">
                    Esta peça já está publicada em:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {existingListings.map((listing) => (
                      <li key={listing.id} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {listing.marketplace_account?.nome_conta}
                        </Badge>
                        <Badge 
                          className={cn(
                            "text-xs",
                            listing.status === 'active' && "bg-success/20 text-success",
                            listing.status === 'paused' && "bg-warning/20 text-warning",
                            listing.status === 'sold' && "bg-info/20 text-info"
                          )}
                        >
                          {listing.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Validation checks */}
          <div className="space-y-2">
            <div className={cn(
              "flex items-center gap-2 text-sm",
              hasImages ? "text-success" : "text-destructive"
            )}>
              {hasImages ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {hasImages ? `${images.length} foto(s) disponível(is)` : "Nenhuma foto cadastrada"}
            </div>
            
            <div className={cn(
              "flex items-center gap-2 text-sm",
              hasPrice ? "text-success" : "text-destructive"
            )}>
              {hasPrice ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {hasPrice ? "Preço de venda definido" : "Defina um preço de venda"}
            </div>
            
            <div className={cn(
              "flex items-center gap-2 text-sm",
              hasActiveAccounts ? "text-success" : "text-destructive"
            )}>
              {hasActiveAccounts ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {hasActiveAccounts 
                ? `${activeAccounts.length} conta(s) conectada(s)` 
                : "Nenhuma conta ML conectada"}
            </div>
          </div>
          
          {/* Account selection */}
          {hasActiveAccounts && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Conta do Mercado Livre</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome_conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={!canPublish || isCreatingListing || !selectedAccountId}
            className="gap-2 bg-[#FFE600] text-black hover:bg-[#FFE600]/90"
          >
            {isCreatingListing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCreatingListing ? "Publicando..." : "Publicar Anúncio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
