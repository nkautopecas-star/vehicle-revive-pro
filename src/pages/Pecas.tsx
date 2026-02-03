import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, MoreHorizontal, Package, Eye, Edit, Trash2, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Part {
  id: string;
  nome: string;
  codigoInterno: string;
  codigoOEM: string;
  categoria: string;
  condicao: "nova" | "usada" | "recondicionada";
  veiculoOrigem: string;
  quantidade: number;
  localizacao: string;
  precoCusto: number;
  precoVenda: number;
  status: "ativa" | "vendida" | "pausada";
}

const mockParts: Part[] = [
  {
    id: "1",
    nome: "Motor Completo",
    codigoInterno: "MOT-001",
    codigoOEM: "11000-PNB-A00",
    categoria: "Motor",
    condicao: "usada",
    veiculoOrigem: "Honda Civic 2019",
    quantidade: 1,
    localizacao: "A1-E2-P3",
    precoCusto: 3500,
    precoVenda: 5500,
    status: "ativa",
  },
  {
    id: "2",
    nome: "Câmbio Automático",
    codigoInterno: "CAM-002",
    codigoOEM: "20011-RZA-A01",
    categoria: "Transmissão",
    condicao: "usada",
    veiculoOrigem: "Toyota Corolla 2020",
    quantidade: 1,
    localizacao: "A2-E1-P1",
    precoCusto: 2800,
    precoVenda: 4200,
    status: "ativa",
  },
  {
    id: "3",
    nome: "Farol LED Esquerdo",
    codigoInterno: "FAR-003",
    codigoOEM: "2AB63E-001",
    categoria: "Iluminação",
    condicao: "usada",
    veiculoOrigem: "VW Polo 2021",
    quantidade: 5,
    localizacao: "B1-E3-P2",
    precoCusto: 280,
    precoVenda: 450,
    status: "ativa",
  },
  {
    id: "4",
    nome: "Painel de Instrumentos",
    codigoInterno: "PAN-004",
    codigoOEM: "735573645",
    categoria: "Interior",
    condicao: "usada",
    veiculoOrigem: "Fiat Argo 2020",
    quantidade: 2,
    localizacao: "C1-E2-P4",
    precoCusto: 350,
    precoVenda: 550,
    status: "pausada",
  },
  {
    id: "5",
    nome: "Porta Dianteira Direita",
    codigoInterno: "POR-005",
    codigoOEM: "52101-02130",
    categoria: "Carroceria",
    condicao: "usada",
    veiculoOrigem: "Chevrolet Onix 2019",
    quantidade: 3,
    localizacao: "D1-E1-P1",
    precoCusto: 400,
    precoVenda: 680,
    status: "ativa",
  },
  {
    id: "6",
    nome: "Alternador",
    codigoInterno: "ALT-006",
    codigoOEM: "37300-2B300",
    categoria: "Elétrica",
    condicao: "recondicionada",
    veiculoOrigem: "Hyundai HB20 2018",
    quantidade: 4,
    localizacao: "A3-E2-P2",
    precoCusto: 180,
    precoVenda: 320,
    status: "ativa",
  },
];

const statusConfig = {
  ativa: { label: "Ativa", className: "bg-success/20 text-success hover:bg-success/30" },
  vendida: { label: "Vendida", className: "bg-info/20 text-info hover:bg-info/30" },
  pausada: { label: "Pausada", className: "bg-warning/20 text-warning hover:bg-warning/30" },
};

const condicaoConfig = {
  nova: { label: "Nova", className: "bg-success/20 text-success" },
  usada: { label: "Usada", className: "bg-muted text-muted-foreground" },
  recondicionada: { label: "Recondicionada", className: "bg-info/20 text-info" },
};

const Pecas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categorias = [...new Set(mockParts.map((p) => p.categoria))];

  const filteredParts = mockParts.filter((part) => {
    const matchesSearch =
      part.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.codigoInterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.codigoOEM.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.veiculoOrigem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || part.status === statusFilter;
    const matchesCategoria = categoriaFilter === "all" || part.categoria === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const totalEstoque = filteredParts.reduce((acc, p) => acc + p.quantidade, 0);
  const valorEstoque = filteredParts.reduce((acc, p) => acc + p.precoVenda * p.quantidade, 0);

  return (
    <AppLayout title="Peças" description="Gerencie o catálogo de peças do seu estoque">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="vendida">Vendida</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Peça
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Peça</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da peça para adicionar ao estoque.
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Peça</Label>
                      <Input id="nome" placeholder="Motor Completo" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select>
                        <SelectTrigger id="categoria">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="motor">Motor</SelectItem>
                          <SelectItem value="transmissao">Transmissão</SelectItem>
                          <SelectItem value="iluminacao">Iluminação</SelectItem>
                          <SelectItem value="interior">Interior</SelectItem>
                          <SelectItem value="carroceria">Carroceria</SelectItem>
                          <SelectItem value="eletrica">Elétrica</SelectItem>
                          <SelectItem value="suspensao">Suspensão</SelectItem>
                          <SelectItem value="freios">Freios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigoInterno">Código Interno</Label>
                      <Input id="codigoInterno" placeholder="MOT-001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoOEM">Código OEM</Label>
                      <Input id="codigoOEM" placeholder="11000-PNB-A00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condicao">Condição</Label>
                      <Select>
                        <SelectTrigger id="condicao">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nova">Nova</SelectItem>
                          <SelectItem value="usada">Usada</SelectItem>
                          <SelectItem value="recondicionada">Recondicionada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input id="quantidade" type="number" placeholder="1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="localizacao">Localização</Label>
                      <Input id="localizacao" placeholder="A1-E2-P3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="precoCusto">Preço de Custo (R$)</Label>
                      <Input id="precoCusto" type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precoVenda">Preço de Venda (R$)</Label>
                      <Input id="precoVenda" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="veiculoOrigem">Veículo de Origem</Label>
                    <Select>
                      <SelectTrigger id="veiculoOrigem">
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Honda Civic 2019 - ABC-1234</SelectItem>
                        <SelectItem value="2">Toyota Corolla 2020 - XYZ-5678</SelectItem>
                        <SelectItem value="3">VW Polo 2021 - DEF-9012</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" placeholder="Observações sobre a peça..." rows={3} />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar Peça</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredParts.length}</p>
                <p className="text-xs text-muted-foreground">Tipos de Peças</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <Package className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEstoque}</p>
                <p className="text-xs text-muted-foreground">Unidades em Estoque</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10">
                <MapPin className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categorias.length}</p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                <span className="text-lg font-bold text-warning">R$</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{(valorEstoque / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Valor em Estoque</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Peça</TableHead>
                  <TableHead className="text-muted-foreground">Códigos</TableHead>
                  <TableHead className="text-muted-foreground">Veículo</TableHead>
                  <TableHead className="text-muted-foreground">Condição</TableHead>
                  <TableHead className="text-muted-foreground text-right">Qtd</TableHead>
                  <TableHead className="text-muted-foreground">Local</TableHead>
                  <TableHead className="text-muted-foreground text-right">Preço</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{part.nome}</p>
                        <p className="text-xs text-muted-foreground">{part.categoria}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">
                        <p>{part.codigoInterno}</p>
                        <p className="text-muted-foreground">{part.codigoOEM}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{part.veiculoOrigem}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", condicaoConfig[part.condicao].className)}>
                        {condicaoConfig[part.condicao].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{part.quantidade}</TableCell>
                    <TableCell className="font-mono text-sm">{part.localizacao}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium text-primary">
                          R$ {part.precoVenda.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Custo: R$ {part.precoCusto.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", statusConfig[part.status].className)}>
                        {statusConfig[part.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="w-4 h-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Gerar anúncio IA
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Pecas;
