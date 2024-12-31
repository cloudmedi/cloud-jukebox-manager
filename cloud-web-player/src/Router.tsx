import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Devices from './pages/Devices';

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Devices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};