// index.js

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SessionProvider } from "@inrupt/solid-ui-react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <SessionProvider>
    <App />
  </SessionProvider>
);
