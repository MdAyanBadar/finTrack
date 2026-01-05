import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("INR");
  const [symbol, setSymbol] = useState("₹");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const res = await api.get("/users/me");
        if (res.data?.currency) {
          setCurrency(res.data.currency);
          setSymbol(getSymbol(res.data.currency));
        }
      } catch {
        // fallback
        setCurrency("INR");
        setSymbol("₹");
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, []);

  const changeCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    setSymbol(getSymbol(newCurrency));

    try {
      await api.put("/users/currency", { currency: newCurrency });
    } catch {
      // backend optional
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol,
        loading,
        changeCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

/* ✅ THIS IS CRITICAL */
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return context;
}

/* helper */
function getSymbol(code) {
  return (
    {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "Fr",
      CNY: "¥",
      SGD: "S$",
    }[code] || "₹"
  );
}
