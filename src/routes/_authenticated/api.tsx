import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/api")({
  head: () => ({
    meta: [
      { title: "API de dados | Sistema RH/DP" },
      {
        name: "description",
        content: "Endpoints REST protegidos por chave para consumo dos dados de RH no Power BI.",
      },
      { property: "og:title", content: "API de dados | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Endpoints REST protegidos por chave para consumo dos dados de RH no Power BI.",
      },
    ],
  }),
  component: ApiPage,
});

const ENDPOINTS = [
  { key: "funcionarios", label: "Funcionários" },
  { key: "info_school", label: "Info School" },
  { key: "avaliacao_desempenho", label: "Avaliação de desempenho" },
  { key: "atestado", label: "Atestado" },
  { key: "absenteismo", label: "Absenteísmo (com colunas numéricas)" },
];

function gerarChave() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return (
    "rhdp_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function ApiPage() {
  const { isDev, user } = useAuth();
  const qc = useQueryClient();
  const [gerando, setGerando] = useState(false);
  const base = typeof window !== "undefined" ? window.location.origin : "";

  const { data: chaves = [] } = useQuery({
    queryKey: ["api_keys"],
    enabled: isDev,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, chave, revogada, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: acessos = [] } = useQuery({
    queryKey: ["api_access_logs"],
    enabled: isDev,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_access_logs")
        .select("tabela, acessado_em")
        .order("acessado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const ultimoAcesso = (tabela: string) => {
    const log = acessos.find((a) => a.tabela === tabela);
    return log ? new Date(log.acessado_em).toLocaleString("pt-BR") : "nunca consultado";
  };

  if (!isDev) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Acesso negado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é restrita a usuários com a função ADMINISTRADOR DEV.
        </p>
      </div>
    );
  }

  const chaveAtiva = chaves.find((c) => !c.revogada);

  async function novaChave() {
    setGerando(true);
    if (chaveAtiva) {
      await supabase.from("api_keys").update({ revogada: true }).eq("id", chaveAtiva.id);
    }
    const { error } = await supabase
      .from("api_keys")
      .insert({ chave: gerarChave(), created_by: user?.id ?? null, descricao: "Power BI" });
    setGerando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Nova chave gerada. A anterior foi revogada.");
    void qc.invalidateQueries({ queryKey: ["api_keys"] });
  }

  const copiar = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <>
      <PageHeader
        title="API"
        description="Endpoints REST somente leitura para consumo dos dados no Power BI."
      >
        <Button onClick={() => void novaChave()} disabled={gerando}>
          <KeyRound className="size-4" /> Gerar nova chave
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chave de autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {chaveAtiva ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-3 py-2 text-sm break-all">
                {chaveAtiva.chave}
              </code>
              <Button variant="outline" size="sm" onClick={() => copiar(chaveAtiva.chave)}>
                <Copy className="size-4" /> Copiar
              </Button>
              <Badge className="bg-success text-success-foreground">ativa</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma chave ativa. Clique em “Gerar nova chave”.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Envie a chave no cabeçalho <code>x-api-key</code>. Chaves antigas são revogadas
            automaticamente ao gerar uma nova.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {ENDPOINTS.map((e) => {
          const url = `${base}/api/public/rh/${e.key}`;
          const chave = chaveAtiva?.chave ?? "SUA_CHAVE";
          const curl = `curl -H "x-api-key: ${chave}" "${url}"`;
          const powerBI = `let\n    Source = Json.Document(Web.Contents("${url}", [Headers=[apikey="${chave}", Authorization="Bearer ${chave}"]]))\nin\n    Source`;
          return (
            <Card key={e.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-muted px-3 py-2 text-xs break-all">{url}</code>
                  <Button variant="outline" size="sm" onClick={() => copiar(url)}>
                    <Copy className="size-4" /> Copiar URL
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-muted px-3 py-2 text-xs break-all">{curl}</code>
                  <Button variant="outline" size="sm" onClick={() => copiar(curl)}>
                    <Copy className="size-4" /> Copiar curl
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-muted px-3 py-2 text-xs break-all">{powerBI}</code>
                  <Button variant="outline" size="sm" onClick={() => copiar(powerBI)}>
                    <Copy className="size-4" /> Copiar Power Query
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Última consulta: {ultimoAcesso(e.key)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Exemplo no Power BI (Power Query)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-muted p-4 text-xs">{`let
    Fonte = Json.Document(
        Web.Contents(
            "${base}/api/public/rh/absenteismo",
            [Headers=[#"x-api-key"="${chaveAtiva?.chave ?? "SUA_CHAVE"}"]]
        )
    ),
    Dados = Fonte[data],
    Tabela = Table.FromRecords(Dados)
in
    Tabela`}</pre>
        </CardContent>
      </Card>
    </>
  );
}
