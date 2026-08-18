import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  CalendarX,
  GraduationCap,
  Gauge,
  FileHeart,
  Database,
  UserMinus,
} from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  { to: "/desligamentos", label: "Desligamentos", icon: UserMinus },
] as const;

function Dashboard() {
  const { data: funcionarios = [] } = useFuncionarios();
  const count = (s: string) => funcionarios.filter((f) => f.status === s).length;

  const hoje = new Date();
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
  const fimMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-31`;

  const { data: atestadosMes = 0 } = useQuery({
    queryKey: ["dashboard_atestados", inicioMes],
    queryFn: async () => {
      const { count: total, error } = await supabase
        .from("atestado")
        .select("id", { count: "exact", head: true })
        .gte("data", inicioMes)
        .lte("data", fimMes);
      if (error) throw error;
      return total ?? 0;
    },
  });

  const { data: pctAbsMes = null } = useQuery({
    queryKey: ["dashboard_absenteismo", inicioMes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absenteismo")
        .select("percentual_absenteismo")
        .gte("mes", inicioMes)
        .lte("mes", fimMes);
      if (error) throw error;
      const valores = (data ?? []).map((r) => Number(r.percentual_absenteismo ?? 0));
      if (valores.length === 0) return null;
      return valores.reduce((a, b) => a + b, 0) / valores.length;
    },
  });

  const cards = [
    {
      label: "Total de colaboradores",
      value: funcionarios.length,
      color: "var(--chart-1)",
    },
    { label: "Ativos", value: count("ATIVO"), color: "var(--chart-2)" },
    { label: "Desligados", value: count("DESLIGADO"), color: "var(--chart-5)" },
    { label: "Em férias", value: count("FERIAS"), color: "var(--chart-3)" },
    { label: "Em licença", value: count("LICENCA"), color: "var(--chart-4)" },
    { label: "Atestados no mês", value: atestadosMes, color: "var(--chart-3)" },
    {
      label: "% médio de absenteísmo do mês",
      value: pctAbsMes === null ? "—" : `${(pctAbsMes * 100).toFixed(1)}%`,
      color: "var(--chart-2)",
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do quadro de colaboradores." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-l-4" style={{ borderLeftColor: c.color }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" style={{ color: c.color }}>
                {c.value}
              </p>
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
