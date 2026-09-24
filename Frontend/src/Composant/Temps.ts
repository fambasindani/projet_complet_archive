// @ts-nocheck
// Composant/Temps.jsx
import { useEffect, useRef } from 'react';
import { toast } from "./Toast";
const IdleTimer = ({ timeout = 10 * 60 * 1000, onLogout }) => { // 1 minute pour test
  const timerRef = useRef(null);
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  };

  const handleLogout = () => {
    // Afficher une alerte avant déconnexion
    toast.warning(`Vous avez été inactif pendant ${timeout / 60000} minutes. Vous allez être déconnecté.`); if (true) {
      // Appeler la fonction onLogout passée en props
      if (onLogout) {
        onLogout();
      }
    };
  };

  useEffect(() => {
    // Initialiser le timer
    resetTimer();

    // Ajouter les event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []); // Dépendances vides = s'exécute une seule fois au montage

  return null; // Ce composant ne rend rien
};

export default IdleTimer;