import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeletePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName?: string;
  partNames?: string[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeletePartDialog({
  open,
  onOpenChange,
  partName,
  partNames,
  onConfirm,
  isLoading,
}: DeletePartDialogProps) {
  const isBulkDelete = partNames && partNames.length > 1;
  const count = partNames?.length || 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulkDelete ? `Excluir ${count} peças` : "Excluir peça"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulkDelete ? (
              <div className="space-y-2">
                <p>Tem certeza que deseja excluir as seguintes peças?</p>
                <ul className="list-disc list-inside max-h-32 overflow-y-auto text-sm space-y-1 bg-muted/50 rounded p-2">
                  {partNames.map((name, index) => (
                    <li key={index} className="truncate">
                      {name}
                    </li>
                  ))}
                </ul>
                <p className="text-destructive font-medium">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            ) : (
              <>
                Tem certeza que deseja excluir a peça <strong>"{partName}"</strong>? 
                Esta ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isBulkDelete ? `Excluir ${count} peças` : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}