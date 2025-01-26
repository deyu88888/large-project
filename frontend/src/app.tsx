import { BrowserRouter } from "react-router-dom";
import { Routes } from "./routes";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export function App() {

    return (
        <BrowserRouter>
            <Routes />
        </BrowserRouter>
    );
}

