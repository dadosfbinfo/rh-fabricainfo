import { Link, useRouterState } from "@tanstack/react-router";
import {
  Users,
  Database,
  GraduationCap,
  Gauge,
  FileHeart,
  CalendarX,
  Plug,
  LayoutDashboard,
  LogOut,
  Menu,
  UserMinus,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Users;
  devOnly?: boolean;
};

const GRUPOS: { titulo: string; itens: NavItem[] }[] = [
  {
    titulo: "Relatórios",
    itens: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/desligamentos", label: "Desligamentos", icon: UserMinus },
      { to: "/api", label: "API", icon: Plug, devOnly: true },
    ],
  },
  {
    titulo: "Cadastros & Bases",
    itens: [
      { to: "/funcionarios", label: "Funcionários", icon: Users },
      { to: "/cadastros", label: "Cadastros auxiliares", icon: Database },
      { to: "/info-school", label: "Info School", icon: GraduationCap },
      { to: "/avaliacoes", label: "Avaliação de desempenho", icon: Gauge },
      { to: "/atestados", label: "Atestado", icon: FileHeart },
      { to: "/absenteismo", label: "Absenteísmo", icon: CalendarX },
    ],
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, roleLoaded, isAdmin, isDev, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (roleLoaded && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">Acesso pendente</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não possui uma função atribuída. Peça a um administrador para liberar
            seu acesso em Cadastros auxiliares &gt; Usuários.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
            Gente &amp; Gestão
          </p>
          <h1 className="mt-1 text-lg font-bold">Sistema RH / DP</h1>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {GRUPOS.map((grupo) => {
            const itens = grupo.itens.filter((i) => !i.devOnly || isDev);
            if (itens.length === 0) return null;
            return (
              <div key={grupo.titulo} className="space-y-1">
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.16em] text-sidebar-primary uppercase">
                  {grupo.titulo}
                </p>
                {itens.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-sm">
          <p className="truncate font-medium">{user?.email}</p>
          <Badge variant="secondary" className="mt-2">
            {(role ?? "—").replace("_", " ")}
          </Badge>
          {isAdmin && (
            <Link
              to="/usuarios"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ShieldCheck className="size-4" /> Administração · Usuários
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <Button variant="outline" size="icon" onClick={() => setOpen((v) => !v)}>
            <Menu className="size-4" />
          </Button>
          <span className="font-semibold">Sistema RH / DP</span>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
