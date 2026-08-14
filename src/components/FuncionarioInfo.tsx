import { nomeById, useAux, type Funcionario } from "@/lib/queries";
import { anosDeCasa, formatDateBR, STATUS_LABEL } from "@/lib/rh";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FuncionarioSelect({
  value,
  onChange,
  funcionarios,
}: {
  value: string;
  onChange: (id: string) => void;
  funcionarios: Funcionario[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o funcionário" />
      </SelectTrigger>
      <SelectContent>
        {funcionarios.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Campos somente leitura autopreenchidos a partir do cadastro mestre. */
export function FuncionarioReadOnlyFields({
  funcionario,
  campos,
}: {
  funcionario: Funcionario | undefined;
  campos: Array<"empresa" | "admissao" | "anos" | "cargo" | "projeto" | "gestor" | "status" | "desligamento">;
}) {
  const empresas = useAux("empresas");
  const cargos = useAux("cargos");
  const projetos = useAux("projetos");
  const gestores = useAux("gestores");

  const valores: Record<string, { label: string; value: string }> = {
    empresa: { label: "Empresa", value: nomeById(empresas.data, funcionario?.empresa_id) },
    admissao: { label: "Admissão", value: formatDateBR(funcionario?.data_admissao) },
    anos: {
      label: "Anos de casa",
      value: String(
        anosDeCasa(funcionario?.data_admissao, funcionario?.data_desligamento, funcionario?.status) ??
          "—",
      ),
    },
    cargo: { label: "Cargo", value: nomeById(cargos.data, funcionario?.cargo_id) },
    projeto: { label: "Projeto", value: nomeById(projetos.data, funcionario?.projeto_id) },
    gestor: { label: "Gestor", value: nomeById(gestores.data, funcionario?.gestor_id) },
    status: {
      label: "Status colaborador",
      value: funcionario ? (STATUS_LABEL[funcionario.status] ?? funcionario.status) : "—",
    },
    desligamento: {
      label: "Data de desligamento",
      value: formatDateBR(funcionario?.data_desligamento),
    },
  };

  return (
    <>
      {campos.map((c) => (
        <div className="space-y-2" key={c}>
          <Label>{valores[c]!.label}</Label>
          <Input readOnly className="bg-muted" value={valores[c]!.value} />
        </div>
      ))}
    </>
  );
}
