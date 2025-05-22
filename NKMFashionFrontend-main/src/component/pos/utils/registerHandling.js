import axios from "axios";

export const handlePopupOpen = (setIsPopupOpen) => {
    setIsPopupOpen(true);
};

export const handlePopupClose = async (setIsPopupOpen, navigate) => {
    try {
        const id = sessionStorage.getItem('cashRegisterID');
        if (id) {
            const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/closeRegister/${id}`);
            if (response.status === 200) {
                sessionStorage.removeItem('cashRegisterID'); 
                navigate('/dashboard');
            }
        } else {
            alert("No cashRegisterID found in local storage.");
            console.error("No cashRegisterID found in local storage.");
        }
    } catch (error) {
        alert("Error closing the register.");
        console.error("Error closing the register:", error);
    } finally {
        setIsPopupOpen(false);
    }
};

