import axios from "axios";

export const generateBillNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const randomDigits = String(Math.floor(Math.random() * 900) + 100); // Ensures a 3-digit random number

    return `${year}${month}${day}${hours}${minutes}${seconds}${randomDigits}`;
};

const billNumber = generateBillNumber();