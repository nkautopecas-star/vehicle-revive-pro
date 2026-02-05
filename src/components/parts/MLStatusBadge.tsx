import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartMLStatus } from "@/hooks/usePartsMLStatus";

interface MLStatusBadgeProps {
  status: PartMLStatus;
}

const statusConfig = {
  active: {
    label: "ML",
    className: "bg-[#FFE600] text-black hover:bg-[#FFE600]/80",
    tooltip: "Ativo no Mercado Livre",
  },
  paused: {
    label: "ML",
    className: "bg-warning/20 text-warning hover:bg-warning/30",
    tooltip: "Pausado no Mercado Livre",
  },
  sold: {
    label: "ML",
    className: "bg-info/20 text-info hover:bg-info/30",
    tooltip: "Vendido no Mercado Livre",
  },
};

export function MLStatusBadge({ status }: MLStatusBadgeProps) {
  const config = statusConfig[status.status];

  return (
    <Badge
      className={cn(
        "gap-1 font-medium text-[10px] px-1.5 py-0",
        config.className
      )}
      title={`${config.tooltip}${status.listingCount > 1 ? ` (${status.listingCount} anúncios)` : ""}`}
    >
      <ShoppingBag className="w-3 h-3" />
      {status.listingCount > 1 && <span>{status.listingCount}</span>}
    </Badge>
  );
}
