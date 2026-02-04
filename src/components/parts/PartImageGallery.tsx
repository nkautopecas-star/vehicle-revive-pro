import { useState } from "react";
import { usePartImages, useUploadPartImage, useDeletePartImage, type PartImage } from "@/hooks/usePartImages";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ImagePlus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Loader2,
  Image as ImageIcon,
  ZoomIn
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PartImageGalleryProps {
  partId: string;
  partName: string;
}

export function PartImageGallery({ partId, partName }: PartImageGalleryProps) {
  const { data: images = [], isLoading } = usePartImages(partId);
  const uploadMutation = useUploadPartImage();
  const deleteMutation = useDeletePartImage();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    for (const file of Array.from(files)) {
      if (!validTypes.includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      await uploadMutation.mutateAsync({ partId, file });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDelete = (image: PartImage) => {
    deleteMutation.mutate({ imageId: image.id, filePath: image.file_path, partId });
    if (currentIndex >= images.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Fotos ({images.length})
        </h3>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div 
            key={image.id} 
            className="relative group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <AspectRatio ratio={1}>
              <img
                src={image.url}
                alt={`${partName} - Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </AspectRatio>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(image);
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            id="gallery-upload"
            onChange={(e) => handleFileChange(e.target.files)}
            disabled={uploadMutation.isPending}
          />
          <label htmlFor="gallery-upload" className="cursor-pointer flex flex-col items-center gap-2 p-4">
            {uploadMutation.isPending ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground text-center">
              {uploadMutation.isPending ? "Enviando..." : "Adicionar foto"}
            </span>
          </label>
        </div>
      </div>

      {/* Empty State */}
      {images.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhuma foto cadastrada. Arraste imagens ou clique para adicionar.
        </p>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="max-w-4xl w-full p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Main image */}
            {images[currentIndex] && (
              <img
                src={images[currentIndex].url}
                alt={`${partName} - Foto ${currentIndex + 1}`}
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}

            {/* Image counter and delete */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <span className="text-white/80 text-sm">
                {currentIndex + 1} / {images.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/20"
                onClick={() => {
                  if (images[currentIndex]) {
                    handleDelete(images[currentIndex]);
                    if (images.length === 1) setLightboxOpen(false);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                      index === currentIndex 
                        ? "border-primary ring-2 ring-primary/50" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
