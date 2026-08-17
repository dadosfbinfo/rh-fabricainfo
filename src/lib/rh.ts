import * as XLSX from "xlsx";

export const TIPOS_COLABORADOR = ["OPERACAO", "ADM", "CLIENTE", "CLIENTE VIP"] as const;
export const STATUS_FUNCIONARIO = ["ATIVO", "DESLIGADO", "FERIAS", "LICENCA"] as const;
export const STATUS_INFOSCHOOL = ["FEZ", "NÃO FEZ", "EM ANDAMENTO"] as const;

export const STATUS_LABEL: Record<string, string> = {
  ATIVO: "Ativo",
  DESLIGADO: "Desligado",
  FERIAS: "Férias",
  LICENCA: "Licença",
};

export function hhmmssToSeconds(value: string): number | null {
  const v = (value ?? "").trim();
  const m = /^(\d{1,4}):([0-5]?\d):([0-5]?\d)$/.exec(v);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function secondsToHHMMSS(total: number): string {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Anos de casa: (desligamento ou hoje) - admissão, em anos com 1 casa. */
export function anosDeCasa(
  admissao?: string | null,
  desligamento?: string | null,
  status?: string | null,
): number | null {
  if (!admissao) return null;
  const start = new Date(admissao + "T00:00:00");
  const end =
    status === "DESLIGADO" && desligamento ? new Date(desligamento + "T00:00:00") : new Date();
  const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.round(years * 10) / 10);
}

export function formatDateBR(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatMesBR(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m] = iso.slice(0, 10).split("-");
  return `${m}/${y}`;
}

const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function diaDaSemana(iso?: string | null): string {
  if (!iso) return "—";
  return DIAS[new Date(iso.slice(0, 10) + "T00:00:00").getDay()] ?? "—";
}

export function anoDe(iso?: string | null): string {
  return iso ? iso.slice(0, 4) : "—";
}

export function percent(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

/**
 * Padronização global de texto livre: MAIÚSCULAS, sem espaços duplos, sem espaços nas pontas.
 * Usar em formulários, importação e exportação.
 */
export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Aplica normalizeText em todos os valores string de um objeto (usado na exportação). */
export function normalizeRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[k] = typeof v === "string" ? normalizeText(v) : v;
  return out;
}

export function normalize(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeKey(value: unknown): string {
  return normalize(value)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Converte valores de célula do Excel (Date, serial number ou texto) em ISO yyyy-mm-dd */
export function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    const d = value;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number") {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const text = normalize(value);
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(text);
  if (br) {
    const year = br[3]!.length === 2 ? `20${br[3]}` : br[3]!;
    return `${year}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return text.slice(0, 10);
  return null;
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const text = normalize(value).replace(/\./g, "").replace(",", ".");
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function downloadXLSX(filename: string, rows: Record<string, unknown>[], sheet = "Dados") {
  if (rows.length === 0) return;
  const data = rows.map((r) => normalizeRow(r));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheet);
  XLSX.writeFile(wb, filename);
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  rows = rows.map((r) => normalizeRow(r));
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
