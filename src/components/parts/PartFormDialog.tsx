import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useVehiclesForSelect, type Part, type PartFormData } from "@/hooks/useParts";
import { Loader2 } from "lucide-react";
import { PartImageUpload } from "./PartImageUpload";

interface PartFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: Part | null;
  onSubmit: (data: PartFormData) => void;
  isLoading?: boolean;
}

export function PartFormDialog({ 
  open, 
  onOpenChange, 
  part, 
  onSubmit, 
  isLoading 
}: PartFormDialogProps) {
  const { data: categories = [] } = useCategories();
  const { data: vehicles = [] } = useVehiclesForSelect();

  const [formData, setFormData] = useState<PartFormData>({
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
  });

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
      });
    }
  }, [part, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part ? "Editar Peça" : "Cadastrar Peça"}</DialogTitle>
          <DialogDescription>
            {part 
              ? "Atualize os dados da peça."
              : "Preencha os dados da peça para adicionar ao estoque."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
                onValueChange={(v) => setFormData({ ...formData, categoria_id: v === "none" ? "" : v })}
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
                onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigoOEM">Código OEM</Label>
              <Input 
                id="codigoOEM" 
                placeholder="11000-PNB-A00"
                value={formData.codigo_oem}
                onChange={(e) => setFormData({ ...formData, codigo_oem: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condicao">Condição *</Label>
              <Select 
                value={formData.condicao} 
                onValueChange={(v: "nova" | "usada" | "recondicionada") => setFormData({ ...formData, condicao: v })}
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
                onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input 
                id="localizacao" 
                placeholder="A1-E2-P3"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, preco_custo: parseFloat(e.target.value) || undefined })}
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
                onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="veiculoOrigem">Veículo de Origem</Label>
            <Select 
              value={formData.vehicle_id || "none"} 
              onValueChange={(v) => setFormData({ ...formData, vehicle_id: v === "none" ? "" : v })}
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
          {part && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v: "ativa" | "vendida" | "pausada") => setFormData({ ...formData, status: v })}
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
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
          
          {/* Image Upload Section */}
          <PartImageUpload partId={part?.id} disabled={isLoading} />
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.nome}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {part ? "Salvar Alterações" : "Cadastrar Peça"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
