import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStockMovement } from "@/hooks/useStockMovements";
import { Package, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type MovementType = Database["public"]["Enums"]["movement_type"];

interface StockMovementDialogProps {
  partId: string;
  partName: string;
  currentQuantity: number;
  children: React.ReactNode;
}

const movementTypes: { value: MovementType; label: string; icon: React.ElementType }[] = [
  { value: "entrada", label: "Entrada", icon: TrendingUp },
  { value: "saida", label: "Saída", icon: TrendingDown },
  { value: "ajuste", label: "Ajuste", icon: RefreshCw },
];

export function StockMovementDialog({
  partId,
  partName,
  currentQuantity,
  children,
}: StockMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<MovementType>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  
  const queryClient = useQueryClient();
  const createMovement = useCreateStockMovement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantidade);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (tipo === "saida" && qty > currentQuantity) {
      toast.error(`Quantidade insuficiente em estoque (disponível: ${currentQuantity})`);
      return;
    }

    try {
      await createMovement.mutateAsync({
        part_id: partId,
        tipo,
        quantidade: qty,
        motivo: motivo.trim() || null,
      });

      toast.success("Movimentação registrada com sucesso");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['stock-movements', partId] });
      queryClient.invalidateQueries({ queryKey: ['part-details', partId] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      
      // Reset form and close dialog
      setTipo("entrada");
      setQuantidade("");
      setMotivo("");
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao registrar movimentação");
    }
  };

  const getNewQuantity = () => {
    const qty = parseInt(quantidade) || 0;
    if (tipo === "entrada") return currentQuantity + qty;
    if (tipo === "saida") return currentQuantity - qty;
    return qty; // ajuste substitui
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Registrar Movimentação
          </DialogTitle>
          <DialogDescription>
            Registrar entrada, saída ou ajuste de estoque para "{partName}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimentação</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as MovementType)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Digite a quantidade"
              required
            />
            <p className="text-xs text-muted-foreground">
              Estoque atual: {currentQuantity} → Novo estoque:{" "}
              <span className={getNewQuantity() < 0 ? "text-destructive" : "text-success"}>
                {getNewQuantity()}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Compra de fornecedor, Venda avulsa, Correção de inventário..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMovement.isPending}>
              {createMovement.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
