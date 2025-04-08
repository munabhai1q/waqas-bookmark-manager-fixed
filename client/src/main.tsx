import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// Initialize Font Awesome library
library.add(fas);

createRoot(document.getElementById("root")!).render(<App />);
