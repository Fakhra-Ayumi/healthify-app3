import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AppShell from './layouts/AppShell';
import Profile from './pages/Profile';
import RoutineBuilder from './pages/RoutineBuilder';
import Milestones from './pages/Milestones';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* App major routes grouped under /app so root stays on authentication page */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<RoutineBuilder />} />
          <Route path="milestones" element={<Milestones />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Setting the default entry to be login */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;