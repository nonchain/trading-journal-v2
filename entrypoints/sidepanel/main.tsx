import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from '@/components/providers/app-providers';
import { SidepanelApp } from './App';
import '@/assets/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders compact>
      <SidepanelApp />
    </AppProviders>
  </React.StrictMode>,
);
