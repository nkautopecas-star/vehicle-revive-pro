import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  usePartCompatibilities,
  useCreateCompatibility,
  useUpdateCompatibility,
  useDeleteCompatibility,
  type PartCompatibility,
  type CompatibilityFormData,
} from "@/hooks/usePartCompatibilities";
import { Plus, X, Edit2, Car, Calendar, Loader2, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PartCompatibilitiesProps {
  partId: string | undefined;
  partName?: string;
  vehicleInfo?: string | null;
  disabled?: boolean;
}

interface CompatibilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
  compatibility?: PartCompatibility | null;
  onSubmit: (data: CompatibilityFormData) => void;
  isLoading?: boolean;
}

interface AISuggestion {
  marca: string;
  modelo: string;
  ano_inicio?: number;
  ano_fim?: number;
  observacoes?: string;
}

function CompatibilityForm({
  open,
  onOpenChange,
  compatibility,
  onSubmit,
  isLoading,
}: CompatibilityFormProps) {
  const [formData, setFormData] = useState<CompatibilityFormData>({
    marca: compatibility?.marca || "",
    modelo: compatibility?.modelo || "",
    ano_inicio: compatibility?.ano_inicio || undefined,
    ano_fim: compatibility?.ano_fim || undefined,
    observacoes: compatibility?.observacoes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Reset form when dialog opens with new data
  useState(() => {
    if (open) {
      setFormData({
        marca: compatibility?.marca || "",
        modelo: compatibility?.modelo || "",
        ano_inicio: compatibility?.ano_inicio || undefined,
        ano_fim: compatibility?.ano_fim || undefined,
        observacoes: compatibility?.observacoes || "",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {compatibility ? "Editar Compatibilidade" : "Adicionar Compatibilidade"}
          </DialogTitle>
          <DialogDescription>
            Informe o veículo compatível com esta peça.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="compat-marca">Marca *</Label>
              <Input
                id="compat-marca"
                placeholder="Honda"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compat-modelo">Modelo *</Label>
              <Input
                id="compat-modelo"
                placeholder="Civic"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="compat-ano-inicio">Ano Início</Label>
              <Input
                id="compat-ano-inicio"
                type="number"
                placeholder="2010"
                min={1900}
                max={2100}
                value={formData.ano_inicio || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ano_inicio: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compat-ano-fim">Ano Fim</Label>
              <Input
                id="compat-ano-fim"
                type="number"
                placeholder="2015"
                min={1900}
                max={2100}
                value={formData.ano_fim || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ano_fim: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="compat-obs">Observações</Label>
            <Input
              id="compat-obs"
              placeholder="Motor 1.8, versão LX..."
              value={formData.observacoes || ""}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.marca || !formData.modelo}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {compatibility ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: AISuggestion[];
  onAddSelected: (selected: AISuggestion[]) => void;
  isAdding?: boolean;
}

function AISuggestionsDialog({
  open,
  onOpenChange,
  suggestions,
  onAddSelected,
  isAdding,
}: AISuggestionsDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    const selectedSuggestions = suggestions.filter((_, i) => selected.has(i));
    onAddSelected(selectedSuggestions);
  };

  const formatYearRange = (inicio?: number, fim?: number) => {
    if (inicio && fim) return `${inicio} - ${fim}`;
    if (inicio) return `${inicio}+`;
    if (fim) return `até ${fim}`;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Sugestões da IA
          </DialogTitle>
          <DialogDescription>
            Selecione as compatibilidades que deseja adicionar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                selected.has(index)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/50"
              }`}
              onClick={() => toggleSelection(index)}
            >
              <Checkbox
                checked={selected.has(index)}
                onCheckedChange={() => toggleSelection(index)}
              />
              <div className="flex-1">
                <span className="font-medium">
                  {suggestion.marca} {suggestion.modelo}
                </span>
                {formatYearRange(suggestion.ano_inicio, suggestion.ano_fim) && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatYearRange(suggestion.ano_inicio, suggestion.ano_fim)}
                  </Badge>
                )}
                {suggestion.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {suggestion.observacoes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selected.size === suggestions.length) {
                setSelected(new Set());
              } else {
                setSelected(new Set(suggestions.map((_, i) => i)));
              }
            }}
          >
            {selected.size === suggestions.length ? "Desmarcar todos" : "Selecionar todos"}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddSelected}
              disabled={selected.size === 0 || isAdding}
              className="gap-1"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Adicionar ({selected.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PartCompatibilities({ partId, partName, vehicleInfo, disabled }: PartCompatibilitiesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompat, setEditingCompat] = useState<PartCompatibility | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isAddingSuggestions, setIsAddingSuggestions] = useState(false);

  const { data: compatibilities = [], isLoading } = usePartCompatibilities(partId);
  const createMutation = useCreateCompatibility();
  const updateMutation = useUpdateCompatibility();
  const deleteMutation = useDeleteCompatibility();

  if (!partId) {
    return (
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Car className="w-4 h-4" />
          Compatibilidades
        </Label>
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Salve a peça primeiro para adicionar compatibilidades.
        </div>
      </div>
    );
  }

  const handleCreate = (data: CompatibilityFormData) => {
    createMutation.mutate(
      { partId, data },
      {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      }
    );
  };

  const handleUpdate = (data: CompatibilityFormData) => {
    if (!editingCompat) return;
    updateMutation.mutate(
      { id: editingCompat.id, partId, data },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingCompat(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id, partId });
  };

  const handleEdit = (compat: PartCompatibility) => {
    setEditingCompat(compat);
    setIsFormOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCompat(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingCompat(null);
    }
  };

  const handleAISuggest = async () => {
    if (!partName) {
      toast.error("Nome da peça é necessário para sugestões.");
      return;
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-compatibilities", {
        body: {
          partName,
          vehicleInfo,
          existingCompatibilities: compatibilities,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
        setIsSuggestionsOpen(true);
      } else {
        toast.info("A IA não encontrou sugestões adicionais para esta peça.");
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast.error("Erro ao obter sugestões da IA.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAddSuggestions = async (selected: AISuggestion[]) => {
    setIsAddingSuggestions(true);
    try {
      for (const suggestion of selected) {
        await new Promise<void>((resolve, reject) => {
          createMutation.mutate(
            {
              partId,
              data: {
                marca: suggestion.marca,
                modelo: suggestion.modelo,
                ano_inicio: suggestion.ano_inicio,
                ano_fim: suggestion.ano_fim,
                observacoes: suggestion.observacoes,
              },
            },
            {
              onSuccess: () => resolve(),
              onError: reject,
            }
          );
        });
      }
      setIsSuggestionsOpen(false);
      setAiSuggestions([]);
      toast.success(`${selected.length} compatibilidade(s) adicionada(s)!`);
    } catch (error) {
      console.error("Error adding suggestions:", error);
      toast.error("Erro ao adicionar algumas compatibilidades.");
    } finally {
      setIsAddingSuggestions(false);
    }
  };

  const formatYearRange = (inicio: number | null, fim: number | null) => {
    if (inicio && fim) return `${inicio} - ${fim}`;
    if (inicio) return `${inicio}+`;
    if (fim) return `até ${fim}`;
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Car className="w-4 h-4" />
          Compatibilidades ({compatibilities.length})
        </Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAISuggest}
            disabled={disabled || isLoadingAI || !partName}
            className="gap-1"
          >
            {isLoadingAI ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Sugerir IA
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenNew}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : compatibilities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Nenhuma compatibilidade cadastrada.
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {compatibilities.map((compat) => (
            <div
              key={compat.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="truncate">
                  <span className="font-medium">
                    {compat.marca} {compat.modelo}
                  </span>
                  {formatYearRange(compat.ano_inicio, compat.ano_fim) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatYearRange(compat.ano_inicio, compat.ano_fim)}
                    </Badge>
                  )}
                  {compat.observacoes && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({compat.observacoes})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEdit(compat)}
                  disabled={disabled}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(compat.id)}
                  disabled={disabled || deleteMutation.isPending}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CompatibilityForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        partId={partId}
        compatibility={editingCompat}
        onSubmit={editingCompat ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AISuggestionsDialog
        open={isSuggestionsOpen}
        onOpenChange={setIsSuggestionsOpen}
        suggestions={aiSuggestions}
        onAddSelected={handleAddSuggestions}
        isAdding={isAddingSuggestions}
      />
    </div>
  );
}
