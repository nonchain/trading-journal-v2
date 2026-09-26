import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from '@/components/providers/app-providers';
import { DashboardApp } from '@/components/dashboard/dashboard-app';
import '@/assets/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <DashboardApp />
    </AppProviders>
  </React.StrictMode>,
);
