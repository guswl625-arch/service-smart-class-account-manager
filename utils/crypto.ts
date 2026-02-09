
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'smart_class_encrypted_v1';

export const EncryptionService = {
  // Use a fixed system salt combined with the teacher's code
  generateKey(masterCode: string): string {
    return CryptoJS.SHA256(masterCode + "smart-class-system-salt").toString();
  },

  hasData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  // Encrypt entire state for local storage
  encrypt(data: any, masterCode: string): void {
    const key = this.generateKey(masterCode);
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, key).toString();
    localStorage.setItem(STORAGE_KEY, encrypted);
  },

  decrypt(masterCode: string): any | null {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;

    try {
      const key = this.generateKey(masterCode);
      const bytes = CryptoJS.AES.decrypt(encrypted, key);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) return null;
      return JSON.parse(decryptedStr);
    } catch (e) {
      // Silent fail is expected when trying multiple codes
      return null;
    }
  },

  // Encrypt a single string (for cloud storage)
  encryptString(text: string, masterCode: string): string {
    if (!text) return "";
    const key = this.generateKey(masterCode);
    return CryptoJS.AES.encrypt(text, key).toString();
  },

  // Decrypt a single string (from cloud storage)
  decryptString(encryptedText: string, masterCode: string): string {
    if (!encryptedText) return "";
    try {
      const key = this.generateKey(masterCode);
      const bytes = CryptoJS.AES.decrypt(encryptedText, key);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedStr || encryptedText;
    } catch (e) {
      return encryptedText; // Fallback to raw if decryption fails (e.g. legacy data)
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
