import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSyncProgress } from "@/hooks/useSyncProgress";
import { SyncProgressDialog } from "@/components/anuncios/SyncProgressDialog";

interface MLAccountCardProps {
  account: {
    id: string;
    nome_conta: string;
    status: string;
    updated_at: string;
  };
  onSync: (accountId: string) => void;
  isSyncing: boolean;
}

export function MLAccountCard({ account, onSync, isSyncing }: MLAccountCardProps) {
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const { syncJob, progressPercent, startPolling } = useSyncProgress(account.id);
  
  const isActive = account.status === 'active';
  const lastSync = formatDistanceToNow(new Date(account.updated_at), { 
    addSuffix: true, 
    locale: ptBR 
  });

  const handleSync = () => {
    onSync(account.id);
    setShowProgressDialog(true);
    startPolling();
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardContent className="py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFE600] text-xl font-bold text-black">
                ML
              </div>
              <div>
                <h3 className="font-semibold">{account.nome_conta}</h3>
                <p className="text-xs text-muted-foreground">Mercado Livre</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isActive ? (
                <Badge className="bg-success/20 text-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-destructive/20">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Erro
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Atualizado {lastSync}
              </span>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SyncProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        syncJob={syncJob}
        progressPercent={progressPercent}
      />
    </>
  );
}