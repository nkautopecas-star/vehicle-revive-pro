 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Plus, X, Car, Trash2 } from "lucide-react";
 
 export interface CompatibilityEntry {
   id: string;
   marca: string;
   modelo: string;
   ano_inicio: number | null;
   ano_fim: number | null;
 }
 
 interface CompatibilityInlineFormProps {
   compatibilities: CompatibilityEntry[];
   onAdd: (compat: Omit<CompatibilityEntry, "id">) => void;
   onRemove: (id: string) => void;
 }
 
 export function CompatibilityInlineForm({
   compatibilities,
   onAdd,
   onRemove,
 }: CompatibilityInlineFormProps) {
   const [isAdding, setIsAdding] = useState(false);
   const [marca, setMarca] = useState("");
   const [modelo, setModelo] = useState("");
   const [anoInicio, setAnoInicio] = useState<string>("");
   const [anoFim, setAnoFim] = useState<string>("");
 
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
           {!isAdding && (
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
       </CardHeader>
       <CardContent className="space-y-4">
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