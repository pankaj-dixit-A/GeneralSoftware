import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import routes from './Pages/RouterConfig';
import Navbar from './Pages/Navbar/Navbar';
import ComponentUtility from "./Components/CompoentsConfig";
import LoginForm from './Pages/Login/Login';
import Footer from './Pages/Footer/Footer';
import { AccountMasterProvider } from './Helper/AccountMasterContext';
import useSessionExpiration from './hooks/useSessionExpiration';

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  useSessionExpiration();
  const location = useLocation();
  const { pathname } = location;

  const hideNavbarPaths = ['/', '/company-list', '/create-accounting-year', '/create-company', '/ProfitLoss-Report', '/Balancesheet-Report', '/ledger-report', '/bank-book-report', '/JVReport-reports', '/daybook-report', '/Sale-registers', '/SaleTDS-registers', '/mill-rate-info-report'];

  const isAuthenticated = sessionStorage.getItem('username') !== null;

  return (
    <>
      <AccountMasterProvider hideNavbarPaths={hideNavbarPaths} >
        <div >
          {!hideNavbarPaths.includes(pathname) && <Navbar />}
        </div>
        <div className="App">

          <Routes>
            <Route path="/" element={<LoginForm />} />
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={<route.element />} />
            ))}

            {ComponentUtility.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={isAuthenticated ? <route.element /> : <Navigate to="/" />}
              />
            ))}
          </Routes>

        </div>
        {!hideNavbarPaths.includes(pathname) && <Footer />}
      </AccountMasterProvider>
    </>
  );
}

export default AppWrapper;
