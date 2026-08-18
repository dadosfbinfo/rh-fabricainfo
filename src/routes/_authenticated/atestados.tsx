import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppLayout";
import { ImportDialog, type ImportConfig } from "@/components/ImportDialog";
import { FuncionarioReadOnlyFields, FuncionarioSelect } from "@/components/FuncionarioInfo";
import { useAuth } from "@/hooks/useAuth";
import { nomeById, useAux, useFuncionarios } from "@/lib/queries";
import { diaDaSemana, formatDateBR, normalize, parseExcelDate, parseNumber } from "@/lib/rh";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/atestados")({
  head: () => ({
    meta: [
      { title: "Atestados | Sistema RH/DP" },
      {
        name: "description",
        content: "Registre atestados médicos por colaborador com CID, data e dia da semana.",
      },
      { property: "og:title", content: "Atestados | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Registre atestados médicos por colaborador com CID, data e dia da semana.",
      },
    ],
  }),
  component: AtestadosPage,
});

type Atestado = {
  id: string;
  funcionario_id: string;
  cid: string | null;
  data: string;
  total_dias: number | null;
};

function AtestadosPage() {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const { data: funcionarios = [] } = useFuncionarios();
  const projetos = useAux("projetos");

  const [open, setOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [cid, setCid] = useState("");
  const [data, setData] = useState("");
  const [dias, setDias] = useState("");

  const { data: registros = [] } = useQuery({
    queryKey: ["atestado"],
    queryFn: async (): Promise<Atestado[]> => {
      const { data: rows, error } = await supabase
        .from("atestado")
        .select("id, funcionario_id, cid, data, total_dias")
        .order("data", { ascending: false });
      if (error) throw error;
      return rows ?? [];
    },
  });

  const selecionado = funcionarios.find((f) => f.id === funcionarioId);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!funcionarioId || !data) {
      toast.error("Informe colaborador e data.");
      return;
    }
    const { error } = await supabase.from("atestado").insert({
      funcionario_id: funcionarioId,
      cid: cid.trim() || null,
      data,
      total_dias: dias === "" ? null : Number(dias),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Atestado registrado.");
    setOpen(false);
    setFuncionarioId("");
    setCid("");
    setData("");
    setDias("");
    void qc.invalidateQueries({ queryKey: ["atestado"] });
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("atestado").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["atestado"] });
  }

  const importConfig: ImportConfig = useMemo(
    () => ({
      table: "atestado",
      label: "Atestado",
      requiredColumns: ["COLABORADOR", "DATA"],
      invalidateKeys: ["atestado"],
      mapRow: (raw) => {
        const errors: string[] = [];
        const nome = normalize(raw["COLABORADOR"]);
        const func = funcionarios.find((f) => f.nome.trim().toLowerCase() === nome.toLowerCase());
        if (!func) errors.push(`coluna COLABORADOR: '${nome}' não encontrado no cadastro mestre`);
        const dataValor = parseExcelDate(raw["DATA"]);
        if (!dataValor) errors.push("coluna DATA: data inválida");
        const total = parseNumber(raw["TOTAL DE DIAS"]);
        return {
          errors,
          row:
            errors.length > 0
              ? null
              : {
                  funcionario_id: func!.id,
                  cid: normalizeText(raw["CID"]) || null,
                  data: dataValor,
                  total_dias: total,
                },
        };
      },
    }),
    [funcionarios],
  );

  return (
    <>
      <PageHeader
        title="Atestado"
        description="O projeto e o dia da semana são preenchidos automaticamente."
      >
        <ImportDialog config={importConfig} disabled={!canEdit} />
        <Button onClick={() => setOpen(true)} disabled={!canEdit}>
          <Plus className="size-4" /> Novo atestado
        </Button>
      </PageHeader>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>CID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Dia da semana</TableHead>
              <TableHead>Total de dias</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((r) => {
              const f = funcionarios.find((x) => x.id === r.funcionario_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{f?.nome ?? "—"}</TableCell>
                  <TableCell>{nomeById(projetos.data, f?.projeto_id)}</TableCell>
                  <TableCell>{r.cid ?? "—"}</TableCell>
                  <TableCell>{formatDateBR(r.data)}</TableCell>
                  <TableCell>{diaDaSemana(r.data)}</TableCell>
                  <TableCell>{r.total_dias ?? "—"}</TableCell>
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
            {registros.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Nenhum atestado registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo atestado</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            <div className="space-y-2 sm:col-span-2">
              <Label>Colaborador</Label>
              <FuncionarioSelect
                value={funcionarioId}
                onChange={setFuncionarioId}
                funcionarios={funcionarios}
              />
            </div>
            <FuncionarioReadOnlyFields funcionario={selecionado} campos={["projeto"]} />
            <div className="space-y-2">
              <Label>CID</Label>
              <Input value={cid} onChange={(e) => setCid(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Dia da semana (calculado)</Label>
              <Input readOnly className="bg-muted" value={data ? diaDaSemana(data) : ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Total de dias</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
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
