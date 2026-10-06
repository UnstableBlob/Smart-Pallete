import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navigation/Navbar';
import { ToastContainer } from './components/Toast/ToastContainer';
import { CameraScanPage } from './pages/CameraScanPage';
import { RecipesPage } from './pages/RecipesPage';
import { CookModePage } from './pages/CookModePage';
import { PantryPage } from './pages/PantryPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-layout-wrapper">
        <Navbar />
        <Routes>
          {/* Section 2: App Routing & Page Map */}
          <Route path="/" element={<CameraScanPage />} />
          <Route path="/scan" element={<Navigate to="/" replace />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/cook/:recipeId" element={<CookModePage />} />
          <Route path="/pantry" element={<PantryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
};

export default App;
