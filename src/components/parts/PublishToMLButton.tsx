import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2, ShoppingBag, AlertCircle, CheckCircle2, ImageOff, Sparkles, Pencil } from "lucide-react";
import { useMercadoLivre } from "@/hooks/useMercadoLivre";
import { usePartImages } from "@/hooks/usePartImages";
import { useSuggestPartInfo } from "@/hooks/useSuggestPartInfo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ListingTypeSelector } from "./ListingTypeSelector";
import { useEnabledListingTypes, calculateListingTypePrice } from "@/hooks/useListingTypeRules";

interface PublishToMLButtonProps {
  partId: string;
  partName: string;
  preco: number | null;
  codigoOem?: string | null;
  vehicleInfo?: string | null;
}

export function PublishToMLButton({ partId, partName, preco, codigoOem, vehicleInfo }: PublishToMLButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>([]);
  const [publishingProgress, setPublishingProgress] = useState<{ current: number; total: number } | null>(null);
  const [title, setTitle] = useState(partName);
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  
  const { accounts, isLoadingAccounts, createListing, isCreatingListing } = useMercadoLivre();
  const { data: images = [], isLoading: isLoadingImages } = usePartImages(partId);
  const { data: listingTypeRules } = useEnabledListingTypes('mercadolivre');
  const { isLoading: isSuggestingAI, suggestFromOEM } = useSuggestPartInfo();
  
  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(partName);
      setDescription("");
    }
  }, [open, partName]);

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
  
  const hasSelectedTypes = selectedListingTypes.length > 0;
  const canPublish = hasImages && hasActiveAccounts && hasPrice && hasSelectedTypes && title.trim().length > 0;
  
  const handleSuggestTitle = async () => {
    if (!codigoOem) {
      toast({
        title: "Código OEM necessário",
        description: "Cadastre o código OEM da peça para obter sugestões da IA",
        variant: "destructive",
      });
      return;
    }
    
    const suggestion = await suggestFromOEM(codigoOem, vehicleInfo || undefined);
    if (suggestion) {
      if (suggestion.tituloML) {
        setTitle(suggestion.tituloML);
      }
      if (suggestion.descricao) {
        setDescription(prev => prev || suggestion.descricao || "");
      }
      toast({
        title: "Sugestão aplicada",
        description: `Título sugerido pela IA com confiança ${suggestion.confianca}`,
      });
    }
  };

  const handlePublish = async () => {
    if (!selectedAccountId) {
      toast({
        title: "Selecione uma conta",
        description: "Escolha uma conta do Mercado Livre para publicar",
        variant: "destructive",
      });
      return;
    }

    if (selectedListingTypes.length === 0) {
      toast({
        title: "Selecione ao menos um tipo",
        description: "Escolha ao menos um tipo de anúncio para criar",
        variant: "destructive",
      });
      return;
    }
    
    const successfulListings: { type: string; permalink?: string }[] = [];
    const failedListings: string[] = [];
    
    setPublishingProgress({ current: 0, total: selectedListingTypes.length });
    
    for (let i = 0; i < selectedListingTypes.length; i++) {
      const listingType = selectedListingTypes[i];
      const rule = listingTypeRules?.find(r => r.listing_type === listingType);
      const calculatedPrice = rule && preco 
        ? calculateListingTypePrice(preco, rule.price_variation_percent)
        : preco;
      
      setPublishingProgress({ current: i + 1, total: selectedListingTypes.length });
      
      try {
        const result = await createListing({
          accountId: selectedAccountId,
          partId,
          listingData: {
            listing_type_id: listingType,
            price: calculatedPrice,
            title: title.trim(),
            description: description.trim() || undefined,
          },
        });
        
        if (result.success) {
          successfulListings.push({ 
            type: rule?.listing_type_name || listingType, 
            permalink: result.permalink 
          });
        } else {
          failedListings.push(rule?.listing_type_name || listingType);
        }
      } catch (error) {
        console.error(`Failed to publish ${listingType}:`, error);
        failedListings.push(rule?.listing_type_name || listingType);
      }
    }
    
    setPublishingProgress(null);
    
    if (successfulListings.length > 0) {
      toast({
        title: `${successfulListings.length} anúncio(s) criado(s)!`,
        description: (
          <div className="flex flex-col gap-2">
            {successfulListings.map((listing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-success" />
                <span>{listing.type}</span>
                {listing.permalink && (
                  <a 
                    href={listing.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
            {failedListings.length > 0 && (
              <p className="text-destructive text-xs mt-1">
                Falhou: {failedListings.join(', ')}
              </p>
            )}
          </div>
        ),
      });
      setOpen(false);
    } else {
      toast({
        title: "Erro ao publicar",
        description: "Nenhum anúncio foi criado. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              {codigoOem && <span>• OEM: {codigoOem}</span>}
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
          
          {/* Title field */}
          <div className="space-y-2">
            <Label htmlFor="ml-title" className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5" />
              Título do anúncio
            </Label>
            <div className="flex gap-2">
              <Input
                id="ml-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.substring(0, 60))}
                placeholder="Título do anúncio no Mercado Livre"
                maxLength={60}
              />
              {codigoOem && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSuggestTitle}
                  disabled={isSuggestingAI}
                  title="Sugerir título com IA (via OEM)"
                >
                  {isSuggestingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {title.length}/60 caracteres
              {!codigoOem && " • Cadastre o OEM para usar sugestão da IA"}
            </p>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="ml-description">Descrição do anúncio</Label>
            <Textarea
              id="ml-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada da peça para o anúncio. Se vazio, será gerada automaticamente com os dados da peça."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Opcional — se vazio, será gerada automaticamente com OEM, condição e compatibilidades.
            </p>
          </div>

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
              <Label>Conta do Mercado Livre</Label>
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

          {/* Listing type selection */}
          {hasPrice && preco && (
            <ListingTypeSelector
              basePrice={preco}
              selectedTypes={selectedListingTypes}
              onSelectionChange={setSelectedListingTypes}
            />
          )}
          
          {/* Publishing progress */}
          {publishingProgress && (
            <div className="rounded-lg border border-primary/50 bg-primary/10 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">
                  Criando anúncio {publishingProgress.current} de {publishingProgress.total}...
                </span>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={!canPublish || isCreatingListing || !selectedAccountId || publishingProgress !== null}
            className="gap-2 bg-[#FFE600] text-black hover:bg-[#FFE600]/90"
          >
            {(isCreatingListing || publishingProgress) && <Loader2 className="w-4 h-4 animate-spin" />}
            {publishingProgress 
              ? `Publicando ${publishingProgress.current}/${publishingProgress.total}...` 
              : selectedListingTypes.length > 1 
                ? `Publicar ${selectedListingTypes.length} Anúncios` 
                : "Publicar Anúncio"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
