import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceAccount = Database["public"]["Tables"]["marketplace_accounts"]["Row"];

interface OLXAccountCardProps {
  account: MarketplaceAccount;
}

export function OLXAccountCard({ account }: OLXAccountCardProps) {
  const isActive = account.status === "active";

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="py-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xl font-bold">
              OLX
            </div>
            <div>
              <h3 className="font-semibold">{account.nome_conta}</h3>
              <div className="flex items-center gap-1 text-xs">
                {isActive ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">Erro na conexão</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            OLX Brasil
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
