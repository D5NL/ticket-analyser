import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check lokale opslag voor bestaande voorkeur
    const savedMode = localStorage.getItem('darkMode');
    // Check systeem voorkeur als er geen opgeslagen voorkeur is
    if (savedMode === null) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // Anders gebruik de opgeslagen voorkeur
    return savedMode === 'true';
  });

  useEffect(() => {
    // Update HTML element class wanneer dark mode verandert
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Sla voorkeur op in lokale opslag
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return { isDarkMode, toggleDarkMode };
}; 
