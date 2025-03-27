const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) walk(fullPath, callback);
    else if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) callback(fullPath);
  });
}

walk("src", (filePath) => {
  let content = fs.readFileSync(filePath, "utf-8");

  if (content.includes("import axios from 'axios'") && !content.includes("jest.mock('axios')")) {
    content = content.replace(
      "import axios from 'axios'",
      "jest.mock('axios')\nimport axios from 'axios'\nconst mockedAxios = axios as jest.Mocked<typeof axios>"
    );
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Fixed mocks in: ${filePath}`);
  }

  if (content.includes("import apiClient from") && !content.includes("jest.mock")) {
    content = content.replace(
      /import apiClient from ['"](.+apiClient)['"]/,
      (_, modulePath) => `jest.mock('${modulePath}')\nimport apiClient from '${modulePath}'\nconst mockedApi = apiClient as jest.Mocked<typeof apiClient>`
    );
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Fixed apiClient mocks in: ${filePath}`);
  }
});