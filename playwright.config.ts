// Configuração dos testes de ponta a ponta (E2E) com Playwright.
// Os testes ficam na pasta "e2e/". Ajuste as opções abaixo conforme precisar.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",                 // pasta onde ficam os testes E2E
  use: {
    baseURL: "http://localhost:8080", // endereço base do app durante os testes
  },
});
