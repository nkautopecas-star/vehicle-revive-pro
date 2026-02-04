import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Package } from "lucide-react";
import { SyncJob } from "@/hooks/useSyncProgress";

interface SyncProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncJob: SyncJob | null;
  progressPercent: number;
}

export function SyncProgressDialog({
  open,
  onOpenChange,
  syncJob,
  progressPercent,
}: SyncProgressDialogProps) {
  const getStatusIcon = () => {
    switch (syncJob?.status) {
      case 'pending':
      case 'running':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Package className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (syncJob?.status) {
      case 'pending':
        return 'Preparando sincronização...';
      case 'running':
        return 'Sincronizando anúncios...';
      case 'completed':
        return 'Sincronização concluída!';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Aguardando...';
    }
  };

  const canClose = syncJob?.status === 'completed' || syncJob?.status === 'error';

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => !canClose && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress bar */}
          {syncJob && (syncJob.status === 'running' || syncJob.status === 'pending') && (
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {syncJob.processed_items} de {syncJob.total_items || '?'} anúncios processados
              </p>
            </div>
          )}

          {/* Stats */}
          {syncJob && syncJob.status !== 'pending' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {syncJob.imported_items}
                </p>
                <p className="text-xs text-muted-foreground">Novos importados</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {syncJob.updated_items}
                </p>
                <p className="text-xs text-muted-foreground">Atualizados</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {syncJob?.status === 'error' && syncJob.error_message && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
              {syncJob.error_message}
            </div>
          )}

          {/* Completion message */}
          {syncJob?.status === 'completed' && (
            <p className="text-center text-sm text-muted-foreground">
              Todos os anúncios foram sincronizados com sucesso. 
              Clique fora para fechar.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
