import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Sistema RH/DP Gente & Gestão" },
      {
        name: "description",
        content: "Acesse o sistema de gestão de dados de RH/DP com e-mail e senha.",
      },
      { property: "og:title", content: "Entrar | Sistema RH/DP Gente & Gestão" },
      {
        property: "og:description",
        content: "Acesse o sistema de gestão de dados de RH/DP com e-mail e senha.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void navigate({ to: "/dashboard" });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const emailNormalizado = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: emailNormalizado,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { nome },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        /already|registered|exists/i.test(error.message)
          ? "Este e-mail já possui cadastro. Faça login ou use outro e-mail."
          : error.message,
      );
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("Este e-mail já possui cadastro. Faça login ou use outro e-mail.");
      return;
    }
    toast.success(
      "Cadastro criado! Enviamos um e-mail de confirmação — confirme para poder acessar o sistema.",
    );
    setSenha("");
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Gente &amp; Gestão
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sistema de RH / DP</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso ao sistema</CardTitle>
            <CardDescription>Use seu e-mail corporativo e senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form className="space-y-4" onSubmit={entrar}>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form className="space-y-4" onSubmit={cadastrar}>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input
                      id="email2"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha2">Senha</Label>
                    <Input
                      id="senha2"
                      type="password"
                      required
                      minLength={6}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Criar conta
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Cada e-mail só pode ter um cadastro. Após criar a conta, você receberá um
                    e-mail de confirmação — é preciso confirmar antes do primeiro acesso. O
                    primeiro usuário cadastrado recebe o papel de ADMINISTRADOR; os demais entram
                    como VISUALIZADOR até que um administrador altere a função.
                  </p>

                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
