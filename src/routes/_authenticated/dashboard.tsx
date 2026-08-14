import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, CalendarX, GraduationCap, Gauge, FileHeart, Database } from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFuncionarios } from "@/lib/queries";
import { ImportLogs } from "@/components/ImportLogs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard RH/DP | Gente & Gestão" },
      {
        name: "description",
        content: "Indicadores rápidos de funcionários ativos, desligados, férias e licenças.",
      },
      { property: "og:title", content: "Dashboard RH/DP | Gente & Gestão" },
      {
        property: "og:description",
        content: "Indicadores rápidos de funcionários ativos, desligados, férias e licenças.",
      },
    ],
  }),
  component: Dashboard,
});

const ATALHOS = [
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/cadastros", label: "Cadastros auxiliares", icon: Database },
  { to: "/info-school", label: "Info School", icon: GraduationCap },
  { to: "/avaliacoes", label: "Avaliação de desempenho", icon: Gauge },
  { to: "/atestados", label: "Atestado", icon: FileHeart },
  { to: "/absenteismo", label: "Absenteísmo", icon: CalendarX },
] as const;

function Dashboard() {
  const { data: funcionarios = [] } = useFuncionarios();
  const count = (s: string) => funcionarios.filter((f) => f.status === s).length;

  const cards = [
    { label: "Total de colaboradores", value: funcionarios.length, tone: "text-foreground" },
    { label: "Ativos", value: count("ATIVO"), tone: "text-success" },
    { label: "Desligados", value: count("DESLIGADO"), tone: "text-destructive" },
    { label: "Férias / Licença", value: count("FERIAS") + count("LICENCA"), tone: "text-warning" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do quadro de colaboradores." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${c.tone}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Atalhos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ATALHOS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="rounded-md bg-primary/10 p-2 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="font-medium">{a.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-10">
        <ImportLogs />
      </div>
    </>
  );
}
