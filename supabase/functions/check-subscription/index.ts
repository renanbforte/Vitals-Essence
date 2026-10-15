import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Mapeamento product_id → module_key (inclui IDs antigos e novos)
const PRODUCT_MODULE_MAP: Record<string, string> = {
  // Antigos (mensais R$10)
  "prod_U0zjXfyqNYTkxf": "financeiro",
  "prod_U0zjamfVsHR5gb": "tarefas",
  "prod_U0zjZoezDuhPef": "viagens",
  "prod_U0zjwIvAzeMqDg": "lista-compras",
  "prod_U0zkwmSDQtLDyY": "encontros",
  "prod_U0zkTBPHKkUtlO": "libertacao",
  "prod_U0zk80gCRhrbuP": "feminino",
  "prod_U0zl7Vujc79R7C": "astral",
  "prod_U0zlAZoRH0ZVrl": "pacote",
  // Novos mensais R$9,99
  "prod_U2XTATDBcwXyHx": "financeiro",
  "prod_U2XTRJRlU13ObA": "tarefas",
  "prod_U2XUqQR0r0n0cD": "viagens",
  "prod_U2XV6HHTq0f3p7": "lista-compras",
  "prod_U2XVvrKeh1Qxfe": "encontros",
  "prod_U2XX6P6IX2swrd": "libertacao",
  "prod_U2XXBXfwotVEv8": "feminino",
  "prod_U2XXb9PCzlXC7v": "astral",
  // Anuais individuais
  "prod_U2XYStgfziowX9": "financeiro",
  "prod_U2XY3rsRM1s6ml": "tarefas",
  "prod_U2XZnlGuqQZXLQ": "viagens",
  "prod_U2XZLUKGo7euiQ": "lista-compras",
  "prod_U2XZ0DqyQ96KnU": "encontros",
  "prod_U2XavjxaFzQJN1": "libertacao",
  "prod_U2XaB7v40QnaZ0": "feminino",
  "prod_U2XbNc4hafUmOm": "astral",
  // Trio
  "prod_U2XQXOrGdDdeGh": "trio",
  "prod_U2XRNKDm2cY5DK": "trio",
  // Pacote novo
  "prod_U2XSKiF1MJFrtf": "pacote",
  "prod_U2XSRBEungK3tm": "pacote",
  // Pacote v2 (R$49,90)
  "prod_U2XutUxX0Ka8Sz": "pacote",
  "prod_U2XvRhYxektxSM": "pacote",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Stripe é opcional: quando não configurado, seguimos apenas com vitalício + trials.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Cliente com service role: bypassa RLS para ler status de assinatura de forma
    // confiável. A identidade do usuário vem de getUser(token) abaixo, validada
    // pelo Auth — não dependemos do JWT do usuário nas consultas (evita problemas
    // de clock skew como "JWT issued at future").
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // --- Check lifetime premium (não depende do Stripe) ---
    const { data: lifetimeData, error: lifetimeError } = await supabaseClient
      .from("lifetime_premium_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (lifetimeError) logStep("Lifetime lookup error", { message: lifetimeError.message });

    if (lifetimeData) {
      logStep("User has lifetime premium");
      return new Response(JSON.stringify({
        subscribed: true, modules: [], is_package: true, is_trio: false, trio_modules: [],
        is_lifetime: true, subscription_end: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // --- Check active trials ---
    const now = new Date().toISOString();
    const { data: trialsData } = await supabaseClient
      .from("module_trials")
      .select("module_key, trial_end")
      .eq("user_id", user.id)
      .gt("trial_end", now);

    const activeTrials = (trialsData || []).map((t: any) => t.module_key);
    const trialEndDates: Record<string, string> = {};
    for (const t of (trialsData || [])) {
      trialEndDates[t.module_key] = t.trial_end;
    }
    logStep("Active trials", { activeTrials });

    // Sem Stripe configurado: retorna somente acesso gratuito + trials (sem quebrar o app).
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not set — skipping Stripe checks");
      return new Response(JSON.stringify({
        subscribed: false, modules: [], is_package: false, is_trio: false, trio_modules: [],
        is_lifetime: false, payment_failed: false, trial_modules: activeTrials,
        trial_end_dates: trialEndDates, subscription_end: null,
        cancel_at_period_end: false, canceled_modules: [], canceled_is_package: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // --- Check Stripe ---
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({
        subscribed: false, modules: [], is_package: false, is_trio: false, trio_modules: [],
        is_lifetime: false, trial_modules: activeTrials, trial_end_dates: trialEndDates,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId, status: "active", limit: 100,
    });

    const canceledSubs = subscriptions.data.filter(s => s.cancel_at_period_end === true);
    const canceledAtPeriodEnd = canceledSubs.length > 0;

    // Payment failed check
    const pastDueSubs = await stripe.subscriptions.list({ customer: customerId, status: "past_due", limit: 100 });
    const unpaidSubs = await stripe.subscriptions.list({ customer: customerId, status: "unpaid", limit: 100 });
    const paymentFailed = pastDueSubs.data.length > 0 || unpaidSubs.data.length > 0;

    const activeModules: string[] = [];
    const canceledModules: string[] = [];
    let isPackage = false;
    let isTrio = false;
    let _canceledIsPackage = false;
    let subscriptionEnd: string | null = null;

    for (const sub of subscriptions.data) {
      const endDate = new Date(sub.current_period_end * 1000).toISOString();
      if (!subscriptionEnd || endDate > subscriptionEnd) subscriptionEnd = endDate;

      for (const item of sub.items.data) {
        const productId = item.price.product as string;
        const moduleKey = PRODUCT_MODULE_MAP[productId];
        if (moduleKey === "pacote") {
          isPackage = true;
          if (sub.cancel_at_period_end) _canceledIsPackage = true;
        } else if (moduleKey === "trio") {
          isTrio = true;
        } else if (moduleKey) {
          activeModules.push(moduleKey);
          if (sub.cancel_at_period_end) canceledModules.push(moduleKey);
        }
      }
    }

    // Buscar módulos do trio no banco
    let trioModules: string[] = [];
    if (isTrio) {
      const { data: trioData } = await supabaseClient
        .from("trio_selections")
        .select("module_1, module_2, module_3")
        .eq("user_id", user.id)
        .maybeSingle();
      if (trioData) {
        trioModules = [trioData.module_1, trioData.module_2, trioData.module_3];
      }
      logStep("Trio modules", { trioModules });
    }

    // Sincronizar com banco de dados
    if (subscriptions.data.length > 0) {
      await supabaseClient.from("user_subscriptions").delete().eq("user_id", user.id);
      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const productId = item.price.product as string;
          const moduleKey = PRODUCT_MODULE_MAP[productId];
          if (moduleKey) {
            await supabaseClient.from("user_subscriptions").insert({
              user_id: user.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              product_id: productId,
              price_id: item.price.id,
              module_key: moduleKey,
              status: "active",
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            });
          }
        }
      }
    }

    logStep("Done", { activeModules, isPackage, isTrio, trioModules, canceledModules, activeTrials, paymentFailed });

    return new Response(JSON.stringify({
      subscribed: activeModules.length > 0 || isPackage || isTrio,
      modules: activeModules,
      is_package: isPackage,
      is_trio: isTrio,
      trio_modules: trioModules,
      is_lifetime: false,
      payment_failed: paymentFailed,
      trial_modules: activeTrials,
      trial_end_dates: trialEndDates,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: canceledAtPeriodEnd,
      canceled_modules: canceledModules,
      canceled_is_package: canceledAtPeriodEnd && isPackage && canceledModules.length === 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
