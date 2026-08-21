import path from "node:path";
import express from "express";
import multer from "multer";
import { config, projectRoot } from "./config.js";
import { generateImage, ImageApiError } from "./image-api.js";
import { getSkill, installSkillZip, loadSkills } from "./skill-store.js";

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});
const uploadPackage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
const allowedSizes = new Set(["1024x1792", "1024x1536", "1024x1280"]);

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use((_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; connect-src 'self'");
    next();
  });
  app.use(express.json({ limit: "200kb" }));

  app.get("/api/health", (_request, response) => {
    let upstream = "未配置";
    try { upstream = new URL(config.baseUrl).host; } catch { /* keep fallback */ }
    response.json({ ok: true, configured: Boolean(config.apiKey), model: config.model, upstream });
  });

  app.get("/api/skills", async (_request, response, next) => {
    try {
      const skills = await loadSkills(config.skillsDir);
      response.json({ skills: skills.map(({ prompt: _prompt, ...skill }) => skill) });
    } catch (error) { next(error); }
  });

  app.post("/api/skills/install", uploadPackage.single("package"), async (request, response, next) => {
    try {
      if (!request.file || !request.file.originalname.toLowerCase().endsWith(".zip")) {
        return response.status(400).json({ error: "请选择 ZIP Skill 安装包。" });
      }
      const skill = await installSkillZip({
        skillsDir: config.skillsDir,
        installingDir: config.installingDir,
        buffer: request.file.buffer,
      });
      response.status(201).json({ skill });
    } catch (error) { next(error); }
  });

  app.post("/api/generate", uploadImage.single("image"), async (request, response, next) => {
    try {
      if (!request.file) return response.status(400).json({ error: "请上传 JPG、PNG 或 WebP 图片。" });
      const skill = await getSkill(config.skillsDir, String(request.body.skillId || ""));
      if (!skill) return response.status(404).json({ error: "找不到所选 Skill。" });
      const size = allowedSizes.has(request.body.size) ? request.body.size : skill.defaultSize;
      const note = String(request.body.note || "").trim().slice(0, 500);
      const result = await generateImage({ config, skill, image: request.file, size, note });
      response.status(201).json({ result });
    } catch (error) { next(error); }
  });

  app.use("/generated", express.static(config.generatedDir, { fallthrough: false, maxAge: "7d" }));
  app.use("/vendor", express.static(path.join(projectRoot, "node_modules", "lucide", "dist", "umd"), { fallthrough: false }));
  app.get("/SKILL_PACKAGE.md", (_request, response) => response.sendFile(path.join(projectRoot, "SKILL_PACKAGE.md")));
  app.use(express.static(path.join(projectRoot, "public")));
  app.get("*path", (_request, response) => response.sendFile(path.join(projectRoot, "public", "index.html")));

  app.use((error, _request, response, _next) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE" ? "文件超过大小限制。" : "文件上传失败。";
      return response.status(400).json({ error: message });
    }
    const status = error instanceof ImageApiError ? error.status : 400;
    console.error(`[${new Date().toISOString()}] ${error.name || "Error"}: ${error.message}`);
    response.status(status).json({ error: error.message || "请求失败。" });
  });
  return app;
}
