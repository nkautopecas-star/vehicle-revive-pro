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

const topParts = [
  { id: 1, name: "Motor Completo", vehicle: "Honda Civic 2019", sold: 45, revenue: 67500, status: "Ativo" },
  { id: 2, name: "Câmbio Automático", vehicle: "Toyota Corolla 2020", sold: 38, revenue: 57000, status: "Ativo" },
  { id: 3, name: "Farol LED", vehicle: "VW Polo 2021", sold: 120, revenue: 48000, status: "Ativo" },
  { id: 4, name: "Painel de Instrumentos", vehicle: "Fiat Argo 2020", sold: 85, revenue: 42500, status: "Baixo" },
  { id: 5, name: "Porta Dianteira", vehicle: "Chevrolet Onix 2019", sold: 62, revenue: 37200, status: "Ativo" },
];

export function TopPartsTable() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Peças Mais Vendidas</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
