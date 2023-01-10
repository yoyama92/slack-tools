import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const serverHost = process.env["SERVER_HOST"];
const serverPort = process.env["SERVER_PORT"];
export default defineConfig({
  root: "./",
  server: {
    port: parseInt(process.env.PORT || "8080"),
    host: true,
    proxy: {
      "/api": {
        target: `http://${serverHost}:${serverPort}`,
        secure: false,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
