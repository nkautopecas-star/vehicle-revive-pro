import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePartImages, useUploadPartImage, useDeletePartImage, type PartImage } from "@/hooks/usePartImages";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartImageUploadProps {
  partId: string | undefined;
  disabled?: boolean;
}

export function PartImageUpload({ partId, disabled }: PartImageUploadProps) {
  const { data: images = [], isLoading } = usePartImages(partId);
  const uploadMutation = useUploadPartImage();
  const deleteMutation = useDeletePartImage();
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || !partId) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      
      for (const file of Array.from(files)) {
        if (!validTypes.includes(file.type)) {
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          continue; // Skip files > 5MB
        }
        await uploadMutation.mutateAsync({ partId, file });
      }
    },
    [partId, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDelete = useCallback(
    (image: PartImage) => {
      if (!partId) return;
      deleteMutation.mutate({ imageId: image.id, filePath: image.file_path, partId });
    },
    [partId, deleteMutation]
  );

  if (!partId) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Fotos da Peça</p>
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Salve a peça primeiro para adicionar fotos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Fotos da Peça</p>
      
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-muted",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          id="part-image-upload"
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={disabled || uploadMutation.isPending}
        />
        <label
          htmlFor="part-image-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <ImagePlus className="w-8 h-8 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploadMutation.isPending
              ? "Enviando..."
              : "Clique ou arraste imagens aqui"}
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP ou GIF (máx. 5MB)
          </span>
        </label>
      </div>

      {/* Image preview grid */}
      {isLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-20 h-20 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt={image.file_name}
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(image)}
                disabled={deleteMutation.isPending}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
