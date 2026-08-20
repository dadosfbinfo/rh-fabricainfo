import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { nomeById, useAux, useFuncionarios } from "@/lib/queries";
import { anosDeCasa, downloadXLSX, formatDateBR } from "@/lib/rh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/_authenticated/desligamentos")({
  head: () => ({
    meta: [
      { title: "Desligamentos | Sistema RH/DP" },
      {
        name: "description",
        content:
          "Relatório somente leitura dos colaboradores desligados, com filtros por período, empresa, projeto e gestor.",
      },
      { property: "og:title", content: "Desligamentos | Sistema RH/DP" },
      {
        property: "og:description",
        content:
          "Relatório somente leitura dos colaboradores desligados, com filtros por período, empresa, projeto e gestor.",
      },
    ],
  }),
  component: DesligamentosPage,
});

const ALL = "__all__";

function DesligamentosPage() {
  const { canEdit } = useAuth();
  const { data: funcionarios = [] } = useFuncionarios();
  const empresas = useAux("empresas");
  const cargos = useAux("cargos");
  const projetos = useAux("projetos");
  const gestores = useAux("gestores");

  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [fEmpresa, setFEmpresa] = useState(ALL);
  const [fProjeto, setFProjeto] = useState(ALL);
  const [fGestor, setFGestor] = useState(ALL);

  const linhas = useMemo(
    () =>
      funcionarios
        .filter(
          (f) =>
            f.status === "DESLIGADO" &&
            !!f.data_desligamento &&
            (!de || f.data_desligamento >= de) &&
            (!ate || f.data_desligamento <= ate) &&
            (fEmpresa === ALL || f.empresa_id === fEmpresa) &&
            (fProjeto === ALL || f.projeto_id === fProjeto) &&
            (fGestor === ALL || f.gestor_id === fGestor),
        )
        .sort((a, b) => (b.data_desligamento ?? "").localeCompare(a.data_desligamento ?? "")),
    [funcionarios, de, ate, fEmpresa, fProjeto, fGestor],
  );

  const asRows = () =>
    linhas.map((f) => ({
      EMPRESA: nomeById(empresas.data, f.empresa_id),
      FUNCIONARIO: f.nome,
      CARGO: nomeById(cargos.data, f.cargo_id),
      PROJETO: nomeById(projetos.data, f.projeto_id),
      GESTOR: nomeById(gestores.data, f.gestor_id),
      "DATA DE ADMISSAO": formatDateBR(f.data_admissao),
      "DATA DE DESLIGAMENTO": formatDateBR(f.data_desligamento),
      "ANOS DE CASA": anosDeCasa(f.data_admissao, f.data_desligamento, f.status) ?? "",
      "TIPO COLABORADOR": f.tipo_colaborador ?? "",
    }));

  return (
    <>
      <PageHeader
        title="Desligamentos"
        description="Relatório somente leitura. A edição continua sendo feita na aba Funcionários."
      >
        {canEdit && (
          <Button onClick={() => downloadXLSX("desligamentos.xlsx", asRows(), "Desligamentos")}>
            <Download className="size-4" /> Exportar XLSX
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs">Desligamento de</Label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">até</Label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Empresa</Label>
          <Select value={fEmpresa} onValueChange={setFEmpresa}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {(empresas.data ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Projeto</Label>
          <Select value={fProjeto} onValueChange={setFProjeto}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {(projetos.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Gestor</Label>
          <Select value={fGestor} onValueChange={setFGestor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {(gestores.data ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Desligamento</TableHead>
              <TableHead>Anos de casa</TableHead>
              <TableHead>Tipo colaborador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((f) => (
              <TableRow key={f.id}>
                <TableCell>{nomeById(empresas.data, f.empresa_id)}</TableCell>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{nomeById(cargos.data, f.cargo_id)}</TableCell>
                <TableCell>{nomeById(projetos.data, f.projeto_id)}</TableCell>
                <TableCell>{nomeById(gestores.data, f.gestor_id)}</TableCell>
                <TableCell>{formatDateBR(f.data_admissao)}</TableCell>
                <TableCell>{formatDateBR(f.data_desligamento)}</TableCell>
                <TableCell>{anosDeCasa(f.data_admissao, f.data_desligamento, f.status)}</TableCell>
                <TableCell>{f.tipo_colaborador ?? "—"}</TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  Nenhum desligamento no período filtrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
