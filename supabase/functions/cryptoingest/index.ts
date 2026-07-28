import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const table = url.searchParams.get("table");
    const body = await req.json();
    const userId = "b8836498-9207-4ed7-b264-31c7568f379c";
    const record = { user_id: userId, ...body };

    const tableMap: Record<string, string> = {
      conta: "crypto_snapshots",
      snapshot: "crypto_snapshots",
      movimentacao: "crypto_daily_moves",
      moves: "crypto_daily_moves",
      metodologia: "crypto_strategies",
      strategy: "crypto_strategies",
      valor: "crypto_deposits",
      deposit: "crypto_deposits",
    };

    const dbTable = table ? tableMap[table] : null;
    if (!dbTable) {
      return new Response(
        JSON.stringify({ error: "Use ?table=conta|movimentacao|metodologia|valor" }),
        { status: 400, headers },
      );
    }

    const { error } = await supabase.from(dbTable).insert(record);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ success: true, table: dbTable }), { status: 200, headers });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers },
    );
  }
});
