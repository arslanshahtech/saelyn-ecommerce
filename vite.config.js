import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// React plugin lets Vite process JSX and refresh the page during development.
export default defineConfig({ plugins: [react()] });