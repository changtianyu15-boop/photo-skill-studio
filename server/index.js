import fs from "node:fs/promises";
import { createApp } from "./app.js";
import { config } from "./config.js";

await Promise.all([
  fs.mkdir(config.skillsDir, { recursive: true }),
  fs.mkdir(config.generatedDir, { recursive: true }),
  fs.mkdir(config.installingDir, { recursive: true }),
]);

const app = createApp();
app.listen(config.port, config.host, () => {
  console.log(`Photo Skill Studio: http://${config.host}:${config.port}`);
  console.log(`Image API: ${config.apiKey ? "configured" : "missing key"} · model ${config.model}`);
});
