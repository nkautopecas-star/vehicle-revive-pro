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
import { Car, Calendar, AlertCircle, Tag } from "lucide-react";
 import type { ExtendedPartFormData, MarketplaceConfig, NewCompatibility } from "../PartFormWizard";
import type { MarketplaceAccountSelection } from "../PartFormWizard";
 import type { Part } from "@/hooks/useParts";
 import { useMercadoLivre } from "@/hooks/useMercadoLivre";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { usePartCompatibilities } from "@/hooks/usePartCompatibilities";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { CompatibilityInlineForm, type CompatibilityEntry } from "./CompatibilityInlineForm";
 
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
   partId?: string;
   newCompatibilities: CompatibilityEntry[];
   setNewCompatibilities: (compatibilities: CompatibilityEntry[]) => void;
  accountSelection: MarketplaceAccountSelection;
  setAccountSelection: (selection: MarketplaceAccountSelection) => void;
 }
 
// ML Categories for Autoparts (MLB = Mercado Libre Brazil)
const ML_CATEGORIES = [
  { id: "MLB1747", name: "Autopeças (Geral)" },
  { id: "MLB1748", name: "Motor e Componentes" },
  { id: "MLB1749", name: "Arrefecimento" },
  { id: "MLB1750", name: "Câmbio e Transmissão" },
  { id: "MLB1751", name: "Parte Elétrica" },
  { id: "MLB1752", name: "Carroceria e Estrutura" },
  { id: "MLB1753", name: "Interior e Acessórios" },
  { id: "MLB1754", name: "Suspensão e Direção" },
  { id: "MLB1755", name: "Freios" },
  { id: "MLB1756", name: "Injeção Eletrônica" },
  { id: "MLB1757", name: "Escapamento" },
  { id: "MLB1758", name: "Combustível" },
  { id: "MLB1759", name: "Embreagem" },
  { id: "MLB1760", name: "Ignição" },
  { id: "MLB1761", name: "Vidros e Retrovisores" },
  { id: "MLB1762", name: "Faróis e Lanternas" },
  { id: "MLB1763", name: "Ar Condicionado Automotivo" },
  { id: "MLB1764", name: "Rodas e Pneus" },
];

// Category suggestion based on internal category name
const CATEGORY_SUGGESTIONS: Record<string, string> = {
  "Motor": "MLB1748",
  "Suspensão": "MLB1754",
  "Freios": "MLB1755",
  "Injeção": "MLB1756",
  "Transmissão": "MLB1750",
  "Elétrica": "MLB1751",
  "Carroceria": "MLB1752",
  "Interior": "MLB1753",
  "Arrefecimento": "MLB1749",
  "Escapamento": "MLB1757",
  "Combustível": "MLB1758",
  "Embreagem": "MLB1759",
  "Ignição": "MLB1760",
  "Vidros": "MLB1761",
  "Faróis": "MLB1762",
  "Lanternas": "MLB1762",
  "Ar Condicionado": "MLB1763",
  "Rodas": "MLB1764",
  "Pneus": "MLB1764",
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
   part,
   partId,
   newCompatibilities,
   setNewCompatibilities,
  accountSelection,
  setAccountSelection,
 }: PartMarketplaceStepProps) {
   const { accounts: mlAccounts = [] } = useMercadoLivre();
  const activeMLAccounts = mlAccounts?.filter(acc => acc.status === 'active') || [];
  const hasActiveMLAccount = activeMLAccounts.length > 0;

  // Auto-select first account if only one is available
  const selectedMLAccountId = accountSelection.mercadolivre_account_id || 
    (activeMLAccounts.length === 1 ? activeMLAccounts[0].id : undefined);

  // Get category name for ML suggestion
  const categoryName = categories.find(c => c.id === formData.categoria_id)?.name || "";
  const suggestedCategoryId = CATEGORY_SUGGESTIONS[categoryName] || "MLB1747";
  
  // Selected category (use suggestion if not manually selected)
  const selectedCategoryId = accountSelection.mercadolivre_category_id || suggestedCategoryId;
  const selectedCategory = ML_CATEGORIES.find(c => c.id === selectedCategoryId);
 
   // Fetch existing compatibilities for the part
   const { data: compatibilities = [] } = usePartCompatibilities(part?.id || partId);
 
   // Combine existing and new compatibilities for display
   const allCompatibilities = [
     ...compatibilities.map(c => ({
       id: c.id,
       marca: c.marca,
       modelo: c.modelo,
       ano_inicio: c.ano_inicio,
       ano_fim: c.ano_fim,
       isExisting: true,
     })),
     ...newCompatibilities.map(c => ({
       ...c,
       isExisting: false,
     })),
   ];
 
   const handleAddCompatibility = (compat: Omit<CompatibilityEntry, "id">) => {
     const newEntry: CompatibilityEntry = {
       ...compat,
       id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
     };
     setNewCompatibilities([...newCompatibilities, newEntry]);
   };
 
  const handleAddMultipleCompatibilities = (compats: Omit<CompatibilityEntry, "id">[]) => {
    const newEntries: CompatibilityEntry[] = compats.map((compat, index) => ({
      ...compat,
      id: `new-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    setNewCompatibilities([...newCompatibilities, ...newEntries]);
  };

   const handleRemoveCompatibility = (id: string) => {
     setNewCompatibilities(newCompatibilities.filter(c => c.id !== id));
   };
 
   const hasAnyMarketplaceSelected = marketplaces.mercadolivre || marketplaces.olx || marketplaces.shopee;
 
   const formatYearRange = (inicio: number | null, fim: number | null) => {
     if (inicio && fim) return `${inicio} - ${fim}`;
     if (inicio) return `${inicio}+`;
     if (fim) return `até ${fim}`;
     return null;
   };
 
   const hasCompatibilities = allCompatibilities.length > 0;
 
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
                <div
                  className={`flex flex-col gap-3 p-4 border rounded-lg transition-all ${
                   marketplaces.mercadolivre
                     ? "border-primary bg-primary/5"
                     : "border-border hover:border-primary/50"
                  } ${!hasActiveMLAccount ? "opacity-50" : ""}`}
               >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={marketplaces.mercadolivre}
                      onCheckedChange={(checked) => {
                        setMarketplaces({ ...marketplaces, mercadolivre: !!checked });
                        if (checked && activeMLAccounts.length === 1) {
                          setAccountSelection({ ...accountSelection, mercadolivre_account_id: activeMLAccounts[0].id });
                        }
                      }}
                      disabled={!hasActiveMLAccount}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Mercado Livre</span>
                        {hasActiveMLAccount && (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                            {activeMLAccounts.length} conta{activeMLAccounts.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {!hasActiveMLAccount && (
                        <p className="text-xs text-muted-foreground">Conecte sua conta</p>
                      )}
                   </div>
                  </label>

                  {/* Account selector when multiple accounts */}
                  {marketplaces.mercadolivre && activeMLAccounts.length > 1 && (
                    <Select
                      value={selectedMLAccountId || ""}
                      onValueChange={(value) => 
                        setAccountSelection({ ...accountSelection, mercadolivre_account_id: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeMLAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.nome_conta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
 
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
 
          {/* ML Category Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categoria no Mercado Livre
              </CardTitle>
              <CardDescription>
                Selecione a categoria mais adequada para sua peça
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => 
                  setAccountSelection({ ...accountSelection, mercadolivre_category_id: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {ML_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-mono">{cat.id}</span>
                        <span>{cat.name}</span>
                        {cat.id === suggestedCategoryId && (
                          <Badge variant="secondary" className="text-xs ml-1">Sugerido</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryName && suggestedCategoryId !== "MLB1747" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Sugestão baseada na categoria "{categoryName}" do seu estoque
                </p>
              )}
            </CardContent>
          </Card>

         {/* Compatibility Form */}
         <CompatibilityInlineForm
           compatibilities={newCompatibilities}
           onAdd={handleAddCompatibility}
            onAddMultiple={handleAddMultipleCompatibilities}
           onRemove={handleRemoveCompatibility}
           partName={formData.nome}
           vehicleInfo={part?.veiculo_info}
           categoryName={categoryName}
         />
 
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
                      <span className="text-muted-foreground">Categoria:</span>
                      <p className="font-medium">
                        {selectedCategory ? `${selectedCategory.id} - ${selectedCategory.name}` : "Selecionar"}
                      </p>
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
                 
                 {/* Compatibilities Section */}
                 <Separator className="my-3" />
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-sm">
                     <Car className="w-4 h-4 text-muted-foreground" />
                 <span className="text-muted-foreground">Compatibilidades ({allCompatibilities.length}):</span>
                   </div>
                   {hasCompatibilities ? (
                     <div className="flex flex-wrap gap-2">
                   {allCompatibilities.slice(0, 6).map((compat) => (
                     <Badge 
                       key={compat.id} 
                       variant={compat.isExisting ? "secondary" : "default"}
                       className="text-xs"
                     >
                           {compat.marca} {compat.modelo}
                           {formatYearRange(compat.ano_inicio, compat.ano_fim) && (
                             <span className="ml-1 opacity-70">
                               ({formatYearRange(compat.ano_inicio, compat.ano_fim)})
                             </span>
                           )}
                         </Badge>
                       ))}
                   {allCompatibilities.length > 6 && (
                         <Badge variant="outline" className="text-xs">
                       +{allCompatibilities.length - 6} mais
                         </Badge>
                       )}
                     </div>
                   ) : (
                     <Alert variant="default" className="py-2">
                       <AlertCircle className="h-4 w-4" />
                       <AlertDescription className="text-xs">
                         Nenhuma compatibilidade cadastrada. Adicione na página de detalhes da peça para melhorar a visibilidade do anúncio.
                       </AlertDescription>
                     </Alert>
                   )}
                 </div>
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
              disabled={
                isLoading || 
                (marketplaces.mercadolivre && (
                  !formData.peso_gramas || 
                  !formData.comprimento_cm || 
                  !formData.largura_cm || 
                  !formData.altura_cm ||
                  (activeMLAccounts.length > 1 && !selectedMLAccountId)
                ))
              }
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