import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CmsApp from './App.jsx';
import '../index.css';
import './cms.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CmsApp />
  </StrictMode>
);
