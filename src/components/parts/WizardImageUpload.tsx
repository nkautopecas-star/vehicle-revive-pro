import { useCallback, useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface WizardImageUploadProps {
  pendingImages: PendingImage[];
  onImagesChange: (images: PendingImage[]) => void;
  disabled?: boolean;
}

export function WizardImageUpload({ pendingImages, onImagesChange, disabled }: WizardImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputId = useId();

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const newImages: PendingImage[] = [];
      
      for (const file of Array.from(files)) {
        if (!validTypes.includes(file.type)) {
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          continue; // Skip files > 5MB
        }
        
        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      
      onImagesChange([...pendingImages, ...newImages]);
    },
    [pendingImages, onImagesChange]
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

  const handleRemove = useCallback(
    (imageId: string) => {
      const imageToRemove = pendingImages.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      onImagesChange(pendingImages.filter(img => img.id !== imageId));
    },
    [pendingImages, onImagesChange]
  );

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
          id={inputId}
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={disabled}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <ImagePlus className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Clique ou arraste imagens aqui
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP ou GIF (máx. 5MB)
          </span>
        </label>
      </div>

      {/* Image preview grid */}
      {pendingImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingImages.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.previewUrl}
                alt={image.file.name}
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(image.id)}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                {image.file.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
