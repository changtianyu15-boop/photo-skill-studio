import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { installSkillZip, loadSkills } from "../server/skill-store.js";

test("loadSkills ignores invalid folders and returns valid declarative skills", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "photo-skills-"));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "valid"));
  await fs.writeFile(path.join(root, "valid", "skill.json"), JSON.stringify({
    id: "valid-skill",
    name: "Valid",
    description: "Valid test skill",
  }));
  await fs.writeFile(path.join(root, "valid", "prompt.txt"), "Create an image from Image 1.");
  await fs.mkdir(path.join(root, "broken"));

  const skills = await loadSkills(root);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].id, "valid-skill");
});

test("installSkillZip installs only the declarative package", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "photo-skills-"));
  const skillsDir = path.join(root, "skills");
  const installingDir = path.join(root, "installing");
  context.after(() => fs.rm(root, { recursive: true, force: true }));

  const zip = new AdmZip();
  zip.addFile("sample/skill.json", Buffer.from(JSON.stringify({
    id: "sample-skill",
    name: "Sample",
    description: "Installed from a zip",
  })));
  zip.addFile("sample/prompt.txt", Buffer.from("Use Image 1 as the source."));
  zip.addFile("sample/run.js", Buffer.from("throw new Error('must not be installed')"));

  const result = await installSkillZip({ skillsDir, installingDir, buffer: zip.toBuffer() });
  assert.equal(result.id, "sample-skill");
  assert.equal(await fs.readFile(path.join(skillsDir, "sample-skill", "prompt.txt"), "utf8"), "Use Image 1 as the source.\n");
  await assert.rejects(fs.access(path.join(skillsDir, "sample-skill", "run.js")));
});
