import { createBrowserRouter } from "react-router";
import { Loader2 } from "lucide-react";
import App from "./App";
import GalleryRoute, { galleryLoader } from "./routes/GalleryRoute";
import SandboxRoute, { sandboxLoader } from "./routes/SandboxRoute";

// A sleek, minimal loading screen that matches our global CSS
const GlobalFallback = () => (
    <div className="app-shell" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-tertiary)" }}>
            <Loader2 size={32} className="spin" />
            <span style={{ fontWeight: 500, fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Decrypting Vault...
            </span>
        </div>
    </div>
);

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        hydrateFallbackElement: <GlobalFallback />, // Tells React Router what to show during initial load
        children: [
            {
                index: true,
                element: <GalleryRoute />,
                loader: galleryLoader,
            },
            {
                path: "sandbox/:experimentId",
                element: <SandboxRoute />,
                loader: sandboxLoader,
            }
        ]
    }
]);