import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navigation/Navbar';
import { ToastContainer } from './components/Toast/ToastContainer';
import { CookModePage } from './pages/CookModePage';
import { PantryPage } from './pages/PantryPage';
import { ProfilePage } from './pages/ProfilePage';
import { RecipesPage } from './pages/RecipesPage';
import { ScanFlowPage } from './pages/ScanFlowPage';
import { api } from './services/api';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const setPantryStock = useAppStore((state) => state.setPantryStock);
  const addToast = useAppStore((state) => state.addToast);

  useEffect(() => {
    void api.fetchPantryInventory()
      .then((inventory) => setPantryStock([...inventory.activeStock, ...inventory.expiringSoon]))
      .catch(() => addToast('Could not load pantry inventory.', 'error'));
  }, [setPantryStock, addToast]);

  return (
    <BrowserRouter>
      <div className="app-layout-wrapper">
        <Navbar />
        <Routes>
          {/* Section 2: App Routing & Page Map */}
          <Route path="/" element={<ScanFlowPage />} />
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
