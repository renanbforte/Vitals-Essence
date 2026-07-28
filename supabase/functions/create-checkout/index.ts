import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Product IDs do Pacote Completo (todos os variants)
const PACOTE_PRODUCT_IDS = [
  "prod_U0zlAZoRH0ZVrl",
  "prod_U2XSKiF1MJFrtf",
  "prod_U2XSRBEungK3tm",
];

// Price IDs do Pacote Completo
const PACOTE_PRICE_IDS = [
  "price_1T2xlqAWmzfsTswaTGybWAsJ",
  "price_1T4SNkAWmzfsTswaCp5UgKp1",
  "price_1T4SO0AWmzfsTswa0wsScXVh",
];

// Price IDs do Trio
const TRIO_PRICE_IDS = [
  "price_1T4SLlAWmzfsTswaHrYEM9Vk",
  "price_1T4SMiAWmzfsTswatqyY0ODm",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { price_id, trio_modules } = body;
    if (!price_id) throw new Error("price_id is required");
    logStep("Price ID received", { price_id, trio_modules });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Buscar ou identificar o customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Se está comprando o Pacote Completo, cancelar assinaturas individuais e trio
    const isPackagePurchase = PACOTE_PRICE_IDS.includes(price_id);

    if (isPackagePurchase && customerId) {
      logStep("Package purchase detected - cancelling individual subscriptions");
      const activeSubs = await stripe.subscriptions.list({
        customer: customerId, status: "active", limit: 100,
      });
      for (const sub of activeSubs.data) {
        const isIndividual = sub.items.data.some(
          (item) => !PACOTE_PRODUCT_IDS.includes(item.price.product as string)
        );
        if (isIndividual) {
          logStep("Cancelling subscription", { subscriptionId: sub.id });
          await stripe.subscriptions.cancel(sub.id);
        }
      }
      logStep("Individual subscriptions cancelled");
    }

    // Se é Trio, salvar os módulos escolhidos
    const isTrioPurchase = TRIO_PRICE_IDS.includes(price_id);
    if (isTrioPurchase) {
      if (!trio_modules || trio_modules.length !== 3) {
        throw new Error("trio_modules must have exactly 3 modules");
      }
      // Upsert trio selection
      await supabaseClient
        .from("trio_selections")
        .upsert({
          user_id: user.id,
          module_1: trio_modules[0],
          module_2: trio_modules[1],
          module_3: trio_modules[2],
        }, { onConflict: "user_id" });
      logStep("Trio modules saved", { trio_modules });
    }

    const origin = req.headers.get("origin") || "https://vitalisessence.com.br";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/planos`,
    });

    logStep("Session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
