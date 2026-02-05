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
import { ChevronRight } from "lucide-react";
import type { ExtendedPartFormData } from "../PartFormWizard";
import type { Part } from "@/hooks/useParts";
import { PartImageUpload } from "../PartImageUpload";
import { PartCompatibilities } from "../PartCompatibilities";
import { WizardImageUpload, type PendingImage } from "../WizardImageUpload";
 
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
}: PartBasicInfoStepProps) {
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
 
   return (
     <>
       <DialogHeader>
         <DialogTitle>{dialogTitle}</DialogTitle>
         <DialogDescription>{dialogDescription}</DialogDescription>
       </DialogHeader>
 
       <div className="grid gap-4 py-4">
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
 
         <div className="grid grid-cols-2 gap-4">
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
           <div className="space-y-2">
             <Label htmlFor="codigoOEM">Código OEM</Label>
             <Input
               id="codigoOEM"
               placeholder="11000-PNB-A00"
               value={formData.codigo_oem}
               onChange={(e) =>
                 setFormData({ ...formData, codigo_oem: e.target.value })
               }
             />
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