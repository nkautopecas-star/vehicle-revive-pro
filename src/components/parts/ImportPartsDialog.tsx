import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { parseFile, downloadSampleCSV, type ImportedPart, type ImportResult } from "@/utils/importUtils";
import { useCategories, useCreatePart } from "@/hooks/useParts";
import { toast } from "sonner";

interface ImportPartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const conditionLabels: Record<string, string> = {
  nova: "Nova",
  usada: "Usada",
  recondicionada: "Recondicionada",
};

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  vendida: "Vendida",
  pausada: "Pausada",
};

export function ImportPartsDialog({ open, onOpenChange }: ImportPartsDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const { data: categories = [] } = useCategories();
  const createMutation = useCreatePart();

  const handleFileChange = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const result = await parseFile(selectedFile);
    setImportResult(result);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleFileChange(droppedFile);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileChange(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!importResult || importResult.data.length === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: importResult.data.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < importResult.data.length; i++) {
      const part = importResult.data[i];
      
      // Find category ID by name
      const category = categories.find(
        (c) => c.name.toLowerCase() === part.categoria?.toLowerCase()
      );

      try {
        await new Promise<void>((resolve, reject) => {
          createMutation.mutate(
            {
              nome: part.nome,
              codigo_interno: part.codigo_interno || null,
              codigo_oem: part.codigo_oem || null,
              categoria_id: category?.id || null,
              condicao: part.condicao,
              quantidade: part.quantidade,
              quantidade_minima: 0,
              localizacao: part.localizacao || null,
              preco_custo: part.preco_custo ?? null,
              preco_venda: part.preco_venda ?? null,
              status: part.status,
              observacoes: part.observacoes || null,
              vehicle_id: null,
            },
            {
              onSuccess: () => {
                successCount++;
                resolve();
              },
              onError: () => {
                errorCount++;
                resolve(); // Continue with next even on error
              },
            }
          );
        });
      } catch {
        errorCount++;
      }

      setImportProgress({ current: i + 1, total: importResult.data.length });
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} peça(s) importada(s) com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} peça(s) falharam ao importar.`);
    }

    if (successCount > 0) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setImportProgress({ current: 0, total: 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Peças
          </DialogTitle>
          <DialogDescription>
            Importe peças em lote a partir de um arquivo CSV ou Excel (.xls)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Download sample */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Não sabe o formato? Baixe o modelo de exemplo.
            </p>
            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo CSV
            </Button>
          </div>

          {/* File upload area */}
          {!importResult ? (
            <label
              className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileSpreadsheet className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground">CSV ou XLS (Excel 2003)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xls,.xml,.txt"
                onChange={handleInputChange}
              />
            </label>
          ) : (
            <>
              {/* File info */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{file?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {importResult.data.length} peça(s) encontrada(s)
                      {importResult.errors.length > 0 && (
                        <span className="text-destructive ml-2">
                          • {importResult.errors.length} erro(s)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setImportResult(null);
                  }}
                >
                  Trocar arquivo
                </Button>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          Linha {error.row}: {error.message}
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...e mais {importResult.errors.length - 5} erro(s)</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview table */}
              {importResult.data.length > 0 && (
                <ScrollArea className="flex-1 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Condição</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.data.slice(0, 50).map((part, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{part.nome}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {part.codigo_interno || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{conditionLabels[part.condicao]}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{part.quantidade}</TableCell>
                          <TableCell className="text-right">
                            {part.preco_venda
                              ? `R$ ${part.preco_venda.toLocaleString("pt-BR")}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{statusLabels[part.status]}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {importResult.data.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground py-3">
                      Mostrando 50 de {importResult.data.length} peças
                    </p>
                  )}
                </ScrollArea>
              )}

              {/* Import progress */}
              {isImporting && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-sm">
                    Importando... {importProgress.current} de {importProgress.total}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importResult || importResult.data.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Importar {importResult?.data.length || 0} Peça(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
