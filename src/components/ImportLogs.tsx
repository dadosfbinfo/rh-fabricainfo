import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ImportLogs() {
  const { data = [] } = useQuery({
    queryKey: ["import_logs"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("import_logs")
        .select("id, tabela, user_email, linhas_importadas, linhas_erro, arquivo, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return rows ?? [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de importações</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Aba</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Importadas</TableHead>
              <TableHead>Com erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell>{l.tabela}</TableCell>
                <TableCell>{l.arquivo ?? "—"}</TableCell>
                <TableCell>{l.user_email ?? "—"}</TableCell>
                <TableCell className="text-success">{l.linhas_importadas}</TableCell>
                <TableCell className="text-destructive">{l.linhas_erro}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Nenhuma importação registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
