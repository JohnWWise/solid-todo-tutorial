// App.js

import React from "react";
import { LoginButton } from "@inrupt/solid-ui-react";

const authOptions = {
  clientName: "Solid Todo App",
};

function App() {
  return (
    <div className="app-container">
      <h1>Welcome to Solid Todo</h1>
      <LoginButton
        oidcIssuer="https://login.inrupt.com"
        redirectUrl={window.location.href}
        authOptions={authOptions}
      />
    </div>
  );
}

export default App;
