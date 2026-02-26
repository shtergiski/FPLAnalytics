import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react'; //
import './styles/index.css';
import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics /> {/* This tracks visitors on your live site */}
  </StrictMode>
);