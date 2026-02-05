import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Package,
  Link2,
  ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { GroupedListing } from "@/hooks/useGroupedListings";
import type { MarketplaceListing } from "@/hooks/useMarketplaceListings";
import { cn } from "@/lib/utils";

interface GroupedListingRowProps {
  group: GroupedListing;
  onOpenLinkDialog: (listing: MarketplaceListing) => void;
  formatPrice: (price: number) => string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-success/20 text-success border-0">Ativo</Badge>;
    case "paused":
      return <Badge variant="secondary">Pausado</Badge>;
    case "sold":
      return <Badge className="bg-primary/20 text-primary border-0">Vendido</Badge>;
    case "deleted":
      return <Badge variant="destructive">Excluído</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Infer listing type from title or price patterns
function getListingTypeLabel(listing: MarketplaceListing, allListings: MarketplaceListing[]): string {
  // If there's only one listing, no need for type label
  if (allListings.length <= 1) return "";
  
  // Find min and max prices
  const prices = allListings.map(l => l.preco);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // If prices are the same, we can't distinguish
  if (minPrice === maxPrice) return "";
  
  // Assume lower price = Clássico, higher price = Premium
  if (listing.preco === minPrice) return "Clássico";
  if (listing.preco === maxPrice) return "Premium";
  
  return "";
}

export function GroupedListingRow({
  group,
  onOpenLinkDialog,
  formatPrice,
}: GroupedListingRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstListing = group.listings[0];

  // Get aggregate status for the group
  const getGroupStatus = () => {
    const statuses = group.listings.map(l => l.status);
    if (statuses.every(s => s === "active")) return "active";
    if (statuses.every(s => s === "paused")) return "paused";
    if (statuses.every(s => s === "sold")) return "sold";
    if (statuses.some(s => s === "active")) return "partial";
    return statuses[0];
  };

  const groupStatus = getGroupStatus();

  const getGroupStatusBadge = () => {
    if (groupStatus === "partial") {
      return <Badge className="bg-warning/20 text-warning border-0">Parcial</Badge>;
    }
    return getStatusBadge(groupStatus);
  };

  // Single listing - render simple row
  if (!group.hasMultiple) {
    return (
      <TableRow>
        <TableCell className="w-8" />
        <TableCell>
          {firstListing.image_url ? (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer">
                  <AspectRatio ratio={1}>
                    <img
                      src={firstListing.image_url}
                      alt={firstListing.titulo}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
              </HoverCardTrigger>
              <HoverCardContent side="right" className="w-64 p-2">
                <AspectRatio ratio={1}>
                  <img
                    src={firstListing.image_url}
                    alt={firstListing.titulo}
                    className="w-full h-full object-cover rounded"
                  />
                </AspectRatio>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{firstListing.titulo}</span>
            <span className="text-xs text-muted-foreground">{firstListing.external_id}</span>
          </div>
        </TableCell>
        <TableCell className="font-medium">{formatPrice(firstListing.preco)}</TableCell>
        <TableCell>{getStatusBadge(firstListing.status)}</TableCell>
        <TableCell>
          {firstListing.part ? (
            <Link
              to={`/pecas/${firstListing.part.id}`}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Package className="h-3 w-3" />
              {firstListing.part.codigo_interno || firstListing.part.nome}
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenLinkDialog(firstListing)}
              className="text-muted-foreground hover:text-primary h-auto py-1 px-2"
            >
              <Link2 className="h-3 w-3 mr-1" />
              Vincular peça
            </Button>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {firstListing.last_sync
            ? formatDistanceToNow(new Date(firstListing.last_sync), {
                addSuffix: true,
                locale: ptBR,
              })
            : "-"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenLinkDialog(firstListing)}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {firstListing.part ? "Alterar vínculo" : "Vincular peça"}
              </TooltipContent>
            </Tooltip>
            {firstListing.external_id && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a
                      href={`https://www.mercadolivre.com.br/p/${firstListing.external_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir no Mercado Livre</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Multiple listings - render expandable group
  return (
    <>
      {/* Parent Row */}
      <TableRow 
        className={cn(
          "cursor-pointer hover:bg-muted/50",
          isExpanded && "bg-muted/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="w-8">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          {firstListing.image_url ? (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div 
                  className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AspectRatio ratio={1}>
                    <img
                      src={firstListing.image_url}
                      alt={firstListing.titulo}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
              </HoverCardTrigger>
              <HoverCardContent side="right" className="w-64 p-2">
                <AspectRatio ratio={1}>
                  <img
                    src={firstListing.image_url}
                    alt={firstListing.titulo}
                    className="w-full h-full object-cover rounded"
                  />
                </AspectRatio>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium line-clamp-1">{firstListing.titulo}</span>
              <Badge variant="outline" className="text-xs">
                {group.listings.length} anúncios
              </Badge>
            </div>
            {group.part && (
              <span className="text-xs text-muted-foreground">
                {group.part.codigo_interno || group.part.nome}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="font-medium">
          {group.minPrice === group.maxPrice ? (
            formatPrice(group.minPrice)
          ) : (
            <span className="text-muted-foreground">
              {formatPrice(group.minPrice)} - {formatPrice(group.maxPrice)}
            </span>
          )}
        </TableCell>
        <TableCell>{getGroupStatusBadge()}</TableCell>
        <TableCell>
          {group.part ? (
            <Link
              to={`/pecas/${group.part.id}`}
              className="text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Package className="h-3 w-3" />
              {group.part.codigo_interno || group.part.nome}
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">Não vinculada</span>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {firstListing.last_sync
            ? formatDistanceToNow(new Date(firstListing.last_sync), {
                addSuffix: true,
                locale: ptBR,
              })
            : "-"}
        </TableCell>
        <TableCell className="text-right">
          <span className="text-xs text-muted-foreground">Expandir para ver ações</span>
        </TableCell>
      </TableRow>

      {/* Child Rows */}
      {isExpanded && group.listings.map((listing) => (
        <TableRow 
          key={listing.id}
          className="bg-muted/10 border-l-4 border-l-primary/20"
        >
          <TableCell className="w-8" />
          <TableCell>
            <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col pl-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{listing.titulo}</span>
                {getListingTypeLabel(listing, group.listings) && (
                  <Badge variant="outline" className="text-xs">
                    {getListingTypeLabel(listing, group.listings)}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{listing.external_id}</span>
            </div>
          </TableCell>
          <TableCell className="font-medium">{formatPrice(listing.preco)}</TableCell>
          <TableCell>{getStatusBadge(listing.status)}</TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenLinkDialog(listing)}
              className="text-muted-foreground hover:text-primary h-auto py-1 px-2"
            >
              <Link2 className="h-3 w-3 mr-1" />
              Vincular
            </Button>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {listing.last_sync
              ? formatDistanceToNow(new Date(listing.last_sync), {
                  addSuffix: true,
                  locale: ptBR,
                })
              : "-"}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onOpenLinkDialog(listing)}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {listing.part ? "Alterar vínculo" : "Vincular peça"}
                </TooltipContent>
              </Tooltip>
              {listing.external_id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a
                        href={`https://www.mercadolivre.com.br/p/${listing.external_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir no Mercado Livre</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
