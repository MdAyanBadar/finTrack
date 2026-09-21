import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";
import { CurrencyProvider } from "./context/CurrencyContext";

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
