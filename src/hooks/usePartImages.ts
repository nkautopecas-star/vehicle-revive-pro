import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PartImage {
  id: string;
  part_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  url: string;
}

export function usePartImages(partId: string | undefined) {
  return useQuery({
    queryKey: ['part-images', partId],
    queryFn: async (): Promise<PartImage[]> => {
      if (!partId) return [];

      const { data, error } = await supabase
        .from('part_images')
        .select('*')
        .eq('part_id', partId)
        .order('order_position', { ascending: true });

      if (error) {
        throw error;
      }

      return data.map((img) => ({
        ...img,
        url: supabase.storage.from('part-images').getPublicUrl(img.file_path).data.publicUrl,
      }));
    },
    enabled: !!partId,
  });
}

export function useUploadPartImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partId, file }: { partId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${partId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('part-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get current max order_position
      const { data: existingImages } = await supabase
        .from('part_images')
        .select('order_position')
        .eq('part_id', partId)
        .order('order_position', { ascending: false })
        .limit(1);

      const nextPosition = existingImages && existingImages.length > 0
        ? (existingImages[0].order_position ?? 0) + 1
        : 0;

      // Create database record
      const { error: dbError } = await supabase
        .from('part_images')
        .insert({
          part_id: partId,
          file_path: fileName,
          file_name: file.name,
          file_size: file.size,
          order_position: nextPosition,
        });

      if (dbError) {
        // Rollback: delete uploaded file
        await supabase.storage.from('part-images').remove([fileName]);
        throw dbError;
      }

      return fileName;
    },
    onSuccess: (_, { partId }) => {
      queryClient.invalidateQueries({ queryKey: ['part-images', partId] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem. Verifique suas permissões.');
    },
  });
}

export function useDeletePartImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageId, filePath, partId }: { imageId: string; filePath: string; partId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('part-images')
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('part_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw dbError;
      }

      return partId;
    },
    onSuccess: (partId) => {
      queryClient.invalidateQueries({ queryKey: ['part-images', partId] });
      toast.success('Imagem excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast.error('Erro ao excluir imagem.');
    },
  });
}
