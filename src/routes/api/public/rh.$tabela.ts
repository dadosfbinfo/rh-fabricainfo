import { createFileRoute } from "@tanstack/react-router";

const TABELAS: Record<string, string> = {
  funcionarios:
    "id, nome, status, tipo_colaborador, data_admissao, data_desligamento, empresa:empresas(nome), cargo:cargos(nome), projeto:projetos(nome), gestor:gestores(nome)",
  info_school: "id, mes, status_infoschool, funcionario:funcionarios(id, nome)",
  avaliacao_desempenho:
    "id, data_avaliacao, hard_skill, soft_skill, nota_final, funcionario:funcionarios(id, nome)",
  atestado: "id, data, cid, total_dias, funcionario:funcionarios(id, nome)",
  absenteismo:
    "id, mes, setor, horas_ausencia_txt, horas_previstas_txt, horas_ausencia_num, horas_previstas_num, percentual_absenteismo, funcionario:funcionarios(id, nome)",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export const Route = createFileRoute("/api/public/rh/$tabela")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const select = TABELAS[params.tabela];
        if (!select) return json({ error: "Tabela não disponível" }, 404);

        const url = new URL(request.url);
        const apiKey =
          request.headers.get("x-api-key") ??
          request.headers.get("apikey") ??
          url.searchParams.get("api_key");
        if (!apiKey) return json({ error: "Chave de API ausente" }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: keyRow } = await supabaseAdmin
          .from("api_keys")
          .select("id")
          .eq("chave", apiKey)
          .eq("revogada", false)
          .maybeSingle();
        if (!keyRow) return json({ error: "Chave de API inválida ou revogada" }, 401);

        const query = supabaseAdmin.from(params.tabela as never).select(select);
        const { data, error } = await (params.tabela === "funcionarios"
          ? query.is("deleted_at", null)
          : query);
        if (error) return json({ error: error.message }, 500);
        return json({ tabela: params.tabela, total: data?.length ?? 0, data });
      },
    },
  },
});
