import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";
import { CurrencyProvider } from "./context/CurrencyContext";

// iOS Safari ignores user-scalable=no in some cases; block its pinch gesture directly
["gesturestart", "gesturechange", "gestureend"].forEach((type) =>
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
);

// Service worker: offline shell + push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CurrencyProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </CurrencyProvider>
    </BrowserRouter>
  </React.StrictMode>
);
