import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App";
import store from "./store";
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-left"
          toastOptions={{
            // Define default options
            duration: 4000,
            style: {
              borderRadius: "8px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "14px",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
