import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import App from "../src/App";

export function renderHomepage() {
  return renderToString(
    <React.StrictMode>
      <StaticRouter location="/">
        <AuthProvider>
          <App />
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </StaticRouter>
    </React.StrictMode>
  );
}
