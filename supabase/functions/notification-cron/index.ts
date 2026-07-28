import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Current time in BRT (UTC-3) rounded to minute
    const now = new Date();
    const brtOffset = -3 * 60;
    const brtTime = new Date(now.getTime() + (brtOffset + now.getTimezoneOffset()) * 60000);
    const currentTime = `${String(brtTime.getHours()).padStart(2, "0")}:${String(brtTime.getMinutes()).padStart(2, "0")}`;

    console.log(`[notification-cron] Checking time: ${currentTime} BRT`);

    // Get all users with push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .limit(1000);

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(subscriptions.map((s: any) => s.user_id))];
    const notifications: { userId: string; title: string; body: string; module: string }[] = [];

    // 1. Check medications
    const { data: medications } = await supabase
      .from("user_medications")
      .select("user_id, name, schedule_times")
      .eq("active", true)
      .in("user_id", userIds);

    if (medications) {
      for (const med of medications) {
        const times = med.schedule_times as string[];
        if (times?.includes(currentTime)) {
          notifications.push({
            userId: med.user_id,
            title: "💊 Hora da Medicação",
            body: `Tome ${med.name} agora`,
            module: "medicacao",
          });
        }
      }
    }

    // 2. Check hydration schedule
    const { data: hydration } = await supabase
      .from("user_hydration_schedule")
      .select("user_id, schedule_time, label, amount_ml")
      .eq("schedule_time", currentTime)
      .in("user_id", userIds);

    if (hydration) {
      for (const h of hydration) {
        notifications.push({
          userId: h.user_id,
          title: "💧 Hora de Beber Água",
          body: `${h.label} — ${h.amount_ml}ml`,
          module: "hidratacao",
        });
      }
    }

    // 3. Check meal plans
    const { data: meals } = await supabase
      .from("user_meal_plans")
      .select("user_id, meal_name, meal_time")
      .eq("meal_time", currentTime)
      .in("user_id", userIds);

    if (meals) {
      for (const meal of meals) {
        notifications.push({
          userId: meal.user_id,
          title: "🍽️ Hora da Refeição",
          body: meal.meal_name,
          module: "refeicoes",
        });
      }
    }

    console.log(`[notification-cron] Found ${notifications.length} notifications to send`);

    // Send notifications via send-push function
    let sent = 0;
    for (const notif of notifications) {
      // Check preference before sending
      const { data: pref } = await supabase
        .from("notification_preferences")
        .select("enabled")
        .eq("user_id", notif.userId)
        .eq("module", notif.module)
        .maybeSingle();

      if (pref && pref.enabled === false) continue;

      // Get user subscriptions
      const { data: userSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", notif.userId);

      if (!userSubs?.length) continue;

      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
      const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;

      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: { module: notif.module },
      });

      for (const sub of userSubs) {
        try {
          const url = new URL(sub.endpoint);
          const audience = `${url.protocol}//${url.hostname}`;

          // Simple push - just POST the payload
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              TTL: "86400",
            },
            body: new TextEncoder().encode(payload),
          });

          if (response.status === 410) {
            // Subscription expired, clean up
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          } else if (response.ok) {
            sent++;
          }
        } catch (err) {
          console.error(`[notification-cron] Push error:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${notifications.length} notifications, sent ${sent}`,
        time: currentTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[notification-cron] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
