import { Package } from "lucide-react";
import { usePartFirstImage } from "@/hooks/usePartFirstImage";
import { cn } from "@/lib/utils";

interface PartThumbnailProps {
  partId: string;
  partName: string;
  size?: "sm" | "md" | "lg";
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

export function PartThumbnail({ partId, partName, size = "md" }: PartThumbnailProps) {
  const { data: imageUrl, isLoading } = usePartFirstImage(partId);

  if (isLoading) {
    return (
      <div className={cn("rounded bg-muted animate-pulse flex-shrink-0", sizeClasses[size])} />
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={partName}
        className={cn("rounded object-cover flex-shrink-0", sizeClasses[size])}
      />
    );
  }

  return (
    <div className={cn("rounded bg-muted flex items-center justify-center flex-shrink-0", sizeClasses[size])}>
      <Package className={cn("text-muted-foreground", iconSizeClasses[size])} />
    </div>
  );
}
