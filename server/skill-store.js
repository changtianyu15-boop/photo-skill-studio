import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const PREVIEW_PATTERN = /^preview\.(png|jpe?g|webp)$/i;

function validateManifest(value) {
  if (!value || typeof value !== "object") throw new Error("skill.json 必须是 JSON 对象。");
  if (!ID_PATTERN.test(value.id || "")) throw new Error("Skill id 只能包含小写字母、数字和连字符。");
  if (typeof value.name !== "string" || !value.name.trim()) throw new Error("skill.json 缺少 name。");
  if (typeof value.description !== "string" || !value.description.trim()) throw new Error("skill.json 缺少 description。");
  return {
    id: value.id,
    name: value.name.trim().slice(0, 80),
    description: value.description.trim().slice(0, 240),
    version: String(value.version || "1.0.0").slice(0, 24),
    accent: /^#[0-9a-f]{6}$/i.test(value.accent || "") ? value.accent : "#2f6fed",
    preservation: ["high", "medium", "low"].includes(value.preservation) ? value.preservation : "high",
    defaultSize: ["1024x1792", "1024x1536", "1024x1280"].includes(value.defaultSize)
      ? value.defaultSize
      : "1024x1792",
  };
}

export async function loadSkills(skillsDir) {
  await fs.mkdir(skillsDir, { recursive: true });
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const dir = path.join(skillsDir, entry.name);
      const manifest = validateManifest(JSON.parse(await fs.readFile(path.join(dir, "skill.json"), "utf8")));
      const prompt = (await fs.readFile(path.join(dir, "prompt.txt"), "utf8")).trim();
      if (!prompt) continue;
      skills.push({ ...manifest, prompt, installed: true });
    } catch {
      // Invalid folders stay isolated and do not break the whole library.
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export async function getSkill(skillsDir, id) {
  const skills = await loadSkills(skillsDir);
  return skills.find((skill) => skill.id === id) || null;
}

function normalizeEntries(zip) {
  const files = zip.getEntries().filter((entry) => !entry.isDirectory);
  if (!files.length) throw new Error("ZIP 包为空。");
  const names = files.map((entry) => entry.entryName.replaceAll("\\", "/").replace(/^\.\//, ""));
  if (names.some((name) => name.startsWith("/") || name.split("/").includes(".."))) {
    throw new Error("ZIP 包含不安全路径。");
  }
  const firstParts = names.map((name) => name.split("/")[0]);
  const prefix = firstParts.every((part) => part === firstParts[0]) && names.every((name) => name.includes("/"))
    ? `${firstParts[0]}/`
    : "";
  return files.map((entry, index) => ({ entry, name: names[index].slice(prefix.length) }));
}

export async function installSkillZip({ skillsDir, installingDir, buffer }) {
  const zip = new AdmZip(buffer);
  const entries = normalizeEntries(zip);
  const byName = new Map(entries.map((item) => [item.name.toLowerCase(), item.entry]));
  const manifestEntry = byName.get("skill.json");
  const promptEntry = byName.get("prompt.txt");
  if (!manifestEntry || !promptEntry) throw new Error("安装包根目录必须包含 skill.json 和 prompt.txt。");

  const manifest = validateManifest(JSON.parse(manifestEntry.getData().toString("utf8")));
  const prompt = promptEntry.getData().toString("utf8").trim();
  if (!prompt) throw new Error("prompt.txt 不能为空。");
  if (Buffer.byteLength(prompt, "utf8") > 100_000) throw new Error("prompt.txt 不能超过 100 KB。");

  const destination = path.join(skillsDir, manifest.id);
  try {
    await fs.access(destination);
    throw new Error(`Skill “${manifest.id}” 已存在。`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  await fs.mkdir(installingDir, { recursive: true });
  const temporary = path.join(installingDir, `${manifest.id}-${randomUUID()}`);
  await fs.mkdir(temporary, { recursive: true });
  try {
    await fs.writeFile(path.join(temporary, "skill.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await fs.writeFile(path.join(temporary, "prompt.txt"), `${prompt}\n`);
    const preview = entries.find((item) => PREVIEW_PATTERN.test(item.name));
    if (preview && preview.entry.header.size <= 2_000_000) {
      await fs.writeFile(path.join(temporary, path.basename(preview.name)), preview.entry.getData());
    }
    await fs.mkdir(skillsDir, { recursive: true });
    await fs.rename(temporary, destination);
  } catch (error) {
    await fs.rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return manifest;
}
