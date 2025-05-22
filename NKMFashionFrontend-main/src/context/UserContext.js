import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { encryptData, decryptData } from '../component/utill/encryptionUtils'; 
import CryptoJS from 'crypto-js';

const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [userData, setUserDataState] = useState(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const decryptedUser = decryptData(encryptedUser);
                return decryptedUser;
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
                sessionStorage.removeItem('user'); // Clear invalid data
            }
        }
        return null;
    });

    useEffect(() => {
        const encryptedToken = sessionStorage.getItem('token');
        if (encryptedToken) {
            try {
                const bytes = CryptoJS.AES.decrypt(encryptedToken, 'lpgsnsgd');
                const token = bytes.toString(CryptoJS.enc.Utf8);
    
                if (token) {
                    setUserData(token); 
                } else {
                    console.error('Failed to decrypt token. Decrypted result is empty.');
                }
            } catch (error) {
                // console.error('Error decrypting token:', error);
            }
        } else {
            // console.error('No token found in sessionStorage.');
        }
    }, []);    

    const setUserData = async (token) => {
        if (token) {
            try {
                // Fetch user data from the backend
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const fetchedUserData = response.data;
            
                const encryptedUser = encryptData(fetchedUserData);
                sessionStorage.setItem('user', encryptedUser);
                setUserDataState(fetchedUserData); // Update state
            } catch (error) {
                console.error('Error fetching user data:', error);
                clearUserData();
            }
        }
    };

    const clearUserData = () => {
        setUserDataState(null);
        sessionStorage.removeItem('user'); // Remove encrypted user data
        sessionStorage.removeItem('token'); // Remove token
    };

    return (
        <UserContext.Provider value={{ userData, setUserData, clearUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export { UserProvider, UserContext };