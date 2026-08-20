import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AcessoNegado, PageHeader } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { normalizeText } from "@/lib/rh";
import { AUX_TABLES, useAux, type AuxTable } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros auxiliares | Sistema RH/DP" },
      {
        name: "description",
        content: "Gerencie empresas, cargos, projetos e gestores que alimentam os cadastros.",
      },
      { property: "og:title", content: "Cadastros auxiliares | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Gerencie empresas, cargos, projetos e gestores que alimentam os cadastros.",
      },
    ],
  }),
  component: Cadastros,
});

const LABELS: Record<AuxTable, string> = {
  empresas: "Empresas",
  cargos: "Cargos",
  projetos: "Projetos",
  gestores: "Gestores",
};

function AuxCrud({ table }: { table: AuxTable }) {
  const { data = [] } = useAux(table);
  const { canEdit } = useAuth();
  const qc = useQueryClient();
  const [novo, setNovo] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: [table] });

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const nome = normalizeText(novo);
    if (!nome) return;
    const { error } = await supabase.from(table).insert({ nome });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNovo("");
    void refresh();
  }

  async function salvar(id: string) {
    const { error } = await supabase.from(table).update({ nome: normalizeText(editNome) }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditId(null);
    void refresh();
  }

  async function remover(id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover (registro em uso).");
      return;
    }
    void refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{LABELS[table]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <form className="flex gap-2" onSubmit={adicionar}>
            <Input
              placeholder={`Novo item em ${LABELS[table]}`}
              value={novo}
              onChange={(e) => setNovo(e.target.value)}
            />
            <Button type="submit">
              <Plus className="size-4" /> Adicionar
            </Button>
          </form>
        )}
        <ul className="divide-y rounded-md border">
          {data.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-3">
              {editId === item.id ? (
                <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
              ) : (
                <span className="text-sm">{item.nome}</span>
              )}
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  {editId === item.id ? (
                    <>
                      <Button size="sm" onClick={() => void salvar(item.id)}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditId(item.id);
                          setEditNome(item.nome);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void remover(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
          {data.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Nenhum registro.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function Cadastros() {
  const { canEdit } = useAuth();
  if (!canEdit) {
    return (
      <AcessoNegado mensagem="Esta área é restrita a editores e administradores. Seu perfil possui acesso somente aos relatórios." />
    );
  }
  return <CadastrosConteudo />;
}

function CadastrosConteudo() {
  return (
    <>
      <PageHeader
        title="Cadastros auxiliares"
        description="As listas abaixo alimentam automaticamente os dropdowns da tela de Funcionários."
      />
      <Tabs defaultValue="empresas">
        <TabsList className="mb-4">
          {AUX_TABLES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        {AUX_TABLES.map((t) => (
          <TabsContent key={t} value={t}>
            <AuxCrud table={t} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
