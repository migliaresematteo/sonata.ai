import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import RepertoirePage from "./components/pages/repertoire";
import Success from "./components/pages/success";
import Home from "./components/pages/home";
import Discover from "./components/pages/discover";
import ComposersPage from "./components/pages/composers";
import ComposerPage from "./components/pages/composer";
import PiecePage from "./components/pages/piece";
import MissionsPage from "./components/pages/missions";
import UserProfilePage from "./components/profile/UserProfilePage";
import SettingsPage from "./components/pages/settings";
import AITeacher from "./components/ai/AITeacher";
import { AuthProvider, useAuth } from "../supabase/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route
          path="/repertoire"
          element={
            <PrivateRoute>
              <RepertoirePage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/composers" element={<ComposersPage />} />
        <Route path="/composers/:id" element={<ComposerPage />} />
        <Route path="/pieces/:id" element={<PiecePage />} />
        <Route
          path="/missions"
          element={
            <PrivateRoute>
              <MissionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ai-teacher"
          element={
            <PrivateRoute>
              <AITeacher />
            </PrivateRoute>
          }
        />
        <Route path="/success" element={<Success />} />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
