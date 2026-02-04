export interface ImportedPart {
  nome: string;
  codigo_interno?: string;
  codigo_oem?: string;
  categoria?: string;
  condicao: "nova" | "usada" | "recondicionada";
  quantidade: number;
  localizacao?: string;
  preco_custo?: number;
  preco_venda?: number;
  status: "ativa" | "vendida" | "pausada";
  observacoes?: string;
}

export interface ImportResult {
  data: ImportedPart[];
  errors: { row: number; message: string }[];
}

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value || value.trim() === "") return undefined;
  // Handle Brazilian number format (comma as decimal separator)
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? undefined : num;
};

const parseCondition = (value: string | undefined): "nova" | "usada" | "recondicionada" => {
  if (!value) return "usada";
  const normalized = value.toLowerCase().trim();
  if (normalized === "nova" || normalized === "new") return "nova";
  if (normalized === "recondicionada" || normalized === "refurbished") return "recondicionada";
  return "usada";
};

const parseStatus = (value: string | undefined): "ativa" | "vendida" | "pausada" => {
  if (!value) return "ativa";
  const normalized = value.toLowerCase().trim();
  if (normalized === "vendida" || normalized === "sold") return "vendida";
  if (normalized === "pausada" || normalized === "paused") return "pausada";
  return "ativa";
};

export function parseCSV(content: string): ImportResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const errors: { row: number; message: string }[] = [];
  const data: ImportedPart[] = [];

  if (lines.length < 2) {
    return { data: [], errors: [{ row: 0, message: "Arquivo vazio ou sem dados" }] };
  }

  // Parse header (support both ; and , as separator)
  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map((h) => 
    h.trim().toLowerCase().replace(/"/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );

  // Map header names to expected fields
  const headerMap: Record<string, string> = {
    nome: "nome",
    name: "nome",
    "codigo interno": "codigo_interno",
    "codigo_interno": "codigo_interno",
    "internal code": "codigo_interno",
    "codigo oem": "codigo_oem",
    "codigo_oem": "codigo_oem",
    "oem code": "codigo_oem",
    oem: "codigo_oem",
    categoria: "categoria",
    category: "categoria",
    condicao: "condicao",
    condition: "condicao",
    quantidade: "quantidade",
    qty: "quantidade",
    quantity: "quantidade",
    localizacao: "localizacao",
    location: "localizacao",
    local: "localizacao",
    "preco custo": "preco_custo",
    "preco_custo": "preco_custo",
    "cost price": "preco_custo",
    custo: "preco_custo",
    "preco venda": "preco_venda",
    "preco_venda": "preco_venda",
    "sale price": "preco_venda",
    preco: "preco_venda",
    price: "preco_venda",
    status: "status",
    observacoes: "observacoes",
    observations: "observacoes",
    notes: "observacoes",
  };

  const columnIndexes: Record<string, number> = {};
  headers.forEach((header, index) => {
    const mapped = headerMap[header];
    if (mapped) {
      columnIndexes[mapped] = index;
    }
  });

  if (columnIndexes.nome === undefined) {
    errors.push({ row: 1, message: "Coluna 'Nome' é obrigatória" });
    return { data: [], errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV values (handle quoted values)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""));

    const getValue = (field: string): string | undefined => {
      const index = columnIndexes[field];
      return index !== undefined ? values[index] : undefined;
    };

    const nome = getValue("nome");
    if (!nome) {
      errors.push({ row: i + 1, message: "Nome é obrigatório" });
      continue;
    }

    const quantidade = parseNumber(getValue("quantidade")) ?? 1;
    if (quantidade < 0) {
      errors.push({ row: i + 1, message: "Quantidade não pode ser negativa" });
      continue;
    }

    const precoCusto = parseNumber(getValue("preco_custo"));
    const precoVenda = parseNumber(getValue("preco_venda"));

    data.push({
      nome,
      codigo_interno: getValue("codigo_interno"),
      codigo_oem: getValue("codigo_oem"),
      categoria: getValue("categoria"),
      condicao: parseCondition(getValue("condicao")),
      quantidade,
      localizacao: getValue("localizacao"),
      preco_custo: precoCusto,
      preco_venda: precoVenda,
      status: parseStatus(getValue("status")),
      observacoes: getValue("observacoes"),
    });
  }

  return { data, errors };
}

export function parseExcelXML(content: string): ImportResult {
  const errors: { row: number; message: string }[] = [];
  const data: ImportedPart[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/xml");
    const rows = doc.querySelectorAll("Row");

    if (rows.length < 2) {
      return { data: [], errors: [{ row: 0, message: "Arquivo vazio ou sem dados" }] };
    }

    // Parse headers from first row
    const headerRow = rows[0];
    const headerCells = headerRow.querySelectorAll("Cell Data");
    const headers: string[] = [];
    headerCells.forEach((cell) => {
      headers.push(
        (cell.textContent || "")
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );
    });

    const headerMap: Record<string, string> = {
      nome: "nome",
      "codigo interno": "codigo_interno",
      "codigo oem": "codigo_oem",
      categoria: "categoria",
      condicao: "condicao",
      quantidade: "quantidade",
      localizacao: "localizacao",
      "preco custo": "preco_custo",
      "preco venda": "preco_venda",
      status: "status",
      observacoes: "observacoes",
    };

    const columnIndexes: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mapped = headerMap[header];
      if (mapped) {
        columnIndexes[mapped] = index;
      }
    });

    if (columnIndexes.nome === undefined) {
      errors.push({ row: 1, message: "Coluna 'Nome' é obrigatória" });
      return { data: [], errors };
    }

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll("Cell Data");
      const values: string[] = [];
      cells.forEach((cell) => values.push(cell.textContent || ""));

      const getValue = (field: string): string | undefined => {
        const index = columnIndexes[field];
        return index !== undefined ? values[index] : undefined;
      };

      const nome = getValue("nome");
      if (!nome) {
        errors.push({ row: i + 1, message: "Nome é obrigatório" });
        continue;
      }

      const quantidade = parseNumber(getValue("quantidade")) ?? 1;

      data.push({
        nome,
        codigo_interno: getValue("codigo_interno"),
        codigo_oem: getValue("codigo_oem"),
        categoria: getValue("categoria"),
        condicao: parseCondition(getValue("condicao")),
        quantidade,
        localizacao: getValue("localizacao"),
        preco_custo: parseNumber(getValue("preco_custo")),
        preco_venda: parseNumber(getValue("preco_venda")),
        status: parseStatus(getValue("status")),
        observacoes: getValue("observacoes"),
      });
    }
  } catch (e) {
    errors.push({ row: 0, message: "Erro ao processar arquivo Excel" });
  }

  return { data, errors };
}

export async function parseFile(file: File): Promise<ImportResult> {
  const content = await file.text();
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv" || extension === "txt") {
    return parseCSV(content);
  } else if (extension === "xls" || extension === "xml") {
    return parseExcelXML(content);
  } else {
    return {
      data: [],
      errors: [{ row: 0, message: "Formato de arquivo não suportado. Use CSV ou XLS." }],
    };
  }
}

export const sampleCSVContent = `Nome;Código Interno;Código OEM;Categoria;Condição;Quantidade;Localização;Preço Custo;Preço Venda;Status;Observações
Farol Dianteiro Esquerdo;FAR-001;33150-T2A-A01;Iluminação;Usada;2;A1-B2;150,00;350,00;Ativa;Bom estado
Bomba de Combustível;BOMB-002;17045-S84-A32;Motor;Nova;5;C3-D4;280,00;450,00;Ativa;Original
Para-choque Traseiro;PCHT-003;;Carroceria;Usada;1;E5-F6;200,00;400,00;Ativa;Pequenos arranhões`;

export function downloadSampleCSV(): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + sampleCSVContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo_importacao_pecas.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
