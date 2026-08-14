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
import {
  STATUS_LABEL,
  anosDeCasa,
  formatDateBR,
  normalize,
  parseExcelDate,
  parseNumber,
} from "@/lib/rh";
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

export const Route = createFileRoute("/_authenticated/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliação de desempenho | Sistema RH/DP" },
      {
        name: "description",
        content: "Registre notas de hard e soft skills com nota final calculada automaticamente.",
      },
      { property: "og:title", content: "Avaliação de desempenho | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Registre notas de hard e soft skills com nota final calculada automaticamente.",
      },
    ],
  }),
  component: AvaliacoesPage,
});

type Avaliacao = {
  id: string;
  funcionario_id: string;
  data_avaliacao: string;
  hard_skill: number | null;
  soft_skill: number | null;
  nota_final: number | null;
};

function AvaliacoesPage() {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const { data: funcionarios = [] } = useFuncionarios();
  const empresas = useAux("empresas");
  const cargos = useAux("cargos");
  const projetos = useAux("projetos");
  const gestores = useAux("gestores");

  const [open, setOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [data, setData] = useState("");
  const [hard, setHard] = useState("");
  const [soft, setSoft] = useState("");

  const { data: registros = [] } = useQuery({
    queryKey: ["avaliacao_desempenho"],
    queryFn: async (): Promise<Avaliacao[]> => {
      const { data: rows, error } = await supabase
        .from("avaliacao_desempenho")
        .select("id, funcionario_id, data_avaliacao, hard_skill, soft_skill, nota_final")
        .order("data_avaliacao", { ascending: false });
      if (error) throw error;
      return rows ?? [];
    },
  });

  const selecionado = funcionarios.find((f) => f.id === funcionarioId);
  const notaFinal =
    hard !== "" || soft !== "" ? ((Number(hard || 0) + Number(soft || 0)) / 2).toFixed(2) : "";

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!funcionarioId || !data) {
      toast.error("Informe funcionário e data da avaliação.");
      return;
    }
    const { error } = await supabase.from("avaliacao_desempenho").insert({
      funcionario_id: funcionarioId,
      data_avaliacao: data,
      hard_skill: hard === "" ? null : Number(hard),
      soft_skill: soft === "" ? null : Number(soft),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Avaliação registrada.");
    setOpen(false);
    setFuncionarioId("");
    setData("");
    setHard("");
    setSoft("");
    void qc.invalidateQueries({ queryKey: ["avaliacao_desempenho"] });
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("avaliacao_desempenho").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["avaliacao_desempenho"] });
  }

  const importConfig: ImportConfig = useMemo(
    () => ({
      table: "avaliacao_desempenho",
      label: "Avaliação de desempenho",
      requiredColumns: ["FUNCIONARIO", "DATA DA AVALIACAO"],
      invalidateKeys: ["avaliacao_desempenho"],
      mapRow: (raw) => {
        const errors: string[] = [];
        const nome = normalize(raw["FUNCIONARIO"]);
        const func = funcionarios.find((f) => f.nome.trim().toLowerCase() === nome.toLowerCase());
        if (!func) errors.push(`coluna FUNCIONARIO: '${nome}' não encontrado no cadastro mestre`);
        const dataAval = parseExcelDate(raw["DATA DA AVALIACAO"] ?? raw["DATA DA AVALIAÇÃO"]);
        if (!dataAval) errors.push("coluna DATA DA AVALIACAO: data inválida");
        const h = parseNumber(raw["HARD SKILL"]);
        const s = parseNumber(raw["SOFT SKILL"]);
        if (raw["HARD SKILL"] !== "" && h === null) errors.push("coluna HARD SKILL: número inválido");
        if (raw["SOFT SKILL"] !== "" && s === null) errors.push("coluna SOFT SKILL: número inválido");
        return {
          errors,
          row:
            errors.length > 0
              ? null
              : {
                  funcionario_id: func!.id,
                  data_avaliacao: dataAval,
                  hard_skill: h,
                  soft_skill: s,
                },
        };
      },
    }),
    [funcionarios],
  );

  return (
    <>
      <PageHeader
        title="Avaliação de desempenho"
        description="Nota final = média simples entre Hard Skill e Soft Skill."
      >
        <ImportDialog config={importConfig} disabled={!canEdit} />
        <Button onClick={() => setOpen(true)} disabled={!canEdit}>
          <Plus className="size-4" /> Nova avaliação
        </Button>
      </PageHeader>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Anos de casa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Desligamento</TableHead>
              <TableHead>Data avaliação</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Hard</TableHead>
              <TableHead>Soft</TableHead>
              <TableHead>Nota final</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((r) => {
              const f = funcionarios.find((x) => x.id === r.funcionario_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{f?.nome ?? "—"}</TableCell>
                  <TableCell>{nomeById(empresas.data, f?.empresa_id)}</TableCell>
                  <TableCell>{formatDateBR(f?.data_admissao)}</TableCell>
                  <TableCell>
                    {anosDeCasa(f?.data_admissao, f?.data_desligamento, f?.status) ?? "—"}
                  </TableCell>
                  <TableCell>{nomeById(cargos.data, f?.cargo_id)}</TableCell>
                  <TableCell>{nomeById(projetos.data, f?.projeto_id)}</TableCell>
                  <TableCell>{nomeById(gestores.data, f?.gestor_id)}</TableCell>
                  <TableCell>{f ? (STATUS_LABEL[f.status] ?? f.status) : "—"}</TableCell>
                  <TableCell>{formatDateBR(f?.data_desligamento)}</TableCell>
                  <TableCell>{formatDateBR(r.data_avaliacao)}</TableCell>
                  <TableCell>{r.data_avaliacao.slice(0, 4)}</TableCell>
                  <TableCell>{r.hard_skill ?? "—"}</TableCell>
                  <TableCell>{r.soft_skill ?? "—"}</TableCell>
                  <TableCell className="font-semibold">
                    {r.nota_final !== null ? Number(r.nota_final).toFixed(2) : "—"}
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
            {registros.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="text-muted-foreground">
                  Nenhuma avaliação registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova avaliação</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            <div className="space-y-2 sm:col-span-2">
              <Label>Funcionário</Label>
              <FuncionarioSelect
                value={funcionarioId}
                onChange={setFuncionarioId}
                funcionarios={funcionarios}
              />
            </div>
            <FuncionarioReadOnlyFields
              funcionario={selecionado}
              campos={[
                "empresa",
                "admissao",
                "anos",
                "cargo",
                "projeto",
                "gestor",
                "status",
                "desligamento",
              ]}
            />
            <div className="space-y-2">
              <Label>Data da avaliação</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Ano (calculado)</Label>
              <Input readOnly className="bg-muted" value={data ? data.slice(0, 4) : ""} />
            </div>
            <div className="space-y-2">
              <Label>Hard skill (0 a 5)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={hard}
                onChange={(e) => setHard(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Soft skill (0 a 5)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={soft}
                onChange={(e) => setSoft(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Nota final (calculada)</Label>
              <Input readOnly className="bg-muted" value={notaFinal} />
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
