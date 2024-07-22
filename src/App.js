import React,{useEffect} from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { HashRouter as Router } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import AdminDashboard from './components/admin/adminDashboard/AdminDashboard';
import PortfolioPage from './components/portfolio/PortfolioPage';
import EditPortfolio from './components/admin/editPortfolio/EditPortfolio';
import ProtectedRoute from './components/auth/ProtectedRoute';


function App() {
  // useEffect(() => {
  //   window.scrollTo(0, 0);
  // }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/edit-portfolio" element={
          <ProtectedRoute>
            <EditPortfolio />
          </ProtectedRoute>
        } />
        <Route path="/portfolio/:username" element={<PortfolioPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;