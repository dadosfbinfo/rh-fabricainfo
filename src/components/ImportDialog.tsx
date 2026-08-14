import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { normalize } from "@/lib/rh";
import { useQueryClient } from "@tanstack/react-query";

export type ImportRowResult = { row: Record<string, unknown> | null; errors: string[] };

export type ImportConfig = {
  table: string;
  label: string;
  requiredColumns: string[];
  /** Recebe a linha bruta (chaves = cabeçalho) e devolve a linha pronta para gravar ou erros. */
  mapRow: (raw: Record<string, unknown>) => ImportRowResult;
  invalidateKeys: string[];
};

type Parsed = { line: number; original: Record<string, unknown>; result: ImportRowResult };

export function ImportDialog({ config, disabled }: { config: ImportConfig; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Parsed[]>([]);
  const [fileName, setFileName] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]!]!;
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const headers = Object.keys(json[0] ?? {}).map((h) => normalize(h).toUpperCase());
    const faltando = config.requiredColumns.filter((c) => !headers.includes(c));
    setMissing(faltando);
    setRows(
      json.map((raw, i) => {
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(raw)) {
          clean[normalize(k).toUpperCase()] = typeof v === "string" ? normalize(v) : v;
        }
        return { line: i + 2, original: clean, result: config.mapRow(clean) };
      }),
    );
  }

  const ok = rows.filter((r) => r.result.errors.length === 0);
  const bad = rows.filter((r) => r.result.errors.length > 0);

  async function confirmar() {
    if (missing.length > 0 || ok.length === 0) return;
    setSaving(true);
    const payload = ok.map((r) => r.result.row!);
    const { error } = await supabase.from(config.table).insert(payload as never);
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    await supabase.from("import_logs").insert({
      tabela: config.table,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      linhas_importadas: ok.length,
      linhas_erro: bad.length,
      arquivo: fileName,
    });
    setSaving(false);
    toast.success(`${ok.length} linha(s) importada(s).`);
    config.invalidateKeys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] }));
    void qc.invalidateQueries({ queryKey: ["import_logs"] });
    setRows([]);
    setFileName("");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setRows([]);
          setMissing([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Upload className="size-4" /> Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Excel — {config.label}</DialogTitle>
          <DialogDescription>
            Colunas obrigatórias: {config.requiredColumns.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFile}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />

        {missing.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Colunas obrigatórias ausentes no arquivo: {missing.join(", ")}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex gap-2 text-sm">
              <Badge className="bg-success text-success-foreground">
                {ok.length} prontas para importar
              </Badge>
              <Badge variant="destructive">{bad.length} com erro (serão ignoradas)</Badge>
            </div>

            {bad.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-3 text-xs text-destructive">
                {bad.map((r) => (
                  <li key={r.line}>
                    Linha {r.line}: {r.result.errors.join(" • ")}
                  </li>
                ))}
              </ul>
            )}

            <div className="max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Linha</th>
                    {Object.keys(rows[0]!.original).map((h) => (
                      <th key={h} className="p-2 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.line}
                      className={
                        r.result.errors.length > 0
                          ? "bg-destructive/10"
                          : "bg-success/10 border-t border-border"
                      }
                    >
                      <td className="p-2">{r.line}</td>
                      {Object.keys(rows[0]!.original).map((h) => (
                        <td key={h} className="p-2 whitespace-nowrap">
                          {String(r.original[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              onClick={() => void confirmar()}
              disabled={saving || ok.length === 0 || missing.length > 0}
            >
              Confirmar importação de {ok.length} linha(s)
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
