import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, Filter, X, Search } from "lucide-react";
import { useAllPartCompatibilities } from "@/hooks/usePartsWithCompatibilities";

export interface CompatibilityFilter {
  marca: string;
  modelo: string;
  ano: number | null;
}

interface CompatibilityFilterDialogProps {
  filter: CompatibilityFilter;
  onFilterChange: (filter: CompatibilityFilter) => void;
  children?: React.ReactNode;
}

export function CompatibilityFilterDialog({
  filter,
  onFilterChange,
  children,
}: CompatibilityFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [localFilter, setLocalFilter] = useState<CompatibilityFilter>(filter);
  const { data: compatibilityMap = new Map() } = useAllPartCompatibilities();

  // Extract unique brands and models from existing compatibilities
  const { brands, modelsByBrand, years } = useMemo(() => {
    const brandsSet = new Set<string>();
    const modelsMap = new Map<string, Set<string>>();
    const yearsSet = new Set<number>();

    compatibilityMap.forEach((compatibilities) => {
      compatibilities.forEach((compat) => {
        brandsSet.add(compat.marca);
        
        if (!modelsMap.has(compat.marca)) {
          modelsMap.set(compat.marca, new Set());
        }
        modelsMap.get(compat.marca)!.add(compat.modelo);

        if (compat.ano_inicio) yearsSet.add(compat.ano_inicio);
        if (compat.ano_fim) yearsSet.add(compat.ano_fim);
      });
    });

    const brands = Array.from(brandsSet).sort();
    const modelsByBrand = new Map<string, string[]>();
    modelsMap.forEach((models, brand) => {
      modelsByBrand.set(brand, Array.from(models).sort());
    });

    // Generate a range of years from min to max
    const yearsArray = Array.from(yearsSet).sort((a, b) => b - a);
    const minYear = Math.min(...yearsArray, new Date().getFullYear() - 30);
    const maxYear = Math.max(...yearsArray, new Date().getFullYear());
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }

    return { brands, modelsByBrand, years };
  }, [compatibilityMap]);

  // Get available models based on selected brand
  const availableModels = useMemo(() => {
    if (!localFilter.marca) return [];
    return modelsByBrand.get(localFilter.marca) || [];
  }, [localFilter.marca, modelsByBrand]);

  const handleBrandChange = (marca: string) => {
    setLocalFilter({
      marca: marca === "all" ? "" : marca,
      modelo: "", // Reset model when brand changes
      ano: localFilter.ano,
    });
  };

  const handleModelChange = (modelo: string) => {
    setLocalFilter({
      ...localFilter,
      modelo: modelo === "all" ? "" : modelo,
    });
  };

  const handleYearChange = (year: string) => {
    setLocalFilter({
      ...localFilter,
      ano: year === "all" ? null : parseInt(year),
    });
  };

  const handleApply = () => {
    onFilterChange(localFilter);
    setOpen(false);
  };

  const handleClear = () => {
    const emptyFilter: CompatibilityFilter = { marca: "", modelo: "", ano: null };
    setLocalFilter(emptyFilter);
    onFilterChange(emptyFilter);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setLocalFilter(filter);
    }
  };

  const hasActiveFilter = filter.marca || filter.modelo || filter.ano;
  const activeFilterCount = [filter.marca, filter.modelo, filter.ano].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2 relative">
            <Car className="w-4 h-4" />
            <span>Compatibilidade</span>
            {hasActiveFilter && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Busca por Compatibilidade
          </DialogTitle>
          <DialogDescription>
            Filtre peças por veículo compatível. Selecione marca, modelo e/ou ano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Brand Select */}
          <div className="space-y-2">
            <Label>Marca</Label>
            <Select 
              value={localFilter.marca || "all"} 
              onValueChange={handleBrandChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Select */}
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select
              value={localFilter.modelo || "all"}
              onValueChange={handleModelChange}
              disabled={!localFilter.marca}
            >
              <SelectTrigger>
                <SelectValue placeholder={localFilter.marca ? "Selecione o modelo" : "Selecione a marca primeiro"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Select */}
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select
              value={localFilter.ano?.toString() || "all"}
              onValueChange={handleYearChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Preview */}
          {hasActiveFilter && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Filtros ativos:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {filter.marca && (
                  <Badge variant="secondary" className="gap-1">
                    {filter.marca}
                  </Badge>
                )}
                {filter.modelo && (
                  <Badge variant="secondary" className="gap-1">
                    {filter.modelo}
                  </Badge>
                )}
                {filter.ano && (
                  <Badge variant="secondary" className="gap-1">
                    {filter.ano}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {hasActiveFilter && (
            <Button variant="ghost" onClick={handleClear} className="gap-2">
              <X className="w-4 h-4" />
              Limpar
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} className="gap-2">
            <Search className="w-4 h-4" />
            Aplicar Filtro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
