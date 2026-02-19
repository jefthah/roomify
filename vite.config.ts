import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const workerUrl = env.VITE_PUTER_WORKER_URL || "";

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
      proxy: {
        "/worker-api": {
          target: workerUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/worker-api/, ""),
        },
      },
    },
  };
});
