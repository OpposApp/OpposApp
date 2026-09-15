import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { PrivyProvider } from "./providers/PrivyProvider.jsx";
import { DocsPage } from "./pages/Docs.jsx";
import { MintPage } from "./pages/Mint.jsx";
import { NotFoundPage } from "./pages/NotFound.jsx";
import { RewardsPage } from "./pages/Rewards.jsx";
import { OfficePage } from "./pages/Office.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PrivyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OfficePage />} />
          <Route path="/office" element={<Navigate to="/" replace />} />
          <Route element={<Layout />}>
            <Route path="/mint" element={<MintPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PrivyProvider>
  </StrictMode>,
);
