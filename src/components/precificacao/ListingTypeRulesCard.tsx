import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Percent, Save, Tag } from "lucide-react";
import {
  useListingTypeRules,
  useUpdateListingTypeRule,
  ListingTypeRule,
} from "@/hooks/useListingTypeRules";

export function ListingTypeRulesCard() {
  const { data: rules, isLoading } = useListingTypeRules('mercadolivre');
  const updateRule = useUpdateListingTypeRule();
  const [editedRules, setEditedRules] = useState<Record<string, Partial<ListingTypeRule>>>({});

  const handlePercentChange = (ruleId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedRules((prev) => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], price_variation_percent: numValue },
    }));
  };

  const handleEnabledChange = (ruleId: string, enabled: boolean) => {
    setEditedRules((prev) => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], is_enabled: enabled },
    }));
  };

  const handleSave = (rule: ListingTypeRule) => {
    const edits = editedRules[rule.id];
    if (!edits) return;

    updateRule.mutate({
      id: rule.id,
      updates: {
        price_variation_percent: edits.price_variation_percent ?? rule.price_variation_percent,
        is_enabled: edits.is_enabled ?? rule.is_enabled,
      },
    });

    // Clear edits for this rule
    setEditedRules((prev) => {
      const { [rule.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const hasChanges = (ruleId: string) => {
    return editedRules[ruleId] !== undefined;
  };

  const getValue = (rule: ListingTypeRule, field: keyof ListingTypeRule) => {
    const edit = editedRules[rule.id];
    if (edit && field in edit) {
      return edit[field as keyof typeof edit];
    }
    return rule[field];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tipos de Anúncio
        </CardTitle>
        <CardDescription>
          Configure a variação de preço para cada tipo de anúncio do Mercado Livre. 
          O tipo Clássico é o padrão, e os demais terão o preço ajustado conforme a porcentagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules?.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.listing_type_name}</span>
                {rule.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Padrão
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Tipo: {rule.listing_type}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ativo</span>
              <Switch
                checked={getValue(rule, 'is_enabled') as boolean}
                onCheckedChange={(checked) => handleEnabledChange(rule.id, checked)}
                disabled={rule.is_default}
              />
            </div>

            <div className="flex items-center gap-2 w-32">
              <Input
                type="number"
                step="0.01"
                value={getValue(rule, 'price_variation_percent') as number}
                onChange={(e) => handlePercentChange(rule.id, e.target.value)}
                className="text-right"
                disabled={rule.is_default}
              />
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSave(rule)}
              disabled={!hasChanges(rule.id) || updateRule.isPending}
            >
              {updateRule.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}

        {(!rules || rules.length === 0) && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma regra de tipo de anúncio configurada.
          </p>
        )}

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Como funciona:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• O tipo <strong>Clássico</strong> é o padrão e usa o preço base da peça</li>
            <li>• O tipo <strong>Premium</strong> adiciona a porcentagem configurada ao preço</li>
            <li>• Exemplo: Peça de R$ 100 com Premium +10% = R$ 110</li>
            <li>• Na criação do anúncio você poderá escolher quais tipos criar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
