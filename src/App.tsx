import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Dashboard, ProtectedRoute } from './pages/Dashboard';
import Patients from './pages/Patients';
import AddPatient from './pages/AddPatient';
import PatientProfile from './pages/PatientProfile';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pacientes" 
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pacientes/novo" 
          element={
            <ProtectedRoute>
              <AddPatient />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pacientes/:id" 
          element={
            <ProtectedRoute>
              <PatientProfile />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
