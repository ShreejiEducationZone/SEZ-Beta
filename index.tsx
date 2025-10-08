import React from 'react';
import ReactDOM from 'react-dom/client';
import { DataProvider } from './context/DataContext';
import AuthWrapper from './pages/Auth/AuthWrapper';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DataProvider>
      <AuthWrapper />
    </DataProvider>
  </React.StrictMode>
);