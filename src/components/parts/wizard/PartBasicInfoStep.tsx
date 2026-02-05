import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ChevronRight, Sparkles, Loader2, Check, X } from "lucide-react";
import type { ExtendedPartFormData } from "../PartFormWizard";
import type { Part } from "@/hooks/useParts";
import { PartImageUpload } from "../PartImageUpload";
import { PartCompatibilities } from "../PartCompatibilities";
import { WizardImageUpload, type PendingImage } from "../WizardImageUpload";
import { useSuggestPartInfo, type PartSuggestion, type CompatibilitySuggestion } from "@/hooks/useSuggestPartInfo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
 
 interface Category {
   id: string;
   name: string;
 }
 
 interface Vehicle {
   id: string;
   label: string;
 }

interface PartBasicInfoStepProps {
  formData: ExtendedPartFormData;
  setFormData: (data: ExtendedPartFormData) => void;
  categories: Category[];
  vehicles: Vehicle[];
  isEditing: boolean;
  isDuplicating: boolean;
  isLoading?: boolean;
  onNext: () => void;
  onCancel: () => void;
  part?: Part | null;
  pendingImages: PendingImage[];
  onPendingImagesChange: (images: PendingImage[]) => void;
  onCompatibilitySuggestions?: (suggestions: CompatibilitySuggestion[]) => void;
}
 
export function PartBasicInfoStep({
  formData,
  setFormData,
  categories,
  vehicles,
  isEditing,
  isDuplicating,
  isLoading,
  onNext,
  onCancel,
  part,
  pendingImages,
  onPendingImagesChange,
  onCompatibilitySuggestions,
}: PartBasicInfoStepProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [selectedCompatibilities, setSelectedCompatibilities] = useState<Set<number>>(new Set());
  const { isLoading: isSuggesting, suggestion, suggestFromOEM, clearSuggestion } = useSuggestPartInfo();

  const dialogTitle = isDuplicating
    ? "Duplicar Peça"
    : isEditing
    ? "Editar Peça"
    : "Cadastrar Peça";
 
  const dialogDescription = isDuplicating
    ? "Crie uma nova peça baseada nos dados existentes."
    : isEditing
    ? "Atualize os dados da peça."
    : "Preencha os dados da peça para adicionar ao estoque.";

  // Get vehicle info for context
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
  const vehicleInfo = selectedVehicle?.label;

  // Get category name for context
  const selectedCategory = categories.find(c => c.id === formData.categoria_id);
  const categoryName = selectedCategory?.name;

  // Handle OEM blur to suggest part info
  const handleOEMBlur = useCallback(async () => {
    if (formData.codigo_oem && formData.codigo_oem.trim().length >= 3 && !formData.nome) {
      const result = await suggestFromOEM(formData.codigo_oem, vehicleInfo, categoryName);
      if (result) {
        setShowSuggestion(true);
      }
    }
  }, [formData.codigo_oem, formData.nome, suggestFromOEM, vehicleInfo, categoryName]);

  // Apply suggestion
  const applySuggestion = useCallback((s: PartSuggestion, selectedCompats?: CompatibilitySuggestion[]) => {
    setFormData({
      ...formData,
      nome: s.nome,
      preco_venda: s.precoSugerido,
      preco_custo: s.precoMinimo ? Math.round(s.precoMinimo * 0.6) : undefined,
    });
    
    // Pass selected compatibilities to parent
    if (selectedCompats && selectedCompats.length > 0 && onCompatibilitySuggestions) {
      onCompatibilitySuggestions(selectedCompats);
    }
    
    setShowSuggestion(false);
    setSelectedCompatibilities(new Set());
    clearSuggestion();
  }, [formData, setFormData, clearSuggestion, onCompatibilitySuggestions]);

  const dismissSuggestion = useCallback(() => {
    setShowSuggestion(false);
    setSelectedCompatibilities(new Set());
    clearSuggestion();
  }, [clearSuggestion]);

  const toggleCompatibility = useCallback((index: number) => {
    setSelectedCompatibilities(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const formatYearRange = (inicio?: number, fim?: number) => {
    if (inicio && fim) return `${inicio} - ${fim}`;
    if (inicio) return `${inicio}+`;
    if (fim) return `até ${fim}`;
    return null;
  };

  const getConfiancaColor = (confianca: string) => {
    switch (confianca) {
      case "alta": return "bg-success/20 text-success";
      case "media": return "bg-warning/20 text-warning";
      case "baixa": return "bg-destructive/20 text-destructive";
      default: return "";
    }
  };
 
   return (
     <>
       <DialogHeader>
         <DialogTitle>{dialogTitle}</DialogTitle>
         <DialogDescription>{dialogDescription}</DialogDescription>
       </DialogHeader>
 
       <div className="grid gap-4 py-4">
          {/* OEM Code - First field */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoOEM" className="flex items-center gap-2">
                Código OEM
                {isSuggesting && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="codigoOEM"
                  placeholder="11000-PNB-A00"
                  value={formData.codigo_oem}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo_oem: e.target.value })
                  }
                  onBlur={handleOEMBlur}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => suggestFromOEM(formData.codigo_oem, vehicleInfo, categoryName).then(r => r && setShowSuggestion(true))}
                  disabled={isSuggesting || !formData.codigo_oem || formData.codigo_oem.trim().length < 3}
                  title="Buscar sugestão da IA"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
           <div className="space-y-2">
             <Label htmlFor="codigoInterno">Código Interno</Label>
             <Input
               id="codigoInterno"
               placeholder="MOT-001"
               value={formData.codigo_interno}
               onChange={(e) =>
                 setFormData({ ...formData, codigo_interno: e.target.value })
               }
             />
           </div>
         </div>

          {/* AI Suggestion Card */}
          {showSuggestion && suggestion && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Sugestão da IA</span>
                  <Badge className={cn("text-xs", getConfiancaColor(suggestion.confianca))}>
                    Confiança {suggestion.confianca}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={dismissSuggestion}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome sugerido:</span>
                  <p className="font-medium">{suggestion.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Título ML:</span>
                  <p className="font-medium text-xs">{suggestion.tituloML}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Preço sugerido:</span>
                  <p className="font-medium text-primary">
                    R$ {suggestion.precoSugerido?.toFixed(2)}
                    {suggestion.precoMinimo && suggestion.precoMaximo && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (R$ {suggestion.precoMinimo} - R$ {suggestion.precoMaximo})
                      </span>
                    )}
                  </p>
                </div>
                {suggestion.descricao && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Descrição:</span>
                    <p className="text-xs">{suggestion.descricao}</p>
                  </div>
                )}
              </div>

              {/* Compatibility Suggestions */}
              {suggestion.compatibilidades && suggestion.compatibilidades.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Compatibilidades sugeridas:</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        if (selectedCompatibilities.size === suggestion.compatibilidades!.length) {
                          setSelectedCompatibilities(new Set());
                        } else {
                          setSelectedCompatibilities(new Set(suggestion.compatibilidades!.map((_, i) => i)));
                        }
                      }}
                    >
                      {selectedCompatibilities.size === suggestion.compatibilidades.length
                        ? "Desmarcar todas"
                        : "Selecionar todas"}
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {suggestion.compatibilidades.map((compat, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-colors text-sm",
                          selectedCompatibilities.has(index)
                            ? "bg-primary/20"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleCompatibility(index)}
                      >
                        <Checkbox
                          checked={selectedCompatibilities.has(index)}
                          onCheckedChange={() => toggleCompatibility(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="font-medium">
                          {compat.marca} {compat.modelo}
                        </span>
                        {formatYearRange(compat.ano_inicio, compat.ano_fim) && (
                          <Badge variant="secondary" className="text-xs">
                            {formatYearRange(compat.ano_inicio, compat.ano_fim)}
                          </Badge>
                        )}
                        {compat.observacoes && (
                          <span className="text-xs text-muted-foreground truncate">
                            ({compat.observacoes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const selectedCompats = suggestion.compatibilidades
                    ?.filter((_, i) => selectedCompatibilities.has(i)) || [];
                  applySuggestion(suggestion, selectedCompats);
                }}
                className="w-full gap-2"
              >
                <Check className="w-4 h-4" />
                Aplicar Sugestão
                {selectedCompatibilities.size > 0 && (
                  <span className="text-xs opacity-80">
                    (+{selectedCompatibilities.size} compatibilidade{selectedCompatibilities.size > 1 ? 's' : ''})
                  </span>
                )}
              </Button>
            </div>
          )}

         {/* Name and Category */}
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label htmlFor="nome">Nome da Peça *</Label>
             <Input
               id="nome"
               placeholder="Motor Completo"
               value={formData.nome}
               onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
               required
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="categoria">Categoria</Label>
             <Select
               value={formData.categoria_id || "none"}
               onValueChange={(v) =>
                 setFormData({ ...formData, categoria_id: v === "none" ? "" : v })
               }
             >
               <SelectTrigger id="categoria">
                 <SelectValue placeholder="Selecione" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="none">Sem categoria</SelectItem>
                 {categories.map((cat) => (
                   <SelectItem key={cat.id} value={cat.id}>
                     {cat.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
 
         <div className="grid grid-cols-3 gap-4">
           <div className="space-y-2">
             <Label htmlFor="condicao">Condição *</Label>
             <Select
               value={formData.condicao}
               onValueChange={(v: "nova" | "usada" | "recondicionada") =>
                 setFormData({ ...formData, condicao: v })
               }
             >
               <SelectTrigger id="condicao">
                 <SelectValue placeholder="Selecione" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="nova">Nova</SelectItem>
                 <SelectItem value="usada">Usada</SelectItem>
                 <SelectItem value="recondicionada">Recondicionada</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label htmlFor="quantidade">Quantidade *</Label>
             <Input
               id="quantidade"
               type="number"
               min="0"
               placeholder="1"
               value={formData.quantidade}
               onChange={(e) =>
                 setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })
               }
               required
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="localizacao">Localização</Label>
             <Input
               id="localizacao"
               placeholder="A1-E2-P3"
               value={formData.localizacao}
               onChange={(e) =>
                 setFormData({ ...formData, localizacao: e.target.value })
               }
             />
           </div>
         </div>
 
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label htmlFor="precoCusto">Preço de Custo (R$)</Label>
             <Input
               id="precoCusto"
               type="number"
               step="0.01"
               min="0"
               placeholder="0.00"
               value={formData.preco_custo || ""}
               onChange={(e) =>
                 setFormData({
                   ...formData,
                   preco_custo: parseFloat(e.target.value) || undefined,
                 })
               }
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="precoVenda">Preço de Venda (R$)</Label>
             <Input
               id="precoVenda"
               type="number"
               step="0.01"
               min="0"
               placeholder="0.00"
               value={formData.preco_venda || ""}
               onChange={(e) =>
                 setFormData({
                   ...formData,
                   preco_venda: parseFloat(e.target.value) || undefined,
                 })
               }
             />
           </div>
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="veiculoOrigem">Veículo de Origem</Label>
           <Select
             value={formData.vehicle_id || "none"}
             onValueChange={(v) =>
               setFormData({ ...formData, vehicle_id: v === "none" ? "" : v })
             }
           >
             <SelectTrigger id="veiculoOrigem">
               <SelectValue placeholder="Selecione o veículo" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="none">Nenhum</SelectItem>
               {vehicles.map((v) => (
                 <SelectItem key={v.id} value={v.id}>
                   {v.label}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {isEditing && (
           <div className="space-y-2">
             <Label htmlFor="status">Status</Label>
             <Select
               value={formData.status}
               onValueChange={(v: "ativa" | "vendida" | "pausada") =>
                 setFormData({ ...formData, status: v })
               }
             >
               <SelectTrigger id="status">
                 <SelectValue placeholder="Selecione" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="ativa">Ativa</SelectItem>
                 <SelectItem value="vendida">Vendida</SelectItem>
                 <SelectItem value="pausada">Pausada</SelectItem>
               </SelectContent>
             </Select>
           </div>
         )}
 
         <div className="space-y-2">
           <Label htmlFor="observacoes">Observações</Label>
           <Textarea
             id="observacoes"
             placeholder="Observações sobre a peça..."
             rows={2}
             value={formData.observacoes}
             onChange={(e) =>
               setFormData({ ...formData, observacoes: e.target.value })
             }
           />
         </div>
 
        {/* Image Upload Section */}
        {isEditing ? (
          <PartImageUpload partId={part?.id} disabled={isLoading} />
        ) : (
          <WizardImageUpload
            pendingImages={pendingImages}
            onImagesChange={onPendingImagesChange}
            disabled={isLoading}
          />
        )}

        {/* Compatibilities Section - only for existing parts */}
        {isEditing && (
          <PartCompatibilities
            partId={part?.id}
            partName={formData.nome || part?.nome}
            vehicleInfo={part?.veiculo_info}
            disabled={isLoading}
          />
        )}
 
         <div className="flex justify-end gap-3 mt-4">
           <Button
             type="button"
             variant="outline"
             onClick={onCancel}
             disabled={isLoading}
           >
             Cancelar
           </Button>
           <Button
             type="button"
             onClick={onNext}
             disabled={isLoading || !formData.nome}
             className="gap-2"
           >
             Próximo
             <ChevronRight className="w-4 h-4" />
           </Button>
         </div>
       </div>
     </>
   );
 }
