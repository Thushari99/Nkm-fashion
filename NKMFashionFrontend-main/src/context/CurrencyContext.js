import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return sessionStorage.getItem("currency") || "";
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
        const fetchedCurrency = data.currency || "";
        setCurrency(fetchedCurrency);
        sessionStorage.setItem("currency", fetchedCurrency);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    sessionStorage.setItem("currency", newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  return useContext(CurrencyContext);
};

export default CurrencyContext;
