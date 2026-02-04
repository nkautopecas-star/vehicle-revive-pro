import type { Part } from "@/hooks/useParts";

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatCondition = (condicao: string): string => {
  const map: Record<string, string> = {
    nova: "Nova",
    usada: "Usada",
    recondicionada: "Recondicionada",
  };
  return map[condicao] || condicao;
};

const formatStatus = (status: string): string => {
  const map: Record<string, string> = {
    ativa: "Ativa",
    vendida: "Vendida",
    pausada: "Pausada",
  };
  return map[status] || status;
};

interface ExportPart {
  nome: string;
  codigo_interno: string | null;
  codigo_oem: string | null;
  categoria_nome: string | null;
  veiculo_info: string | null;
  condicao: string;
  quantidade: number;
  localizacao: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  status: string;
}

const getExportData = (parts: Part[]): ExportPart[] => {
  return parts.map((part) => ({
    nome: part.nome,
    codigo_interno: part.codigo_interno,
    codigo_oem: part.codigo_oem,
    categoria_nome: part.categoria_nome,
    veiculo_info: part.veiculo_info,
    condicao: part.condicao,
    quantidade: part.quantidade,
    localizacao: part.localizacao,
    preco_custo: part.preco_custo,
    preco_venda: part.preco_venda,
    status: part.status,
  }));
};

const headers = [
  "Nome",
  "Código Interno",
  "Código OEM",
  "Categoria",
  "Veículo",
  "Condição",
  "Quantidade",
  "Localização",
  "Preço Custo",
  "Preço Venda",
  "Status",
];

export function exportToCSV(parts: Part[], filename: string = "pecas"): void {
  const data = getExportData(parts);
  
  const csvRows: string[] = [];
  
  // Add BOM for Excel UTF-8 compatibility
  csvRows.push(headers.join(";"));
  
  data.forEach((part) => {
    const row = [
      `"${part.nome.replace(/"/g, '""')}"`,
      `"${part.codigo_interno || ""}"`,
      `"${part.codigo_oem || ""}"`,
      `"${part.categoria_nome || ""}"`,
      `"${part.veiculo_info || ""}"`,
      `"${formatCondition(part.condicao)}"`,
      part.quantidade.toString(),
      `"${part.localizacao || ""}"`,
      part.preco_custo != null ? part.preco_custo.toString().replace(".", ",") : "",
      part.preco_venda != null ? part.preco_venda.toString().replace(".", ",") : "",
      `"${formatStatus(part.status)}"`,
    ];
    csvRows.push(row.join(";"));
  });
  
  const BOM = "\uFEFF";
  const csvContent = BOM + csvRows.join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel(parts: Part[], filename: string = "pecas"): void {
  const data = getExportData(parts);
  
  // Create XML spreadsheet (Excel 2003 XML format - works without external libs)
  const xmlRows = data.map((part) => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(part.nome)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(part.codigo_interno || "")}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(part.codigo_oem || "")}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(part.categoria_nome || "")}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(part.veiculo_info || "")}</Data></Cell>
      <Cell><Data ss:Type="String">${formatCondition(part.condicao)}</Data></Cell>
      <Cell><Data ss:Type="Number">${part.quantidade}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(part.localizacao || "")}</Data></Cell>
      <Cell><Data ss:Type="Number">${part.preco_custo ?? ""}</Data></Cell>
      <Cell><Data ss:Type="Number">${part.preco_venda ?? ""}</Data></Cell>
      <Cell><Data ss:Type="String">${formatStatus(part.status)}</Data></Cell>
    </Row>
  `).join("");

  const headerRow = `
    <Row ss:StyleID="Header">
      ${headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("")}
    </Row>
  `;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Peças">
    <Table>
      ${headerRow}
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  downloadBlob(blob, `${filename}.xls`);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
