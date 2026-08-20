import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AcessoNegado, PageHeader } from "@/components/AppLayout";
import { ImportDialog, type ImportConfig } from "@/components/ImportDialog";
import { FuncionarioReadOnlyFields, FuncionarioSelect } from "@/components/FuncionarioInfo";
import { useAuth } from "@/hooks/useAuth";
import { nomeById, useAux, useFuncionarios } from "@/lib/queries";
import { STATUS_INFOSCHOOL, STATUS_LABEL, downloadXLSX, formatDateBR, formatMesBR, normalize, normalizeText, parseExcelDate } from "@/lib/rh";
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

export const Route = createFileRoute("/_authenticated/info-school")({
  head: () => ({
    meta: [
      { title: "Info School | Sistema RH/DP" },
      {
        name: "description",
        content: "Acompanhe o status de Info School por colaborador e mês de referência.",
      },
      { property: "og:title", content: "Info School | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Acompanhe o status de Info School por colaborador e mês de referência.",
      },
    ],
  }),
  component: InfoSchoolPage,
});

type Registro = {
  id: string;
  mes: string;
  funcionario_id: string;
  status_infoschool: string | null;
};

function InfoSchoolPage() {
  const { canEdit } = useAuth();
  if (!canEdit) {
    return (
      <AcessoNegado mensagem="Esta área é restrita a editores e administradores. Seu perfil possui acesso somente aos relatórios." />
    );
  }
  return <InfoSchoolPageConteudo />;
}

function InfoSchoolPageConteudo() {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const { data: funcionarios = [] } = useFuncionarios();
  const empresas = useAux("empresas");
  const cargos = useAux("cargos");
  const projetos = useAux("projetos");
  const gestores = useAux("gestores");
  const [open, setOpen] = useState(false);
  const [mes, setMes] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [status, setStatus] = useState("");

  const { data: registros = [] } = useQuery({
    queryKey: ["info_school"],
    queryFn: async (): Promise<Registro[]> => {
      const { data, error } = await supabase
        .from("info_school")
        .select("id, mes, funcionario_id, status_infoschool")
        .order("mes", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const selecionado = funcionarios.find((f) => f.id === funcionarioId);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!mes || !funcionarioId) {
      toast.error("Informe mês e funcionário.");
      return;
    }
    const { error } = await supabase.from("info_school").insert({
      mes: `${mes}-01`,
      funcionario_id: funcionarioId,
      status_infoschool: status || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registro salvo.");
    setOpen(false);
    setMes("");
    setFuncionarioId("");
    setStatus("");
    void qc.invalidateQueries({ queryKey: ["info_school"] });
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("info_school").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["info_school"] });
  }

  function exportar() {
    downloadXLSX(
      "info-school.xlsx",
      registros.map((r) => {
        const f = funcionarios.find((x) => x.id === r.funcionario_id);
        return {
          MES: formatMesBR(r.mes),
          ANO: r.mes.slice(0, 4),
          EMPRESA: nomeById(empresas.data, f?.empresa_id),
          FUNCIONARIO: f?.nome ?? "",
          ADMISSAO: formatDateBR(f?.data_admissao),
          CARGO: nomeById(cargos.data, f?.cargo_id),
          PROJETO: nomeById(projetos.data, f?.projeto_id),
          GESTOR: nomeById(gestores.data, f?.gestor_id),
          "STATUS COLABORADOR": f?.status ?? "",
          "STATUS INFO SCHOOL": r.status_infoschool ?? "",
        };
      }),
      "Info School",
    );
  }

  const importConfig: ImportConfig = useMemo(
    () => ({
      table: "info_school",
      label: "Info School",
      requiredColumns: ["MES", "FUNCIONARIO"],
      invalidateKeys: ["info_school"],
      mapRow: (raw) => {
        const errors: string[] = [];
        const mesValor = parseExcelDate(raw["MES"] ?? raw["MÊS"]);
        if (!mesValor) errors.push("coluna MES: data inválida");
        const nome = normalize(raw["FUNCIONARIO"]);
        const func = funcionarios.find(
          (f) => f.nome.trim().toLowerCase() === nome.toLowerCase(),
        );
        if (!func) errors.push(`coluna FUNCIONARIO: '${nome}' não encontrado no cadastro mestre`);
        return {
          errors,
          row:
            errors.length > 0
              ? null
              : {
                  mes: mesValor,
                  funcionario_id: func!.id,
                  status_infoschool: normalizeText(raw["STATUS INFOSCHOOL"]) || null,
                },
        };
      },
    }),
    [funcionarios],
  );

  return (
    <>
      <PageHeader
        title="Info School"
        description="Os dados do colaborador são preenchidos automaticamente a partir do cadastro mestre."
      >
        <Button variant="outline" onClick={exportar}>
          <Download className="size-4" /> Exportar XLSX
        </Button>
        <ImportDialog config={importConfig} disabled={!canEdit} />
        <Button onClick={() => setOpen(true)} disabled={!canEdit}>
          <Plus className="size-4" /> Novo registro
        </Button>
      </PageHeader>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Status colaborador</TableHead>
              <TableHead>Status Info School</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((r) => {
              const f = funcionarios.find((x) => x.id === r.funcionario_id);
              return (
                <TableRow key={r.id}>
                  <TableCell>{formatMesBR(r.mes)}</TableCell>
                  <TableCell>{r.mes.slice(0, 4)}</TableCell>
                  <TableCell>{nomeById(empresas.data, f?.empresa_id)}</TableCell>
                  <TableCell className="font-medium">{f?.nome ?? "—"}</TableCell>
                  <TableCell>{formatDateBR(f?.data_admissao)}</TableCell>
                  <TableCell>{nomeById(cargos.data, f?.cargo_id)}</TableCell>
                  <TableCell>{nomeById(projetos.data, f?.projeto_id)}</TableCell>
                  <TableCell>{nomeById(gestores.data, f?.gestor_id)}</TableCell>
                  <TableCell>{f ? (STATUS_LABEL[f.status] ?? f.status) : "—"}</TableCell>
                  <TableCell>{r.status_infoschool ?? "—"}</TableCell>
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
                <TableCell colSpan={11} className="text-muted-foreground">
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
            <DialogTitle>Novo registro Info School</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Ano (calculado)</Label>
              <Input readOnly className="bg-muted" value={mes ? mes.slice(0, 4) : ""} />
            </div>
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
              campos={["empresa", "admissao", "cargo", "projeto", "gestor", "status"]}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Status Info School</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_INFOSCHOOL.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
