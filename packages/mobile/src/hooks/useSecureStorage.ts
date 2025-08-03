import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";

export function useSecureStorage() {
  const setItem = useCallback(async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error("Error storing secure data:", error);
      return false;
    }
  }, []);

  const getItem = useCallback(async (key: string) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error("Error retrieving secure data:", error);
      return null;
    }
  }, []);

  const deleteItem = useCallback(async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error("Error deleting secure data:", error);
      return false;
    }
  }, []);

  const removeItem = deleteItem; // Alias for consistency

  return { setItem, getItem, deleteItem, removeItem };
}