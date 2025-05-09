import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/App.css";

// Render the app component on the html page
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
