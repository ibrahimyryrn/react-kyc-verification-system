import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, rmSync } from "fs";
import { join } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "exclude-git-from-public",
      buildStart() {
        // Remove .git directory from public/models before build starts
        const publicGitPath = join(process.cwd(), "public", "models", ".git");
        if (existsSync(publicGitPath)) {
          try {
            rmSync(publicGitPath, { recursive: true, force: true });
            console.log("✅ Removed .git directory from public/models");
          } catch (error) {
            console.warn("⚠️ Could not remove .git directory:", error);
          }
        }
      },
    },
  ],
});
