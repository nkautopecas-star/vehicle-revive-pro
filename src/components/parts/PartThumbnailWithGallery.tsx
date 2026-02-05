import { useState } from "react";
import { Package, ZoomIn, ExternalLink } from "lucide-react";
import { usePartFirstImageWithFallback } from "@/hooks/usePartImagesWithFallback";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PartImageGalleryDialog } from "./PartImageGalleryDialog";

interface PartThumbnailWithGalleryProps {
  partId: string;
  partName: string;
  size?: "sm" | "md" | "lg";
  showZoomHint?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-20 h-20",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

export function PartThumbnailWithGallery({ 
  partId, 
  partName, 
  size = "md",
  showZoomHint = true 
}: PartThumbnailWithGalleryProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { data: imageData, isLoading } = usePartFirstImageWithFallback(partId);

  const handleClick = (e: React.MouseEvent) => {
    if (imageData) {
      e.preventDefault();
      e.stopPropagation();
      setIsGalleryOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("rounded bg-muted animate-pulse flex-shrink-0", sizeClasses[size])} />
    );
  }

  if (imageData) {
    return (
      <>
        <div 
          className={cn(
            "relative group cursor-pointer rounded overflow-hidden flex-shrink-0",
            sizeClasses[size]
          )}
          onClick={handleClick}
        >
          <img
            src={imageData.url}
            alt={partName}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          {showZoomHint && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>
          )}
          {imageData.source === 'listing' && size === 'lg' && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-1 right-1 text-[10px] px-1 py-0 h-4 bg-warning text-warning-foreground"
            >
              ML
            </Badge>
          )}
        </div>

        <PartImageGalleryDialog
          open={isGalleryOpen}
          onOpenChange={setIsGalleryOpen}
          partId={partId}
          partName={partName}
        />
      </>
    );
  }

  return (
    <div className={cn("rounded bg-muted flex items-center justify-center flex-shrink-0", sizeClasses[size])}>
      <Package className={cn("text-muted-foreground", iconSizeClasses[size])} />
    </div>
  );
}
