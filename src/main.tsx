import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force SW update on every load to prevent stale cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.update();
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              window.location.reload();
            }
          });
        }
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
