import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Members from './pages/Members.tsx';
import Loans from './pages/Loans.tsx';
import Transactions from './pages/Transactions.tsx';
import MemberDetails from './pages/MemberDetails.tsx';
import PageTransition from './components/PageTransition'; // Assuming I'll wrap pages individually or use it here
import { theme } from './theme';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <PageTransition><Login /></PageTransition>
        } />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <PageTransition><Dashboard /></PageTransition>
          } />
          <Route path="members" element={
            <PageTransition><Members /></PageTransition>
          } />
          <Route path="loans" element={
            <PageTransition><Loans /></PageTransition>
          } />
          <Route path="members/:id" element={
            <PageTransition><MemberDetails /></PageTransition>
          } />
          <Route path="transactions" element={
            <PageTransition><Transactions /></PageTransition>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
