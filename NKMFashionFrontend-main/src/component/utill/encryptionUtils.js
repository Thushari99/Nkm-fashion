// encryptionUtils.js
import CryptoJS from 'crypto-js';


const secretKey = 'zxcvb';

// Encrypt data
export const encryptData = (data) => {
  try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
      return encrypted;
  } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
  }
};

export const decryptData = (cipherText) => {
  try {
      const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
  } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
  }
};
