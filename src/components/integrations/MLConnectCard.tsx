import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";

interface MLConnectCardProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export function MLConnectCard({ onConnect, isConnecting }: MLConnectCardProps) {
  return (
    <Card className="relative overflow-hidden border-dashed">
      <CardContent className="py-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFE600] text-xl font-bold text-black">
              ML
            </div>
            <div>
              <h3 className="font-semibold">Mercado Livre</h3>
              <p className="text-xs text-muted-foreground">
                Conecte sua conta para sincronizar peças
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={onConnect}
            disabled={isConnecting}
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isConnecting ? 'Conectando...' : 'Conectar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
