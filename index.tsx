import React from 'react';
import ReactDOM from 'react-dom/client';
import { DataProvider } from './context/DataContext';
import { StudentProvider } from './context/StudentContext';
import { SyllabusProvider } from './context/SyllabusContext';
import { WorkPoolProvider } from './context/WorkPoolContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { VideoLibraryProvider } from './context/VideoLibraryContext';
import { SheetProvider } from './context/SheetContext';
import AuthWrapper from './components/auth/AuthWrapper';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DataProvider>
      <StudentProvider>
        <SyllabusProvider>
          <SheetProvider>
            <VideoLibraryProvider>
              <WorkPoolProvider>
                <AttendanceProvider>
                  <AuthWrapper />
                </AttendanceProvider>
              </WorkPoolProvider>
            </VideoLibraryProvider>
          </SheetProvider>
        </SyllabusProvider>
      </StudentProvider>
    </DataProvider>
  </React.StrictMode>
);