 import { useState, useEffect } from "react";
 import {
   Dialog,
   DialogContent,
 } from "@/components/ui/dialog";
 import { useCategories, useVehiclesForSelect, type Part, type PartFormData } from "@/hooks/useParts";
 import { PartBasicInfoStep } from "./wizard/PartBasicInfoStep";
 import { PartMarketplaceStep } from "./wizard/PartMarketplaceStep";
 import { PartImageUpload } from "./PartImageUpload";
 import { PartCompatibilities } from "./PartCompatibilities";
 import { Progress } from "@/components/ui/progress";
 
 export interface MarketplaceConfig {
   mercadolivre: boolean;
   olx: boolean;
   shopee: boolean;
 }
 
 export interface PartDimensions {
   peso_gramas?: number;
   comprimento_cm?: number;
   largura_cm?: number;
   altura_cm?: number;
 }
 
 export interface ExtendedPartFormData extends PartFormData {
   peso_gramas?: number;
   comprimento_cm?: number;
   largura_cm?: number;
   altura_cm?: number;
 }
 
 interface PartFormWizardProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   part?: Part | null;
   onSubmit: (data: ExtendedPartFormData, marketplaces: MarketplaceConfig) => void;
   isLoading?: boolean;
   isDuplicating?: boolean;
 }
 
 type WizardStep = "basic" | "marketplace";
 
 export function PartFormWizard({
   open,
   onOpenChange,
   part,
   onSubmit,
   isLoading,
   isDuplicating = false,
 }: PartFormWizardProps) {
   const { data: categories = [] } = useCategories();
   const { data: vehicles = [] } = useVehiclesForSelect();
 
   const [step, setStep] = useState<WizardStep>("basic");
   const [formData, setFormData] = useState<ExtendedPartFormData>({
     nome: "",
     codigo_interno: "",
     codigo_oem: "",
     categoria_id: "",
     condicao: "usada",
     vehicle_id: "",
     quantidade: 1,
     quantidade_minima: 0,
     localizacao: "",
     preco_custo: undefined,
     preco_venda: undefined,
     observacoes: "",
     status: "ativa",
     peso_gramas: undefined,
     comprimento_cm: undefined,
     largura_cm: undefined,
     altura_cm: undefined,
   });
 
   const [marketplaces, setMarketplaces] = useState<MarketplaceConfig>({
     mercadolivre: false,
     olx: false,
     shopee: false,
   });
 
   const isEditing = part && !isDuplicating;
 
   useEffect(() => {
     if (part) {
       setFormData({
         nome: part.nome,
         codigo_interno: part.codigo_interno || "",
         codigo_oem: part.codigo_oem || "",
         categoria_id: part.categoria_id || "",
         condicao: part.condicao,
         vehicle_id: part.vehicle_id || "",
         quantidade: part.quantidade,
         quantidade_minima: part.quantidade_minima,
         localizacao: part.localizacao || "",
         preco_custo: part.preco_custo || undefined,
         preco_venda: part.preco_venda || undefined,
         observacoes: part.observacoes || "",
         status: part.status,
         peso_gramas: (part as any).peso_gramas || undefined,
         comprimento_cm: (part as any).comprimento_cm || undefined,
         largura_cm: (part as any).largura_cm || undefined,
         altura_cm: (part as any).altura_cm || undefined,
       });
     } else {
       setFormData({
         nome: "",
         codigo_interno: "",
         codigo_oem: "",
         categoria_id: "",
         condicao: "usada",
         vehicle_id: "",
         quantidade: 1,
         quantidade_minima: 0,
         localizacao: "",
         preco_custo: undefined,
         preco_venda: undefined,
         observacoes: "",
         status: "ativa",
         peso_gramas: undefined,
         comprimento_cm: undefined,
         largura_cm: undefined,
         altura_cm: undefined,
       });
     }
     setMarketplaces({ mercadolivre: false, olx: false, shopee: false });
     setStep("basic");
   }, [part, open]);
 
   const handleNextStep = () => {
     if (step === "basic") {
       setStep("marketplace");
     }
   };
 
   const handlePreviousStep = () => {
     if (step === "marketplace") {
       setStep("basic");
     }
   };
 
   const handleFinalSubmit = () => {
     onSubmit(formData, marketplaces);
   };
 
   const getProgress = () => {
     switch (step) {
       case "basic":
         return 50;
       case "marketplace":
         return 100;
       default:
         return 0;
     }
   };
 
   const dialogTitle = isDuplicating
     ? "Duplicar Peça"
     : part
     ? "Editar Peça"
     : "Cadastrar Peça";
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
         <div className="space-y-4">
           {/* Progress indicator */}
           <div className="space-y-2">
             <div className="flex justify-between text-sm text-muted-foreground">
               <span className={step === "basic" ? "text-primary font-medium" : ""}>
                 1. Dados da Peça
               </span>
               <span className={step === "marketplace" ? "text-primary font-medium" : ""}>
                 2. Anunciar
               </span>
             </div>
             <Progress value={getProgress()} className="h-2" />
           </div>
 
           {step === "basic" && (
             <PartBasicInfoStep
               formData={formData}
               setFormData={setFormData}
               categories={categories}
               vehicles={vehicles}
               isEditing={!!isEditing}
               isDuplicating={isDuplicating}
               isLoading={isLoading}
               onNext={handleNextStep}
               onCancel={() => onOpenChange(false)}
               part={part}
             />
           )}
 
           {step === "marketplace" && (
             <PartMarketplaceStep
               formData={formData}
               setFormData={setFormData}
               marketplaces={marketplaces}
               setMarketplaces={setMarketplaces}
               categories={categories}
               isLoading={isLoading}
               onPrevious={handlePreviousStep}
               onSubmit={handleFinalSubmit}
               isEditing={!!isEditing}
               isDuplicating={isDuplicating}
               part={part}
               partId={part?.id}
             />
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }