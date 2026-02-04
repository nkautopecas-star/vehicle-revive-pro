import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Trash2, ZoomIn, GripVertical, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartImage } from "@/hooks/usePartImages";

interface SortableImageThumbnailProps {
  image: PartImage;
  index: number;
  partName: string;
  onView: (index: number) => void;
  onDelete: (image: PartImage) => void;
  onSetPrimary: (image: PartImage) => void;
  isDeleting: boolean;
  isSettingPrimary: boolean;
}

export function SortableImageThumbnail({
  image,
  index,
  partName,
  onView,
  onDelete,
  onSetPrimary,
  isDeleting,
  isSettingPrimary,
}: SortableImageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isPrimary = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-80 shadow-xl ring-2 ring-primary rounded-lg"
      )}
    >
      <AspectRatio ratio={1}>
        <img
          src={image.url}
          alt={`${partName} - Foto ${index + 1}`}
          className="w-full h-full object-cover rounded-lg border border-border transition-transform cursor-pointer"
          onClick={() => onView(index)}
        />
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center pointer-events-none"
        >
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </AspectRatio>

      {/* Primary badge */}
      {isPrimary && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Principal
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-7 h-7 rounded bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity border border-border"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Set as primary button - only show if not already primary */}
      {!isPrimary && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-2 left-11 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border border-border hover:bg-warning/20 hover:text-warning"
          onClick={(e) => {
            e.stopPropagation();
            onSetPrimary(image);
          }}
          disabled={isSettingPrimary}
          title="Definir como foto principal"
        >
          <Star className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Delete button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(image);
        }}
        disabled={isDeleting}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
