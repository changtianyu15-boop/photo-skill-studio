import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { buildApiUrl } from "../server/image-api.js";
import { generateImage } from "../server/image-api.js";

test("buildApiUrl preserves an existing v1 path", () => {
  assert.equal(buildApiUrl("https://example.com/v1/", "/images/edits"), "https://example.com/v1/images/edits");
});

test("buildApiUrl appends v1 when absent", () => {
  assert.equal(buildApiUrl("https://example.com", "/images/edits"), "https://example.com/v1/images/edits");
});

test("generateImage sends a compatible multipart edit and saves the response", async (context) => {
  let requestBody = Buffer.alloc(0);
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requestBody = Buffer.concat(chunks);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ data: [{ b64_json: png }] }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => server.close());

  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "photo-output-"));
  context.after(() => fs.rm(temp, { recursive: true, force: true }));
  const address = server.address();
  const result = await generateImage({
    config: {
      apiKey: "test-key",
      baseUrl: `http://127.0.0.1:${address.port}/v1`,
      model: "gpt-image-2",
      imageTimeoutMs: 5000,
      generatedDir: temp,
    },
    skill: { id: "test-skill", name: "Test Skill", prompt: "Edit Image 1." },
    image: { buffer: Buffer.from("fake-png"), mimetype: "image/png", originalname: "source.png" },
    size: "1024x1792",
    note: "Keep the subject.",
  });

  const multipart = requestBody.toString("utf8");
  assert.match(multipart, /name="model"/);
  assert.match(multipart, /gpt-image-2/);
  assert.match(multipart, /name="size"/);
  assert.match(multipart, /1024x1792/);
  assert.match(multipart, /name="image"; filename="source.png"/);
  assert.doesNotMatch(multipart, /name="quality"/);
  assert.equal((await fs.stat(path.join(temp, result.filename))).size > 0, true);
});
