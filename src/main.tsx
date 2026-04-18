import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { activeTenant } from "@/data/tenant";

// Tenant-aware document title
document.title = `${activeTenant.app_name}`;

createRoot(document.getElementById("root")!).render(<App />);
