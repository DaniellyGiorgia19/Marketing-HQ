import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import app from './server/app'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "marketing-hq-api",
      configureServer(server) {
        server.middlewares.use(app)
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
