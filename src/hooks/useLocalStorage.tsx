import { useCallback, useState } from "react";

export const  useLocalStorage=(key, initialState,parseToJson=false)=> {
    const [value, setValue] = useState(parseToJson ? JSON.parse(localStorage.getItem(key)): localStorage.getItem(key) ?? initialState);
    const updatedSetValue = useCallback(
      newValue => {
        if (newValue === initialState || typeof newValue === 'undefined') {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, newValue);
        }
        setValue(newValue ?? initialState);
      },
      [initialState, key]
    );
    return [value, updatedSetValue];
  }
  
   