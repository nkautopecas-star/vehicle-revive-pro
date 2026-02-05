 import { useState, useCallback } from "react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Plus, X, Car, Sparkles, Loader2, Check } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface CompatibilityEntry {
   id: string;
   marca: string;
   modelo: string;
   ano_inicio: number | null;
   ano_fim: number | null;
 }
 
 export interface AISuggestion {
   marca: string;
   modelo: string;
   ano_inicio?: number;
   ano_fim?: number;
   observacoes?: string;
 }
 
 interface CompatibilityInlineFormProps {
   compatibilities: CompatibilityEntry[];
   onAdd: (compat: Omit<CompatibilityEntry, "id">) => void;
  onAddMultiple?: (compats: Omit<CompatibilityEntry, "id">[]) => void;
   onRemove: (id: string) => void;
   partName?: string;
   vehicleInfo?: string;
   categoryName?: string;
 }
 
 export function CompatibilityInlineForm({
   compatibilities,
   onAdd,
  onAddMultiple,
   onRemove,
   partName,
   vehicleInfo,
   categoryName,
 }: CompatibilityInlineFormProps) {
   const [isAdding, setIsAdding] = useState(false);
   const [marca, setMarca] = useState("");
   const [modelo, setModelo] = useState("");
   const [anoInicio, setAnoInicio] = useState<string>("");
   const [anoFim, setAnoFim] = useState<string>("");
 
   const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
   const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
   const [showSuggestions, setShowSuggestions] = useState(false);
 
   const handleAdd = () => {
     if (!marca.trim() || !modelo.trim()) return;
     
     onAdd({
       marca: marca.trim(),
       modelo: modelo.trim(),
       ano_inicio: anoInicio ? parseInt(anoInicio) : null,
       ano_fim: anoFim ? parseInt(anoFim) : null,
     });
     
     // Reset form
     setMarca("");
     setModelo("");
     setAnoInicio("");
     setAnoFim("");
     setIsAdding(false);
   };
 
   const formatYearRange = (inicio: number | null, fim: number | null) => {
     if (inicio && fim) return `${inicio} - ${fim}`;
     if (inicio) return `${inicio}+`;
     if (fim) return `até ${fim}`;
     return "";
   };
 
   const handleSuggestWithAI = useCallback(async () => {
     if (!partName?.trim()) {
       toast.error("Preencha o nome da peça para sugerir compatibilidades");
       return;
     }
 
     setIsLoadingSuggestions(true);
     setSuggestions([]);
     setShowSuggestions(true);
 
     try {
       const { data, error } = await supabase.functions.invoke("suggest-compatibilities", {
         body: {
           partName: partName,
           vehicleInfo: vehicleInfo || categoryName || "",
           existingCompatibilities: compatibilities,
         },
       });
 
       if (error) {
         console.error("Error fetching suggestions:", error);
         toast.error("Erro ao buscar sugestões. Tente novamente.");
         setShowSuggestions(false);
         return;
       }
 
       if (data?.suggestions && data.suggestions.length > 0) {
         setSuggestions(data.suggestions);
         toast.success(`${data.suggestions.length} sugestões encontradas!`);
       } else {
         toast.info("Nenhuma sugestão encontrada para esta peça.");
         setShowSuggestions(false);
       }
     } catch (err) {
       console.error("Error:", err);
       toast.error("Erro ao conectar com a IA. Tente novamente.");
       setShowSuggestions(false);
     } finally {
       setIsLoadingSuggestions(false);
     }
   }, [partName, vehicleInfo, categoryName, compatibilities]);
 
   const handleAcceptSuggestion = (suggestion: AISuggestion) => {
     onAdd({
       marca: suggestion.marca,
       modelo: suggestion.modelo,
       ano_inicio: suggestion.ano_inicio || null,
       ano_fim: suggestion.ano_fim || null,
     });
     // Remove from suggestions list
     setSuggestions(prev => prev.filter(s => 
       !(s.marca === suggestion.marca && s.modelo === suggestion.modelo)
     ));
     toast.success(`${suggestion.marca} ${suggestion.modelo} adicionado!`);
   };
 
   const handleAcceptAllSuggestions = () => {
    const allCompats = suggestions.map(suggestion => ({
         marca: suggestion.marca,
         modelo: suggestion.modelo,
         ano_inicio: suggestion.ano_inicio || null,
         ano_fim: suggestion.ano_fim || null,
    }));
    
    if (onAddMultiple) {
      onAddMultiple(allCompats);
    } else {
      // Fallback to individual adds
      allCompats.forEach(compat => onAdd(compat));
    }
    
     setSuggestions([]);
     setShowSuggestions(false);
     toast.success("Todas as sugestões foram adicionadas!");
   };
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="text-base flex items-center gap-2">
               <Car className="w-4 h-4" />
               Compatibilidades
             </CardTitle>
             <CardDescription>
               Informe os veículos compatíveis com esta peça
             </CardDescription>
           </div>
           <div className="flex gap-2">
             {!isAdding && !showSuggestions && (
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={handleSuggestWithAI}
                 disabled={isLoadingSuggestions || !partName?.trim()}
                 className="gap-2"
               >
                 {isLoadingSuggestions ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Sparkles className="w-4 h-4" />
                 )}
                 Sugerir com IA
               </Button>
             )}
             {!isAdding && !showSuggestions && (
             <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={() => setIsAdding(true)}
               className="gap-2"
             >
               <Plus className="w-4 h-4" />
               Adicionar
             </Button>
             )}
           </div>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* AI Suggestions */}
         {showSuggestions && (
           <div className="p-4 border rounded-lg bg-primary/5 border-primary/20 space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm font-medium">
                 <Sparkles className="w-4 h-4 text-primary" />
                 Sugestões da IA
               </div>
               <div className="flex gap-2">
                 {suggestions.length > 0 && (
                   <Button
                     type="button"
                     size="sm"
                     variant="default"
                     onClick={handleAcceptAllSuggestions}
                     className="gap-2"
                   >
                     <Check className="w-4 h-4" />
                     Aceitar Todas
                   </Button>
                 )}
                 <Button
                   type="button"
                   size="sm"
                   variant="ghost"
                   onClick={() => {
                     setShowSuggestions(false);
                     setSuggestions([]);
                   }}
                 >
                   Fechar
                 </Button>
               </div>
             </div>
 
             {isLoadingSuggestions ? (
               <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span>Analisando compatibilidades...</span>
               </div>
             ) : suggestions.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                 {suggestions.map((suggestion, idx) => (
                   <Badge
                     key={`${suggestion.marca}-${suggestion.modelo}-${idx}`}
                     variant="outline"
                     className="text-sm py-2 px-3 gap-2 cursor-pointer hover:bg-primary/10 border-primary/30 transition-colors"
                     onClick={() => handleAcceptSuggestion(suggestion)}
                   >
                     <Plus className="w-3 h-3" />
                     <span>
                       {suggestion.marca} {suggestion.modelo}
                       {(suggestion.ano_inicio || suggestion.ano_fim) && (
                         <span className="ml-1 opacity-70">
                           ({suggestion.ano_inicio || "?"} - {suggestion.ano_fim || "?"})
                         </span>
                       )}
                     </span>
                   </Badge>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-muted-foreground text-center py-4">
                 Nenhuma sugestão encontrada.
               </p>
             )}
           </div>
         )}
 
         {/* Add Form */}
         {isAdding && (
           <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="marca">Marca *</Label>
                 <Input
                   id="marca"
                   placeholder="Ex: Volkswagen"
                   value={marca}
                   onChange={(e) => setMarca(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="modelo">Modelo *</Label>
                 <Input
                   id="modelo"
                   placeholder="Ex: Gol"
                   value={modelo}
                   onChange={(e) => setModelo(e.target.value)}
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="ano_inicio">Ano Inicial</Label>
                 <Input
                   id="ano_inicio"
                   type="number"
                   min="1900"
                   max="2030"
                   placeholder="Ex: 2010"
                   value={anoInicio}
                   onChange={(e) => setAnoInicio(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="ano_fim">Ano Final</Label>
                 <Input
                   id="ano_fim"
                   type="number"
                   min="1900"
                   max="2030"
                   placeholder="Ex: 2020"
                   value={anoFim}
                   onChange={(e) => setAnoFim(e.target.value)}
                 />
               </div>
             </div>
             <div className="flex justify-end gap-2">
               <Button
                 type="button"
                 variant="ghost"
                 size="sm"
                 onClick={() => {
                   setIsAdding(false);
                   setMarca("");
                   setModelo("");
                   setAnoInicio("");
                   setAnoFim("");
                 }}
               >
                 Cancelar
               </Button>
               <Button
                 type="button"
                 size="sm"
                 onClick={handleAdd}
                 disabled={!marca.trim() || !modelo.trim()}
               >
                 Confirmar
               </Button>
             </div>
           </div>
         )}
 
         {/* Compatibility List */}
         {compatibilities.length > 0 ? (
           <div className="flex flex-wrap gap-2">
             {compatibilities.map((compat) => (
               <Badge
                 key={compat.id}
                 variant="secondary"
                 className="text-sm py-1.5 px-3 gap-2"
               >
                 <span>
                   {compat.marca} {compat.modelo}
                   {formatYearRange(compat.ano_inicio, compat.ano_fim) && (
                     <span className="ml-1 opacity-70">
                       ({formatYearRange(compat.ano_inicio, compat.ano_fim)})
                     </span>
                   )}
                 </span>
                 <button
                   type="button"
                   onClick={() => onRemove(compat.id)}
                   className="ml-1 hover:text-destructive transition-colors"
                 >
                   <X className="w-3 h-3" />
                 </button>
               </Badge>
             ))}
           </div>
         ) : (
           !isAdding && (
             <p className="text-sm text-muted-foreground text-center py-4">
               Nenhuma compatibilidade adicionada. Clique em "Adicionar" para começar.
             </p>
           )
         )}
       </CardContent>
     </Card>
   );
 }