// Configuração do Vite (empacotador do projeto): servidor de dev, PWA e atalhos de import.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // plugin do React usando o compilador SWC (rápido)
import path from "path";                       // utilidades para montar caminhos de arquivo
import { VitePWA } from "vite-plugin-pwa";     // transforma o app em PWA (instalável no celular)

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",       // aceita conexões de qualquer IP da rede local
    port: 8080,       // endereço local do dev: http://localhost:8080
    hmr: {
      overlay: false, // não sobrepõe a tela com a caixa de erro do HMR
    },
  },
  plugins: [
    react(), // habilita React + JSX
    VitePWA({
      registerType: "prompt",
      selfDestroying: false,
      includeAssets: ["favicon.ico", "favicon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: ({
        id: "app.vitalisessence",
        name: "Vitalis Essence — Vida em Funcionamento",
        short_name: "Vitalis Essence",
        description: "Plataforma modular de gestão pessoal: saúde, finanças, carreira e viagens. Controle sua vida com inteligência.",
        theme_color: "#3B6FB6",
        background_color: "#0f172a",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        scope: "/",
        start_url: "/?source=pwa",
        lang: "pt-BR",
        dir: "ltr",
        categories: ["health", "fitness", "lifestyle", "finance", "productivity"],
        iarc_rating_id: "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Vitalis Essence — Gestão pessoal completa",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Vitalis Essence — Visão ampla",
          },
        ],
        shortcuts: [
          {
            name: "Saúde",
            short_name: "Saúde",
            description: "Acessar módulo de saúde",
            url: "/saude",
            icons: [{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png" }],
          },
          {
            name: "Finanças",
            short_name: "Finanças",
            description: "Acessar módulo financeiro",
            url: "/financeiro",
            icons: [{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png" }],
          },
        ],
        related_applications: [
          {
            platform: "play",
            url: "https://play.google.com/store/apps/details?id=app.vitalisessence",
            id: "app.vitalisessence",
          },
        ],
        prefer_related_applications: false,
        launch_handler: {
          client_mode: ["focus-existing", "auto"],
        },
        scope_extensions: [
          // Origem da API do Supabase (projeto próprio do app)
          { origin: "https://ktymjadbggzxvjbefquw.supabase.co" },
        ],
        share_target: {
          action: "/",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
        protocol_handlers: [
          {
            protocol: "web+vitalis",
            url: "/?action=%s",
          },
        ],
        edge_side_panel: {
          preferred_width: 400,
        },
        handle_links: "preferred",
        file_handlers: [
          {
            action: "/",
            accept: {
              "text/plain": [".txt"],
              "text/csv": [".csv"],
            },
          },
        ],
        widgets: [
          {
            name: "Resumo do Dia",
            short_name: "Resumo",
            description: "Veja seu progresso diário de saúde e finanças",
            tag: "vitalis-daily-widget",
            template: "vitalis-daily-template",
            ms_ac_template: "widgets/daily-summary.json",
            data: "widgets/daily-summary-data.json",
            type: "application/json",
            icons: [{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png" }],
            screenshots: [{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png", label: "Resumo diário" }],
          },
        ],
        note_taking: {
          new_note_url: "/?action=new-note",
        },
      } as any),
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        importScripts: ['/sw-push.js'],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "embla-carousel-react", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
  },
}));
