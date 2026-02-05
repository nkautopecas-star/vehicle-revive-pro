import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from "lucide-react";
import { usePartImagesWithFallback } from "@/hooks/usePartImagesWithFallback";
import { cn } from "@/lib/utils";
import { usePinchZoom } from "@/hooks/usePinchZoom";
import { useIsMobile } from "@/hooks/use-mobile";

interface PartImageGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
  partName: string;
}

export function PartImageGalleryDialog({
  open,
  onOpenChange,
  partId,
  partName,
}: PartImageGalleryDialogProps) {
  const { data: images = [], isLoading } = usePartImagesWithFallback(partId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();
  
  const pinchZoom = usePinchZoom(1, 4);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    pinchZoom.reset();
  }, [pinchZoom]);

  const handlePrevious = () => {
    resetZoom();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    resetZoom();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setPosition({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const currentImage = images[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg">{partName}</DialogTitle>
              {currentImage?.source === 'listing' && (
                <Badge variant="secondary" className="bg-warning/20 text-warning">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Mercado Livre
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>
        </DialogHeader>

        <div 
          className="flex-1 relative overflow-hidden bg-black/5 dark:bg-white/5"
          onWheel={handleWheel}
          onTouchStart={pinchZoom.handleTouchStart}
          onTouchMove={pinchZoom.handleTouchMove}
          onTouchEnd={pinchZoom.handleTouchEnd}
        >
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-pulse bg-muted w-64 h-64 rounded" />
            </div>
          ) : images.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Nenhuma imagem disponível
            </div>
          ) : (
            <>
              <div 
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  (scale > 1 || pinchZoom.isZoomed) ? "cursor-grab active:cursor-grabbing" : ""
                )}
                onMouseDown={handleMouseDown}
                onDoubleClick={isMobile ? pinchZoom.toggleZoom : undefined}
              >
                <img
                  src={currentImage?.url}
                  alt={`${partName} - Imagem ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain select-none touch-none"
                  style={{
                    transform: isMobile && pinchZoom.isZoomed
                      ? `scale(${pinchZoom.scale})`
                      : `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transformOrigin: isMobile && pinchZoom.isZoomed
                      ? `${pinchZoom.position.x}% ${pinchZoom.position.y}%`
                      : 'center center',
                    transition: (scale === 1 && !pinchZoom.isZoomed) ? "transform 0.2s ease-out" : "none",
                  }}
                  draggable={false}
                />
              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Zoom controls */}
        <div className="p-3 border-t flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 1}
          >
            <ZoomOut className="w-4 h-4 mr-1" />
            Diminuir
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 4}
          >
            <ZoomIn className="w-4 h-4 mr-1" />
            Aumentar
          </Button>
          {scale > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetZoom}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar
            </Button>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="p-3 border-t flex gap-2 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  resetZoom();
                  setCurrentIndex(index);
                }}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all",
                  currentIndex === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <img
                  src={img.url}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
