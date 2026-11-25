const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:27791",
    launchOptions: process.env.LEAF_BROWSER_EXECUTABLE
      ? { executablePath: process.env.LEAF_BROWSER_EXECUTABLE }
      : {},
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 27791 --strictPort",
    url: "http://127.0.0.1:27791",
    env: { VITE_BACKEND_URL: "http://127.0.0.1:27790/api" },
    reuseExistingServer: !process.env.CI,
  },
});
