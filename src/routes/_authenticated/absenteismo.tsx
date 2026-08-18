import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppLayout";
import { ImportDialog, type ImportConfig } from "@/components/ImportDialog";
import { FuncionarioSelect } from "@/components/FuncionarioInfo";
import { useAuth } from "@/hooks/useAuth";
import { nomeById, useAux, useFuncionarios } from "@/lib/queries";
import {
  formatMesBR,
  hhmmssToSeconds,
  normalize,
  normalizeText,
  parseExcelDate,
  percent,
  secondsToHHMMSS,
} from "@/lib/rh";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/absenteismo")({
  head: () => ({
    meta: [
      { title: "Absenteísmo | Sistema RH/DP" },
      {
        name: "description",
        content:
          "Controle de horas de ausência e horas previstas com conversão decimal e % de absenteísmo.",
      },
      { property: "og:title", content: "Absenteísmo | Sistema RH/DP" },
      {
        property: "og:description",
        content:
          "Controle de horas de ausência e horas previstas com conversão decimal e % de absenteísmo.",
      },
    ],
  }),
  component: AbsenteismoPage,
});

type Registro = {
  id: string;
  mes: string;
  funcionario_id: string;
  setor: string | null;
  horas_ausencia_txt: string;
  horas_previstas_txt: string;
  horas_ausencia_num: number | null;
  horas_previstas_num: number | null;
  percentual_absenteismo: number | null;
};

function AbsenteismoPage() {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const { data: funcionarios = [] } = useFuncionarios();
  const projetos = useAux("projetos");

  const [fMes, setFMes] = useState("");
  const [fSetor, setFSetor] = useState("");
  const [fFuncionario, setFFuncionario] = useState("");
  const [fPctMin, setFPctMin] = useState("");
  const [fPctMax, setFPctMax] = useState("");

  const [open, setOpen] = useState(false);
  const [mes, setMes] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [setor, setSetor] = useState("");
  const [ausencia, setAusencia] = useState("00:00:00");
  const [previstas, setPrevistas] = useState("00:00:00");

  const { data: registros = [] } = useQuery({
    queryKey: ["absenteismo"],
    queryFn: async (): Promise<Registro[]> => {
      const { data, error } = await supabase
        .from("absenteismo")
        .select(
          "id, mes, funcionario_id, setor, horas_ausencia_txt, horas_previstas_txt, horas_ausencia_num, horas_previstas_num, percentual_absenteismo",
        )
        .order("mes", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const segAus = hhmmssToSeconds(ausencia);
  const segPrev = hhmmssToSeconds(previstas);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!mes || !funcionarioId) {
      toast.error("Informe mês e funcionário.");
      return;
    }
    if (segAus === null || segPrev === null) {
      toast.error("Horas devem estar no formato HH:MM:SS.");
      return;
    }
    const { error } = await supabase.from("absenteismo").insert({
      mes: `${mes}-01`,
      funcionario_id: funcionarioId,
      setor: normalizeText(setor) || null,
      horas_ausencia_txt: ausencia,
      horas_previstas_txt: previstas,
      horas_ausencia_seg: segAus,
      horas_previstas_seg: segPrev,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registro salvo.");
    setOpen(false);
    setMes("");
    setFuncionarioId("");
    setSetor("");
    setAusencia("00:00:00");
    setPrevistas("00:00:00");
    void qc.invalidateQueries({ queryKey: ["absenteismo"] });
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("absenteismo").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["absenteismo"] });
  }

  const filtrados = useMemo(() => {
    const min = fPctMin === "" ? null : Number(fPctMin) / 100;
    const max = fPctMax === "" ? null : Number(fPctMax) / 100;
    return registros.filter((r) => {
      const f = funcionarios.find((x) => x.id === r.funcionario_id);
      const setorValor = (r.setor ?? nomeById(projetos.data, f?.projeto_id) ?? "").toLowerCase();
      const pct = Number(r.percentual_absenteismo ?? 0);
      return (
        (!fMes || r.mes.slice(0, 7) === fMes) &&
        (!fSetor || setorValor.includes(fSetor.toLowerCase())) &&
        (!fFuncionario || (f?.nome ?? "").toLowerCase().includes(fFuncionario.toLowerCase())) &&
        (min === null || pct >= min) &&
        (max === null || pct <= max)
      );
    });
  }, [registros, funcionarios, projetos.data, fMes, fSetor, fFuncionario, fPctMin, fPctMax]);

  const porMes = useMemo(() => {
    const map = new Map<string, { soma: number; qtd: number }>();
    for (const r of filtrados) {
      const key = r.mes.slice(0, 7);
      const cur = map.get(key) ?? { soma: 0, qtd: 0 };
      cur.soma += Number(r.percentual_absenteismo ?? 0) * 100;
      cur.qtd += 1;
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ mes: formatMesBR(key + "-01"), pct: Number((v.soma / v.qtd).toFixed(1)) }));
  }, [filtrados]);

  const importConfig: ImportConfig = useMemo(
    () => ({
      table: "absenteismo",
      label: "Absenteísmo",
      requiredColumns: ["MES", "FUNCIONARIO", "HORAS DE AUSENCIAS", "HORAS PREVISTAS"],
      invalidateKeys: ["absenteismo"],
      mapRow: (raw) => {
        const errors: string[] = [];
        const mesValor = parseExcelDate(raw["MES"] ?? raw["MÊS"]);
        if (!mesValor) errors.push("coluna MES: data inválida");
        const nome = normalize(raw["FUNCIONARIO"]);
        const func = funcionarios.find((f) => f.nome.trim().toLowerCase() === nome.toLowerCase());
        if (!func) errors.push(`coluna FUNCIONARIO: '${nome}' não encontrado no cadastro mestre`);

        const toSeconds = (col: string) => {
          const value = raw[col] ?? raw[col.replace("AUSENCIAS", "AUSÊNCIAS")];
          if (typeof value === "number") return Math.round(value * 86400);
          const s = hhmmssToSeconds(String(value ?? ""));
          if (s === null) errors.push(`coluna ${col}: use o formato HH:MM:SS`);
          return s;
        };
        const aus = toSeconds("HORAS DE AUSENCIAS");
        const prev = toSeconds("HORAS PREVISTAS");

        return {
          errors,
          row:
            errors.length > 0
              ? null
              : {
                  mes: mesValor,
                  funcionario_id: func!.id,
                  setor: normalizeText(raw["SETOR"]) || null,
                  horas_ausencia_txt: secondsToHHMMSS(aus!),
                  horas_previstas_txt: secondsToHHMMSS(prev!),
                  horas_ausencia_seg: aus,
                  horas_previstas_seg: prev,
                },
        };
      },
    }),
    [funcionarios],
  );

  return (
    <>
      <PageHeader
        title="Absenteísmo"
        description="As horas em HH:MM:SS são convertidas em dias decimais (segundos ÷ 86400) e gravadas no banco."
      >
        <ImportDialog config={importConfig} disabled={!canEdit} />
        <Button onClick={() => setOpen(true)} disabled={!canEdit}>
          <Plus className="size-4" /> Novo registro
        </Button>
      </PageHeader>

      {porMes.length > 0 && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            % médio de absenteísmo por mês
          </p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="pct" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="month" value={fMes} onChange={(e) => setFMes(e.target.value)} />
        <Input
          placeholder="Setor"
          value={fSetor}
          onChange={(e) => setFSetor(e.target.value)}
        />
        <Input
          placeholder="Funcionário"
          value={fFuncionario}
          onChange={(e) => setFFuncionario(e.target.value)}
        />
        <Input
          type="number"
          placeholder="% mínimo"
          value={fPctMin}
          onChange={(e) => setFPctMin(e.target.value)}
        />
        <Input
          type="number"
          placeholder="% máximo"
          value={fPctMax}
          onChange={(e) => setFPctMax(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Horas de ausências</TableHead>
              <TableHead>Horas previstas</TableHead>
              <TableHead>Ausências (nº)</TableHead>
              <TableHead>Previstas (nº)</TableHead>
              <TableHead>% Absenteísmo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((r) => {
              const f = funcionarios.find((x) => x.id === r.funcionario_id);
              return (
                <TableRow key={r.id}>
                  <TableCell>{formatMesBR(r.mes)}</TableCell>
                  <TableCell className="font-medium">{f?.nome ?? "—"}</TableCell>
                  <TableCell>{r.setor ?? nomeById(projetos.data, f?.projeto_id)}</TableCell>
                  <TableCell>{r.horas_ausencia_txt}</TableCell>
                  <TableCell>{r.horas_previstas_txt}</TableCell>
                  <TableCell>{Number(r.horas_ausencia_num ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.horas_previstas_num ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">
                    {percent(r.percentual_absenteismo)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => void excluir(r.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  Nenhum registro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo registro de absenteísmo</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <FuncionarioSelect
                value={funcionarioId}
                onChange={(id) => {
                  setFuncionarioId(id);
                  const f = funcionarios.find((x) => x.id === id);
                  setSetor(nomeById(projetos.data, f?.projeto_id).replace("—", ""));
                }}
                funcionarios={funcionarios}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Setor (projeto do colaborador)</Label>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor/projeto" />
                </SelectTrigger>
                <SelectContent>
                  {(projetos.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.nome}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horas de ausências (HH:MM:SS)</Label>
              <Input
                value={ausencia}
                onChange={(e) => setAusencia(e.target.value)}
                placeholder="02:43:00"
              />
            </div>
            <div className="space-y-2">
              <Label>Horas previstas (HH:MM:SS)</Label>
              <Input
                value={previstas}
                onChange={(e) => setPrevistas(e.target.value)}
                placeholder="176:00:00"
              />
            </div>
            <div className="space-y-2">
              <Label>Ausências (número, calculado)</Label>
              <Input
                readOnly
                className="bg-muted"
                value={segAus !== null ? (segAus / 86400).toFixed(2) : "—"}
              />
            </div>
            <div className="space-y-2">
              <Label>Previstas (número, calculado)</Label>
              <Input
                readOnly
                className="bg-muted"
                value={segPrev !== null ? (segPrev / 86400).toFixed(2) : "—"}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>% Absenteísmo (calculado)</Label>
              <Input
                readOnly
                className="bg-muted"
                value={segAus !== null && segPrev ? percent(segAus / segPrev) : "—"}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
