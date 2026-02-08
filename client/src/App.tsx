import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AppShell from './layouts/AppShell';
import Profile from './pages/Profile';

const RoutineBuilder = () => <div>Routine Builder</div>;
const Milestones = () => <div>Milestones</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* App routes */}
        <Route element={<AppShell />}>
          <Route path="/" element={<RoutineBuilder />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;