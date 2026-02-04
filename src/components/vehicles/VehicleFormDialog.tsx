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
import { Loader2 } from "lucide-react";
import { Vehicle, VehicleFormData, VehicleStatus, useCreateVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { z } from "zod";

const vehicleSchema = z.object({
  placa: z.string().min(7, "Placa inválida").max(8),
  chassi: z.string().optional(),
  marca: z.string().min(1, "Marca é obrigatória"),
  modelo: z.string().min(1, "Modelo é obrigatório"),
  ano: z.number().min(1900, "Ano inválido").max(new Date().getFullYear() + 1),
  motorizacao: z.string().optional(),
  combustivel: z.string().optional(),
  cor: z.string().optional(),
  data_entrada: z.string().optional(),
  status: z.enum(['ativo', 'desmontando', 'desmontado', 'finalizado']).optional(),
  observacoes: z.string().optional(),
});

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
}

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const [formData, setFormData] = useState<VehicleFormData>({
    placa: "",
    chassi: "",
    marca: "",
    modelo: "",
    ano: new Date().getFullYear(),
    motorizacao: "",
    combustivel: "",
    cor: "",
    data_entrada: new Date().toISOString().split('T')[0],
    status: "ativo",
    observacoes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        placa: vehicle.placa,
        chassi: vehicle.chassi || "",
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        ano: vehicle.ano,
        motorizacao: vehicle.motorizacao || "",
        combustivel: vehicle.combustivel || "",
        cor: vehicle.cor || "",
        data_entrada: vehicle.data_entrada,
        status: vehicle.status,
        observacoes: vehicle.observacoes || "",
      });
    } else {
      setFormData({
        placa: "",
        chassi: "",
        marca: "",
        modelo: "",
        ano: new Date().getFullYear(),
        motorizacao: "",
        combustivel: "",
        cor: "",
        data_entrada: new Date().toISOString().split('T')[0],
        status: "ativo",
        observacoes: "",
      });
    }
    setErrors({});
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = vehicleSchema.safeParse({
      ...formData,
      ano: Number(formData.ano),
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (vehicle) {
        await updateVehicle.mutateAsync({
          id: vehicle.id,
          ...formData,
          ano: Number(formData.ano),
        });
      } else {
        await createVehicle.mutateAsync({
          ...formData,
          ano: Number(formData.ano),
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createVehicle.isPending || updateVehicle.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar Veículo" : "Cadastrar Veículo"}</DialogTitle>
          <DialogDescription>
            {vehicle 
              ? "Atualize os dados do veículo." 
              : "Preencha os dados do veículo para adicionar ao estoque."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa *</Label>
              <Input
                id="placa"
                placeholder="ABC-1234"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                className={errors.placa ? "border-destructive" : ""}
              />
              {errors.placa && <p className="text-xs text-destructive">{errors.placa}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="chassi">Chassi</Label>
              <Input
                id="chassi"
                placeholder="9BWZZZ377VT004251"
                value={formData.chassi}
                onChange={(e) => setFormData({ ...formData, chassi: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                placeholder="Honda"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className={errors.marca ? "border-destructive" : ""}
              />
              {errors.marca && <p className="text-xs text-destructive">{errors.marca}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                placeholder="Civic"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className={errors.modelo ? "border-destructive" : ""}
              />
              {errors.modelo && <p className="text-xs text-destructive">{errors.modelo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                placeholder="2019"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || 0 })}
                className={errors.ano ? "border-destructive" : ""}
              />
              {errors.ano && <p className="text-xs text-destructive">{errors.ano}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="motorizacao">Motorização</Label>
              <Input
                id="motorizacao"
                placeholder="2.0"
                value={formData.motorizacao}
                onChange={(e) => setFormData({ ...formData, motorizacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="combustivel">Combustível</Label>
              <Select
                value={formData.combustivel}
                onValueChange={(value) => setFormData({ ...formData, combustivel: value })}
              >
                <SelectTrigger id="combustivel">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="etanol">Etanol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="eletrico">Elétrico</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                placeholder="Preto"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEntrada">Data de Entrada</Label>
              <Input
                id="dataEntrada"
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as VehicleStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="desmontando">Desmontando</SelectItem>
                  <SelectItem value="desmontado">Desmontado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre o veículo..."
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {vehicle ? "Atualizando..." : "Salvando..."}
                </>
              ) : (
                vehicle ? "Atualizar Veículo" : "Salvar Veículo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
