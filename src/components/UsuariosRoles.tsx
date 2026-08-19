import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { excluirUsuario } from "@/lib/usuarios.functions";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLES: AppRole[] = ["ADMINISTRADOR_DEV", "ADMINISTRADOR", "EDITOR", "VISUALIZADOR"];
const SEM_ACESSO = "SEM_ACESSO";

type UsuarioLinha = { id: string; nome: string | null; email: string | null };

export function UsuariosRoles() {
  const { isAdmin, isDev, user } = useAuth();
  const qc = useQueryClient();
  const remover = useServerFn(excluirUsuario);
  const [alvo, setAlvo] = useState<UsuarioLinha | null>(null);
  const [removendo, setRemovendo] = useState(false);


  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios_roles"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, nome, email").order("email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? null,
      }));
    },
  });

  async function alterar(userId: string, role: string) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    if (role !== SEM_ACESSO) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as AppRole });
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    toast.success("Função atualizada.");
    void qc.invalidateQueries({ queryKey: ["usuarios_roles"] });
  }

  async function confirmarExclusao() {
    if (!alvo) return;
    setRemovendo(true);
    try {
      await remover({ data: { userId: alvo.id } });
      toast.success("Usuário removido.");
      setAlvo(null);
      void qc.invalidateQueries({ queryKey: ["usuarios_roles"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível remover o usuário.");
    } finally {
      setRemovendo(false);
    }
  }


  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Somente administradores podem gerenciar funções de usuários.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários e funções</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nome ?? "—"}</TableCell>
                <TableCell>{u.email ?? "—"}</TableCell>
                <TableCell className="w-64">
                  <Select
                    value={u.role ?? SEM_ACESSO}
                    onValueChange={(v) => void alterar(u.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter((r) => r !== "ADMINISTRADOR_DEV" || isDev).map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                      <SelectItem value={SEM_ACESSO}>SEM ACESSO</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
