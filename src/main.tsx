import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      // Periodically check for service worker updates (e.g. every hour)
      setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.warn('G-SENSE SW registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
