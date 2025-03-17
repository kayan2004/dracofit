import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmailVerification from "./pages/EmailVerification";
import WaitingForVerification from "./pages/WaitingForVerification";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
// Import other pages as needed

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        // Add these routes to your existing routes
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/waiting-verification"
          element={<WaitingForVerification />}
        />
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Add a catch-all route that redirects to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
