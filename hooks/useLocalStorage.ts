import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export function useLocalStorage(key: string, initialValue = "") {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    AsyncStorage.getItem(key).then((stored) => {
      if (stored !== null) setValue(stored);
    });
  }, [key]);

  const saveValue = async (nextValue: string) => {
    setValue(nextValue);
    await AsyncStorage.setItem(key, nextValue);
  };

  return { value, setValue: saveValue };
}
