import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create the context
const LogoContext = createContext();

// Custom hook to use the logo context
export const useLogo = () => useContext(LogoContext);

// Provider Component
export const LogoProvider = ({ children }) => {
    const [logo, setLogo] = useState("");

    // Function to fetch settings and update the logo state
    const fetchLogo = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
            
            if (data.logo) {
                setLogo(`${data.logo}?t=${new Date().getTime()}`); // Cache-buster
            }
        } catch (error) {
            console.error("[DEBUG] Error fetching logo:", error);
        }
    };
    

    // Function to update the logo when changed in settings
    const updateLogo = (newLogoUrl) => {
        console.log("[DEBUG] Updating logo in context:", newLogoUrl);
        setLogo(newLogoUrl);
    };
    

    // Fetch logo when component mounts
    useEffect(() => {
        fetchLogo();
    }, []);

    return (
        <LogoContext.Provider value={{ logo, updateLogo }}>
            {children}
        </LogoContext.Provider>
    );
};
