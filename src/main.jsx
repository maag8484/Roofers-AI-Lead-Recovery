import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import App from "./App";
import "./index.css";

import { referralCode } from "@/lib/pilot";
referralCode();

const root = document.getElementById("root");
const application = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Only the public homepage is pre-rendered. Other routes retain their empty
// app shell and existing authentication flow.
if (window.location.pathname === "/" && root.hasAttribute("data-prerendered-homepage")) {
  ReactDOM.hydrateRoot(root, application);
} else {
  ReactDOM.createRoot(root).render(application);
}
