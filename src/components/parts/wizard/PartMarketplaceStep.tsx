 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import {
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { ChevronLeft, Loader2, Package, Scale, Ruler, Info } from "lucide-react";
 import type { ExtendedPartFormData, MarketplaceConfig } from "../PartFormWizard";
 import type { Part } from "@/hooks/useParts";
 import { useMercadoLivre } from "@/hooks/useMercadoLivre";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 
 interface Category {
   id: string;
   name: string;
 }
 
 interface PartMarketplaceStepProps {
   formData: ExtendedPartFormData;
   setFormData: (data: ExtendedPartFormData) => void;
   marketplaces: MarketplaceConfig;
   setMarketplaces: (config: MarketplaceConfig) => void;
   categories: Category[];
   isLoading?: boolean;
   onPrevious: () => void;
   onSubmit: () => void;
   isEditing: boolean;
   isDuplicating: boolean;
   part?: Part | null;
 }
 
 // ML Category mapping based on internal categories
 const ML_CATEGORY_SUGGESTIONS: Record<string, string> = {
   "Motor": "MLB1747 - Peças para Motor",
   "Suspensão": "MLB1754 - Suspensão e Direção",
   "Freios": "MLB1755 - Freios",
   "Injeção": "MLB1756 - Injeção Eletrônica",
   "Transmissão": "MLB1750 - Câmbio e Transmissão",
   "Elétrica": "MLB1751 - Parte Elétrica",
   "Carroceria": "MLB1752 - Carroceria e Estrutura",
   "Interior": "MLB1753 - Interior e Acessórios",
 };
 
 export function PartMarketplaceStep({
   formData,
   setFormData,
   marketplaces,
   setMarketplaces,
   categories,
   isLoading,
   onPrevious,
   onSubmit,
   isEditing,
   isDuplicating,
 }: PartMarketplaceStepProps) {
   const { accounts: mlAccounts = [] } = useMercadoLivre();
   const activeMLAccount = mlAccounts?.find(acc => acc.status === 'active');
 
   // Get category name for ML suggestion
   const categoryName = categories.find(c => c.id === formData.categoria_id)?.name || "";
   const suggestedMLCategory = ML_CATEGORY_SUGGESTIONS[categoryName] || "";
 
   const hasAnyMarketplaceSelected = marketplaces.mercadolivre || marketplaces.olx || marketplaces.shopee;
 
   return (
     <>
       <DialogHeader>
         <DialogTitle>Anunciar nos Marketplaces</DialogTitle>
         <DialogDescription>
           Selecione onde deseja anunciar esta peça e preencha as informações de envio.
         </DialogDescription>
       </DialogHeader>
 
       <div className="space-y-6 py-4">
         {/* Marketplace Selection */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <Package className="w-4 h-4" />
               Marketplaces
             </CardTitle>
             <CardDescription>
               Escolha em quais plataformas deseja publicar o anúncio
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid grid-cols-3 gap-4">
               {/* Mercado Livre */}
               <label
                 className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                   marketplaces.mercadolivre
                     ? "border-primary bg-primary/5"
                     : "border-border hover:border-primary/50"
                 } ${!activeMLAccount ? "opacity-50" : ""}`}
               >
                 <Checkbox
                   checked={marketplaces.mercadolivre}
                   onCheckedChange={(checked) =>
                     setMarketplaces({ ...marketplaces, mercadolivre: !!checked })
                   }
                   disabled={!activeMLAccount}
                 />
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <span className="font-medium text-sm">Mercado Livre</span>
                     {activeMLAccount && (
                       <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                         Conectado
                       </Badge>
                     )}
                   </div>
                   {!activeMLAccount && (
                     <p className="text-xs text-muted-foreground">Conecte sua conta</p>
                   )}
                 </div>
               </label>
 
               {/* OLX */}
               <label
                 className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all opacity-50 border-border"
               >
                 <Checkbox checked={false} disabled />
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <span className="font-medium text-sm">OLX</span>
                     <Badge variant="outline" className="text-xs">Em breve</Badge>
                   </div>
                   <p className="text-xs text-muted-foreground">Aguardando integração</p>
                 </div>
               </label>
 
               {/* Shopee */}
               <label
                 className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all opacity-50 border-border"
               >
                 <Checkbox checked={false} disabled />
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <span className="font-medium text-sm">Shopee</span>
                     <Badge variant="outline" className="text-xs">Em breve</Badge>
                   </div>
                   <p className="text-xs text-muted-foreground">Aguardando integração</p>
                 </div>
               </label>
             </div>
           </CardContent>
         </Card>
 
         {/* Shipping Dimensions - Always visible when ML selected */}
         {marketplaces.mercadolivre && (
           <>
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Scale className="w-4 h-4" />
                   Peso e Dimensões
                 </CardTitle>
                 <CardDescription>
                   Informações obrigatórias para cálculo de frete
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-4 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="peso">Peso (gramas)</Label>
                     <Input
                       id="peso"
                       type="number"
                       min="1"
                       placeholder="500"
                       value={formData.peso_gramas || ""}
                       onChange={(e) =>
                         setFormData({
                           ...formData,
                           peso_gramas: parseInt(e.target.value) || undefined,
                         })
                       }
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="comprimento">Comprimento (cm)</Label>
                     <Input
                       id="comprimento"
                       type="number"
                       step="0.1"
                       min="1"
                       placeholder="30"
                       value={formData.comprimento_cm || ""}
                       onChange={(e) =>
                         setFormData({
                           ...formData,
                           comprimento_cm: parseFloat(e.target.value) || undefined,
                         })
                       }
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="largura">Largura (cm)</Label>
                     <Input
                       id="largura"
                       type="number"
                       step="0.1"
                       min="1"
                       placeholder="20"
                       value={formData.largura_cm || ""}
                       onChange={(e) =>
                         setFormData({
                           ...formData,
                           largura_cm: parseFloat(e.target.value) || undefined,
                         })
                       }
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="altura">Altura (cm)</Label>
                     <Input
                       id="altura"
                       type="number"
                       step="0.1"
                       min="1"
                       placeholder="15"
                       value={formData.altura_cm || ""}
                       onChange={(e) =>
                         setFormData({
                           ...formData,
                           altura_cm: parseFloat(e.target.value) || undefined,
                         })
                       }
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* ML-specific info preview */}
             <Card className="bg-muted/30">
               <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Ruler className="w-4 h-4" />
                   Prévia do Anúncio (Mercado Livre)
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-muted-foreground">Título:</span>
                     <p className="font-medium">{formData.nome || "—"}</p>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Preço:</span>
                     <p className="font-medium">
                       {formData.preco_venda
                         ? `R$ ${formData.preco_venda.toFixed(2)}`
                         : "Não definido"}
                     </p>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Categoria sugerida:</span>
                     <p className="font-medium">{suggestedMLCategory || "Selecionar categoria"}</p>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Condição:</span>
                     <p className="font-medium capitalize">{formData.condicao}</p>
                   </div>
                 </div>
                 {formData.codigo_oem && (
                   <div className="text-sm">
                     <span className="text-muted-foreground">Código OEM:</span>
                     <p className="font-medium font-mono">{formData.codigo_oem}</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           </>
         )}
 
         {/* No marketplace selected - show skip option */}
         {!hasAnyMarketplaceSelected && (
           <div className="text-center py-4 text-muted-foreground">
             <p>Nenhum marketplace selecionado.</p>
             <p className="text-sm">A peça será cadastrada apenas no estoque interno.</p>
           </div>
         )}
 
         <Separator />
 
         <div className="flex justify-between gap-3">
           <Button
             type="button"
             variant="outline"
             onClick={onPrevious}
             disabled={isLoading}
             className="gap-2"
           >
             <ChevronLeft className="w-4 h-4" />
             Voltar
           </Button>
           <Button
             type="button"
             onClick={onSubmit}
             disabled={isLoading || (marketplaces.mercadolivre && (!formData.peso_gramas || !formData.comprimento_cm || !formData.largura_cm || !formData.altura_cm))}
           >
             {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
             {isDuplicating
               ? "Criar Cópia"
               : isEditing
               ? "Salvar Alterações"
               : hasAnyMarketplaceSelected
               ? "Cadastrar e Anunciar"
               : "Cadastrar Peça"}
           </Button>
         </div>
       </div>
     </>
   );
 }