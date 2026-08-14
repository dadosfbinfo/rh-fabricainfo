import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Aux = { id: string; nome: string };

export type Funcionario = {
  id: string;
  empresa_id: string | null;
  nome: string;
  data_admissao: string | null;
  cargo_id: string | null;
  projeto_id: string | null;
  gestor_id: string | null;
  tipo_colaborador: string | null;
  status: string;
  data_desligamento: string | null;
  deleted_at: string | null;
};

export const AUX_TABLES = ["empresas", "cargos", "projetos", "gestores"] as const;
export type AuxTable = (typeof AUX_TABLES)[number];

export function useAux(table: AuxTable) {
  return useQuery({
    queryKey: [table],
    queryFn: async (): Promise<Aux[]> => {
      const { data, error } = await supabase.from(table).select("id, nome").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFuncionarios() {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: async (): Promise<Funcionario[]> => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select(
          "id, empresa_id, nome, data_admissao, cargo_id, projeto_id, gestor_id, tipo_colaborador, status, data_desligamento, deleted_at",
        )
        .is("deleted_at", null)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Funcionario[];
    },
  });
}

export function nomeById(list: Aux[] | undefined, id: string | null | undefined) {
  if (!id) return "—";
  return list?.find((i) => i.id === id)?.nome ?? "—";
}

export function idByNome(list: Aux[] | undefined, nome: string) {
  const key = nome.trim().toLowerCase();
  return list?.find((i) => i.nome.trim().toLowerCase() === key)?.id ?? null;
}
