import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { UsuariosRoles } from "@/components/UsuariosRoles";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e permissões | Sistema RH/DP" },
      {
        name: "description",
        content: "Área de administração para atribuir funções de acesso aos usuários do sistema.",
      },
      { property: "og:title", content: "Usuários e permissões | Sistema RH/DP" },
      {
        property: "og:description",
        content: "Área de administração para atribuir funções de acesso aos usuários do sistema.",
      },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Acesso negado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é restrita a administradores.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Defina a função de acesso de cada usuário cadastrado no sistema."
      />
      <UsuariosRoles />
    </>
  );
}
