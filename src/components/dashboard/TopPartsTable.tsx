import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopParts } from "@/hooks/useDashboardData";

export function TopPartsTable() {
  const { data: topParts, isLoading } = useTopParts();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Peças Mais Vendidas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !topParts || topParts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma venda registrada ainda
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Peça</TableHead>
                <TableHead className="text-muted-foreground">Veículo</TableHead>
                <TableHead className="text-muted-foreground text-right">Vendas</TableHead>
                <TableHead className="text-muted-foreground text-right">Receita</TableHead>
                <TableHead className="text-muted-foreground text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topParts.map((part) => (
                <TableRow key={part.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium">{part.name}</TableCell>
                  <TableCell className="text-muted-foreground">{part.vehicle}</TableCell>
                  <TableCell className="text-right">{part.sold}</TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    R$ {part.revenue.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={part.status === "Ativo" ? "default" : "secondary"}
                      className={part.status === "Ativo" ? "bg-success/20 text-success hover:bg-success/30" : "bg-warning/20 text-warning hover:bg-warning/30"}
                    >
                      {part.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
