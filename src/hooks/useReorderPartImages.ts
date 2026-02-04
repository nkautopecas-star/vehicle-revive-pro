import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReorderPayload {
  partId: string;
  imageIds: string[]; // array of image IDs in the new order
}

export function useReorderPartImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partId, imageIds }: ReorderPayload) => {
      // Update each image with its new order_position
      const updates = imageIds.map((id, index) =>
        supabase
          .from("part_images")
          .update({ order_position: index })
          .eq("id", id)
      );

      const results = await Promise.all(updates);

      // Check for any errors
      const error = results.find((r) => r.error);
      if (error?.error) {
        throw error.error;
      }

      return partId;
    },
    onSuccess: (partId) => {
      queryClient.invalidateQueries({ queryKey: ["part-images", partId] });
    },
    onError: (error) => {
      console.error("Error reordering images:", error);
      toast.error("Erro ao reordenar imagens.");
    },
  });
}
