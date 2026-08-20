import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AcessoNegado, PageHeader } from "@/components/AppLayout";
import { ImportDialog, type ImportConfig } from "@/components/ImportDialog";
import { useAuth } from "@/hooks/useAuth";
import { idByNome, nomeById, useAux, useFuncionarios, type Funcionario } from "@/lib/queries";
import {
  STATUS_FUNCIONARIO,
  STATUS_LABEL,
  TIPOS_COLABORADOR,
  anosDeCasa,
  downloadXLSX,
  formatDateBR,
  normalizeKey,
  normalizeText,
  parseExcelDate,
} from "@/lib/rh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários | Sistema RH/DP" },
      {
        name: "description",
        content: "Cadastro mestre de funcionários com filtros, importação de Excel e exportação.",
      },
      { property: "og:title", content: "Funcionários | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Cadastro mestre de funcionários com filtros, importação de Excel e exportação.",
      },
    ],
  }),
  component: FuncionariosPage,
});

const PAGE_SIZE = 15;
const ALL = "__all__";

const emptyForm = {
  empresa_id: "",
  nome: "",
  data_admissao: "",
  cargo_id: "",
  projeto_id: "",
  gestor_id: "",
  tipo_colaborador: "",
  status: "ATIVO",
  data_desligamento: "",
};

function FuncionariosPage() {
  const { canEdit } = useAuth();
  if (!canEdit) {
    return (
      <AcessoNegado mensagem="Esta área é restrita a editores e administradores. Seu perfil possui acesso somente aos relatórios." />
    );
  }
  return <FuncionariosPageConteudo />;
}

function FuncionariosPageConteudo() {
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const { data: funcionarios = [], isLoading } = useFuncionarios();
  const empresas = useAux("empresas");
  const cargos = useAux("cargos");
  const projetos = useAux("projetos");
  const gestores = useAux("gestores");

  const [busca, setBusca] = useState("");
  const [fEmpresa, setFEmpresa] = useState(ALL);
  const [fStatus, setFStatus] = useState(ALL);
  const [fCargo, setFCargo] = useState(ALL);
  const [fProjeto, setFProjeto] = useState(ALL);
  const [fGestor, setFGestor] = useState(ALL);
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtrados = useMemo(
    () =>
      funcionarios.filter(
        (f) =>
          f.nome.toLowerCase().includes(busca.toLowerCase()) &&
          (fEmpresa === ALL || f.empresa_id === fEmpresa) &&
          (fStatus === ALL || f.status === fStatus) &&
          (fCargo === ALL || f.cargo_id === fCargo) &&
          (fProjeto === ALL || f.projeto_id === fProjeto) &&
          (fGestor === ALL || f.gestor_id === fGestor),
      ),
    [funcionarios, busca, fEmpresa, fStatus, fCargo, fProjeto, fGestor],
  );

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pageItems = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function abrirNovo() {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  }

  function abrirEdicao(f: Funcionario) {
    setEditing(f);
    setForm({
      empresa_id: f.empresa_id ?? "",
      nome: f.nome,
      data_admissao: f.data_admissao ?? "",
      cargo_id: f.cargo_id ?? "",
      projeto_id: f.projeto_id ?? "",
      gestor_id: f.gestor_id ?? "",
      tipo_colaborador: f.tipo_colaborador ?? "",
      status: f.status,
      data_desligamento: f.data_desligamento ?? "",
    });
    setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do funcionário.");
      return;
    }
    const payload = {
      empresa_id: form.empresa_id || null,
      nome: normalizeText(form.nome),
      data_admissao: form.data_admissao || null,
      cargo_id: form.cargo_id || null,
      projeto_id: form.projeto_id || null,
      gestor_id: form.gestor_id || null,
      tipo_colaborador: (form.tipo_colaborador || null) as (typeof TIPOS_COLABORADOR)[number] | null,
      status: form.status as (typeof STATUS_FUNCIONARIO)[number],
      data_desligamento: form.status === "DESLIGADO" ? form.data_desligamento || null : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from("funcionarios").update(payload).eq("id", editing.id)
      : await supabase.from("funcionarios").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Funcionário atualizado." : "Funcionário cadastrado.");
    setOpen(false);
    void qc.invalidateQueries({ queryKey: ["funcionarios"] });
  }

  async function excluir(f: Funcionario) {
    if (!confirm(`Excluir ${f.nome}? O histórico é preservado (exclusão lógica).`)) return;
    const { error } = await supabase
      .from("funcionarios")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", f.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["funcionarios"] });
  }

  function exportar() {
    downloadXLSX(
      "funcionarios.xlsx",
      filtrados.map((f) => ({
        EMPRESA: nomeById(empresas.data, f.empresa_id),
        FUNCIONARIO: f.nome,
        "DATA DE ADMISSAO": formatDateBR(f.data_admissao),
        "ANOS DE CASA": anosDeCasa(f.data_admissao, f.data_desligamento, f.status) ?? "",
        CARGO: nomeById(cargos.data, f.cargo_id),
        PROJETO: nomeById(projetos.data, f.projeto_id),
        GESTOR: nomeById(gestores.data, f.gestor_id),
        "TIPO COLABORADOR": f.tipo_colaborador ?? "",
        STATUS: f.status,
        "DATA DE DESLIGAMENTO": f.data_desligamento ? formatDateBR(f.data_desligamento) : "",
      })),
    );
  }

  const importConfig: ImportConfig = useMemo(
    () => ({
      table: "funcionarios",
      label: "Funcionários",
      requiredColumns: ["EMPRESA", "FUNCIONARIO", "DATA DE ADMISSAO", "CARGO", "STATUS"],
      invalidateKeys: ["funcionarios"],
      mapRow: (raw) => {
        const errors: string[] = [];
        const get = (k: string) => raw[k] ?? raw[k.replace("ADMISSAO", "ADMISSÃO")] ?? "";
        const nome = String(get("FUNCIONARIO") ?? "").trim();
        if (!nome) errors.push("coluna FUNCIONARIO: valor vazio");

        const lookup = (col: string, list: { id: string; nome: string }[] | undefined) => {
          const valor = String(get(col) ?? "").trim();
          if (!valor) return null;
          const id = idByNome(list, valor);
          if (!id)
            errors.push(
              `coluna ${col}: valor '${valor}' não corresponde a nenhum cadastro auxiliar`,
            );
          return id;
        };

        const empresa_id = lookup("EMPRESA", empresas.data);
        const cargo_id = lookup("CARGO", cargos.data);
        const projeto_id = lookup("PROJETO", projetos.data);
        const gestor_id = lookup("GESTOR", gestores.data);

        const admissao = parseExcelDate(get("DATA DE ADMISSAO"));
        if (get("DATA DE ADMISSAO") && !admissao)
          errors.push("coluna DATA DE ADMISSAO: data inválida");

        const statusRaw = normalizeKey(get("STATUS"));
        const status = STATUS_FUNCIONARIO.find((s) => normalizeKey(s) === statusRaw);
        if (!status) errors.push(`coluna STATUS: valor '${get("STATUS")}' inválido`);

        const tipoRaw = normalizeKey(get("TIPO COLABORADOR"));
        const tipo = tipoRaw ? TIPOS_COLABORADOR.find((t) => normalizeKey(t) === tipoRaw) : null;
        if (tipoRaw && !tipo)
          errors.push(`coluna TIPO COLABORADOR: valor '${get("TIPO COLABORADOR")}' inválido`);

        const deslig = parseExcelDate(get("DATA DE DESLIGAMENTO"));

        return {
          errors,
          row:
            errors.length > 0
              ? null
              : {
                  empresa_id,
                  nome,
                  data_admissao: admissao,
                  cargo_id,
                  projeto_id,
                  gestor_id,
                  tipo_colaborador: tipo ?? null,
                  status,
                  data_desligamento: status === "DESLIGADO" ? deslig : null,
                },
        };
      },
    }),
    [empresas.data, cargos.data, projetos.data, gestores.data],
  );

  const selects = [
    { label: "Empresa", value: fEmpresa, set: setFEmpresa, options: empresas.data ?? [] },
    { label: "Cargo", value: fCargo, set: setFCargo, options: cargos.data ?? [] },
    { label: "Projeto", value: fProjeto, set: setFProjeto, options: projetos.data ?? [] },
    { label: "Gestor", value: fGestor, set: setFGestor, options: gestores.data ?? [] },
  ];

  return (
    <>
      <PageHeader
        title="Funcionários"
        description="Cadastro mestre. Todas as demais abas puxam os dados daqui."
      >
        <Button variant="outline" onClick={exportar}>
          <Download className="size-4" /> Exportar XLSX
        </Button>
        <ImportDialog config={importConfig} disabled={!canEdit} />
        <Button onClick={abrirNovo} disabled={!canEdit}>
          <Plus className="size-4" /> Novo funcionário
        </Button>
      </PageHeader>

      <div className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 xl:grid-cols-6">
        <Input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPage(1);
          }}
        />
        {selects.map((s) => (
          <Select
            key={s.label}
            value={s.value}
            onValueChange={(v) => {
              s.set(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={s.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos — {s.label}</SelectItem>
              {s.options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Select
          value={fStatus}
          onValueChange={(v) => {
            setFStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos — Status</SelectItem>
            {STATUS_FUNCIONARIO.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Desligamento</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={11}>Carregando...</TableCell>
              </TableRow>
            )}
            {!isLoading && pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-muted-foreground">
                  Nenhum funcionário encontrado.
                </TableCell>
              </TableRow>
            )}
            {pageItems.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{nomeById(empresas.data, f.empresa_id)}</TableCell>
                <TableCell>{formatDateBR(f.data_admissao)}</TableCell>
                <TableCell>{anosDeCasa(f.data_admissao, f.data_desligamento, f.status)}</TableCell>
                <TableCell>{nomeById(cargos.data, f.cargo_id)}</TableCell>
                <TableCell>{nomeById(projetos.data, f.projeto_id)}</TableCell>
                <TableCell>{nomeById(gestores.data, f.gestor_id)}</TableCell>
                <TableCell>{f.tipo_colaborador ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={f.status === "DESLIGADO" ? "destructive" : "secondary"}
                    className={f.status === "ATIVO" ? "bg-success text-success-foreground" : ""}
                  >
                    {STATUS_LABEL[f.status] ?? f.status}
                  </Badge>
                </TableCell>
                <TableCell>{f.data_desligamento ? formatDateBR(f.data_desligamento) : "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {canEdit && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => abrirEdicao(f)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => void excluir(f)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtrados.length} registro(s) — página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            <div className="space-y-2 sm:col-span-2">
              <Label>Funcionário *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            {(
              [
                ["Empresa", "empresa_id", empresas.data],
                ["Cargo", "cargo_id", cargos.data],
                ["Projeto", "projeto_id", projetos.data],
                ["Gestor", "gestor_id", gestores.data],
              ] as const
            ).map(([label, key, options]) => (
              <div className="space-y-2" key={key}>
                <Label>{label}</Label>
                <Select
                  value={form[key]}
                  onValueChange={(v) => setForm({ ...form, [key]: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(options ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-2">
              <Label>Data de admissão</Label>
              <Input
                type="date"
                value={form.data_admissao}
                onChange={(e) => setForm({ ...form, data_admissao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Anos de casa (calculado)</Label>
              <Input
                readOnly
                value={
                  anosDeCasa(form.data_admissao, form.data_desligamento, form.status) ?? ""
                }
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo colaborador</Label>
              <Select
                value={form.tipo_colaborador}
                onValueChange={(v) => setForm({ ...form, tipo_colaborador: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COLABORADOR.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    status: v,
                    data_desligamento: v === "DESLIGADO" ? form.data_desligamento : "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FUNCIONARIO.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de desligamento</Label>
              <Input
                type="date"
                disabled={form.status !== "DESLIGADO"}
                value={form.data_desligamento}
                onChange={(e) => setForm({ ...form, data_desligamento: e.target.value })}
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
