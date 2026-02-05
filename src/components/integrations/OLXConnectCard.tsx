import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface OLXConnectCardProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export function OLXConnectCard({ onConnect, isConnecting }: OLXConnectCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[120px]">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Conectar conta OLX</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Publique anúncios automaticamente na OLX
            </p>
            <Button
              onClick={onConnect}
              disabled={isConnecting}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar OLX"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
