import { Package } from "lucide-react";
import { usePartFirstImage } from "@/hooks/usePartFirstImage";

interface PartThumbnailProps {
  partId: string;
  partName: string;
}

export function PartThumbnail({ partId, partName }: PartThumbnailProps) {
  const { data: imageUrl, isLoading } = usePartFirstImage(partId);

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded bg-muted animate-pulse flex-shrink-0" />
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={partName}
        className="w-10 h-10 rounded object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
      <Package className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}
