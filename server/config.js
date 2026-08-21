import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const sourceUrl = import.meta?.url;
const here = sourceUrl ? path.dirname(fileURLToPath(sourceUrl)) : process.cwd();
const bundledRoot = process.env.LAMBDA_TASK_ROOT || process.cwd();
const rootCandidates = [
  process.env.PHOTO_SKILL_ROOT,
  bundledRoot,
  process.cwd(),
  path.resolve(here, ".."),
  path.resolve(here, "../.."),
  "/var/task",
  "/var",
].filter(Boolean);
const detectedRoot = rootCandidates.find((root) => fs.existsSync(path.join(root, "skills")));
export const projectRoot = detectedRoot || (process.env.NETLIFY === "true" ? bundledRoot : path.resolve(here, ".."));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

// Project settings take priority; the existing Canvas skill config is a local fallback.
loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(os.homedir(), ".canvas-draw-image.env"));

export const config = {
  host: process.env.HOST || "127.0.0.1",
  port: Number.parseInt(process.env.PORT || "4317", 10),
  apiKey: process.env.CANVAS_API_KEY || process.env.OPENAI_API_KEY || "",
  baseUrl: process.env.CANVAS_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com",
  model: process.env.CANVAS_IMAGE_MODEL || "gpt-image-2",
  imageTimeoutMs: Number.parseInt(process.env.IMAGE_TIMEOUT_MS || "600000", 10),
  skillsDir: path.join(projectRoot, "skills"),
  generatedDir: path.join(projectRoot, "data", "generated"),
  installingDir: path.join(projectRoot, "data", "installing"),
};
