import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useEnabledListingTypes, ListingTypeRule, calculateListingTypePrice } from "@/hooks/useListingTypeRules";

interface ListingTypeOption {
  rule: ListingTypeRule;
  calculatedPrice: number;
}

interface ListingTypeSelectorProps {
  basePrice: number;
  selectedTypes: string[];
  onSelectionChange: (selectedTypes: string[]) => void;
  marketplace?: string;
}

export function ListingTypeSelector({
  basePrice,
  selectedTypes,
  onSelectionChange,
  marketplace = 'mercadolivre',
}: ListingTypeSelectorProps) {
  const { data: rules, isLoading } = useEnabledListingTypes(marketplace);

  // Initialize with default type selected
  useEffect(() => {
    if (rules && selectedTypes.length === 0) {
      const defaultType = rules.find((r) => r.is_default);
      if (defaultType) {
        onSelectionChange([defaultType.listing_type]);
      }
    }
  }, [rules, selectedTypes.length, onSelectionChange]);

  const handleToggle = (listingType: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTypes, listingType]);
    } else {
      // Don't allow deselecting all - at least one must be selected
      if (selectedTypes.length > 1) {
        onSelectionChange(selectedTypes.filter((t) => t !== listingType));
      }
    }
  };

  const options: ListingTypeOption[] = (rules || []).map((rule) => ({
    rule,
    calculatedPrice: calculateListingTypePrice(basePrice, rule.price_variation_percent),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Tipos de Anúncio</Label>
      <div className="space-y-2">
        {options.map(({ rule, calculatedPrice }) => (
          <div
            key={rule.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={rule.listing_type}
                checked={selectedTypes.includes(rule.listing_type)}
                onCheckedChange={(checked) => handleToggle(rule.listing_type, !!checked)}
              />
              <div>
                <Label
                  htmlFor={rule.listing_type}
                  className="font-medium cursor-pointer"
                >
                  {rule.listing_type_name}
                </Label>
                {rule.is_default && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Padrão
                  </Badge>
                )}
                {rule.price_variation_percent !== 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({rule.price_variation_percent > 0 ? '+' : ''}{rule.price_variation_percent}%)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="font-medium">
                R$ {calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Selecione os tipos de anúncio que deseja criar. Cada tipo terá seu próprio preço.
      </p>
    </div>
  );
}
