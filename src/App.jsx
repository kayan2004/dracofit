import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./App.css";
import "./index.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmailVerification from "./pages/EmailVerification";
import WaitingForVerification from "./pages/WaitingForVerification";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import Exercises from "./pages/Exercises";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Exercise from "./pages/Exercise";
import Workouts from "./pages/Workouts.jsx";
import EditSchedule from "./pages/EditSchedule";
import WorkoutForm from "./components/workouts/WorkoutForm";
import NavigationBar from "./components/common/NavigationBar";
import Chatbot from "./pages/Chatbot";
import ProfileSetup from "./pages/ProfileSetup";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutSummary from "./pages/WorkoutSummary";
import Friends from "./pages/Friends";
import FriendFeed from "./pages/FriendFeed";
import ExerciseProgressPage from "./pages/ExerciseProgressPage";

function App() {
  return (
    <BrowserRouter>
      <div className="pb-20  bg-dark-slate-gray">
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route
              path="/waiting-verification"
              element={<WaitingForVerification />}
            />
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/exercises/:id" element={<Exercise />} />
              <Route
                path="/exercises/:exerciseId/progress"
                element={<ExerciseProgressPage />}
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route
                path="/workout-session/:workoutId"
                element={<WorkoutSession />}
              />
              <Route
                path="/workout-summary/:workoutLogId"
                element={<WorkoutSummary />}
              />
              <Route path="/friends" element={<Friends />} />
              <Route path="/feed" element={<FriendFeed />} />
            </Route>
            {/* Workout routes */}
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/:id" element={<Workouts />} />
            <Route path="/workouts/create" element={<WorkoutForm />} />
            <Route path="/workouts/edit/:id" element={<WorkoutForm />} />
            <Route path="/schedule" element={<EditSchedule />} />
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </AuthProvider>
      </div>

      {/* Navigation Bar fixed at bottom */}
      <NavigationBar />
    </BrowserRouter>
  );
}

export default App;
