import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the warning limit to avoid warnings for reasonable-sized chunks
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      external: (id) => {
        const normalized = id.replace(/\\/g, "/");
        return (
          normalized.includes("__test__/") ||
          /\.test\.(t|j)sx?$/.test(normalized)
        );
      },
      output: {
        manualChunks: (id) => {
          // Create separate chunks for different parts of MUI
          if (id.includes('node_modules')) {
            // Split MUI into smaller chunks
            if (id.includes('@mui/material')) {
              // Core components
              if (id.includes('/Grid') || id.includes('/Box') || id.includes('/Container')) {
                return 'mui-layout';
              }
              // Form components
              if (id.includes('/Button') || id.includes('/TextField') || id.includes('/Select') || id.includes('/Checkbox')) {
                return 'mui-form';
              }
              // Feedback components
              if (id.includes('/Snackbar') || id.includes('/Alert') || id.includes('/Dialog') || id.includes('/CircularProgress')) {
                return 'mui-feedback';
              }
              // Navigation components
              if (id.includes('/Tabs') || id.includes('/Tab') || id.includes('/AppBar') || id.includes('/Drawer')) {
                return 'mui-navigation';
              }
              // Surface components
              if (id.includes('/Paper') || id.includes('/Card') || id.includes('/List')) {
                return 'mui-surfaces';
              }
              return 'mui-core';
            }

            // Split MUI styling
            if (id.includes('@mui/system') || id.includes('@emotion')) {
              return 'mui-system';
            }

            // Split icon libraries
            if (id.includes('react-icons')) {
              // Split by icon set
              if (id.includes('/fa/')) {
                return 'icons-fa';
              }
              if (id.includes('/md/')) {
                return 'icons-md';
              }
              if (id.includes('/io/')) {
                return 'icons-io';
              }
              return 'icons-other';
            }

            // React and related libraries
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            if (id.includes('react') && !id.includes('react-icons')) {
              return 'react-core';
            }

            // Utility libraries
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('moment') || id.includes('dayjs')) {
              return 'utils';
            }

            // Default vendor chunk for remaining node_modules
            return 'vendor';
          }
          
          // Application code chunks
          if (id.includes('/pages/')) {
            const segment = id.split('/pages/')[1].split('/')[0];
            return `page-${segment.toLowerCase()}`;
          }
          
          if (id.includes('/components/')) {
            return 'components';
          }
          
          if (id.includes('/api/') || id.includes('/services/')) {
            return 'api-services';
          }
          
          if (id.includes('/stores/') || id.includes('/state/') || id.includes('/context/')) {
            return 'state-management';
          }
        }
      }
    },
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src"],
      exclude: [
        "node_modules",
        "src/test/setup.ts",
        "**/*.d.ts",
        "**/types/**/*.ts",
        "src/types/**",
        "dist",
        "src/assets",
        "src/routes",
      ],
    },
  },
});