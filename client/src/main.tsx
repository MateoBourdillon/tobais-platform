// Debe importarse antes que App: parchea fetch para apuntar a la API remota.
import "./lib/api-base";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
