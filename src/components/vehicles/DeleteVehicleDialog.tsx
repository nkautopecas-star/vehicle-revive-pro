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
import { Vehicle, useDeleteVehicle } from "@/hooks/useVehicles";

interface DeleteVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
}

export function DeleteVehicleDialog({ open, onOpenChange, vehicle }: DeleteVehicleDialogProps) {
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = async () => {
    if (!vehicle) return;
    
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir veículo</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o veículo{" "}
            <strong>{vehicle?.marca} {vehicle?.modelo}</strong> (Placa: {vehicle?.placa})?
            <br />
            <br />
            Esta ação não pode ser desfeita. As peças associadas a este veículo
            perderão a vinculação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteVehicle.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteVehicle.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteVehicle.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
