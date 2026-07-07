import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import TaskManager from "./TaskManager";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem("access"));
  const [view, setView] = useState<"login" | "signup">("login");

  if (loggedIn) {
    return <TaskManager onLogout={() => setLoggedIn(false)} />;
  }

  if (view === "signup") {
    return (
      <Signup
        onSuccess={() => setLoggedIn(true)}
        goToLogin={() => setView("login")}
      />
    );
  }

  return (
    <Login
      onSuccess={() => setLoggedIn(true)}
      goToSignup={() => setView("signup")}
    />
  );
}