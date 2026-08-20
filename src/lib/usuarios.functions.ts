import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) {
      throw new Error("Você não pode excluir a própria conta.");
    }

    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Apenas administradores podem excluir usuários.");

    const { data: callerIsDev, error: devError } = await context.supabase.rpc("is_dev", {
      _user_id: context.userId,
    });
    if (devError) throw new Error(devError.message);

    const { data: alvoIsDev, error: alvoError } = await context.supabase.rpc("is_dev", {
      _user_id: data.userId,
    });
    if (alvoError) throw new Error(alvoError.message);
    if (alvoIsDev && !callerIsDev) {
      throw new Error("Somente ADMINISTRADOR DEV pode excluir um ADMINISTRADOR DEV.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
