import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/globals.css";
import "./styles/design-system.css";
import App from "./App";

import Providers from "./providers";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
