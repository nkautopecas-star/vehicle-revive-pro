import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProgressDialogProps {
  open: boolean;
  currentIndex: number;
  totalImages: number;
  currentFileName?: string;
}

export function ImageUploadProgressDialog({
  open,
  currentIndex,
  totalImages,
  currentFileName,
}: ImageUploadProgressDialogProps) {
  const progress = totalImages > 0 ? ((currentIndex) / totalImages) * 100 : 0;
  const isComplete = currentIndex >= totalImages && totalImages > 0;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-success" />
                Upload Concluído
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Enviando Imagens...
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `${totalImages} ${totalImages === 1 ? "imagem enviada" : "imagens enviadas"} com sucesso!`
              : `Enviando imagem ${currentIndex + 1} de ${totalImages}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" />
          
          {!isComplete && currentFileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span className="truncate">{currentFileName}</span>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {isComplete ? (
              "Finalizando cadastro..."
            ) : (
              `${Math.round(progress)}% concluído`
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
