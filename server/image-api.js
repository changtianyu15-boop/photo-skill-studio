import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export class ImageApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "ImageApiError";
    this.status = status;
  }
}

export function buildApiUrl(baseUrl, endpoint) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  const lower = normalized.toLowerCase();
  const apiBase = lower.endsWith("/v1") || lower.endsWith("/api/v3") || lower.endsWith("/api/plan/v3")
    ? normalized
    : `${normalized}/v1`;
  return `${apiBase}${endpoint}`;
}

function extractError(payload, status) {
  const values = [
    payload?.msg,
    payload?.error?.message,
    payload?.response?.error?.message,
  ];
  return values.find((value) => typeof value === "string" && value.trim())
    || `图片接口请求失败（HTTP ${status}）`;
}

function parseDataUrl(value) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) throw new ImageApiError("图片接口返回了无效的 data URL。", 502);
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function extensionFor(mimeType) {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

async function responseToImage(item, timeoutMs) {
  if (item?.b64_json) {
    return { mimeType: "image/png", buffer: Buffer.from(item.b64_json, "base64") };
  }
  const value = item?.url || item?.image_url;
  if (!value) throw new ImageApiError("图片接口没有返回可用的图片数据。", 502);
  if (value.startsWith("data:")) return parseDataUrl(value);

  const response = await fetch(value, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new ImageApiError(`下载生成图片失败（HTTP ${response.status}）。`, 502);
  const mimeType = response.headers.get("content-type") || "image/png";
  return { mimeType, buffer: Buffer.from(await response.arrayBuffer()) };
}

export async function generateImage({ config, skill, image, size, note = "" }) {
  if (!config.apiKey) throw new ImageApiError("尚未配置图片 API key。", 503);

  const prompt = note.trim()
    ? `${skill.prompt.trim()}\n\nAdditional user direction: ${note.trim()}`
    : skill.prompt.trim();

  const form = new FormData();
  form.append("model", config.model);
  form.append("prompt", `Reference image labels: Image 1. Understand Image 1 as the edit target.\n\n${prompt}`);
  form.append("n", "1");
  form.append("response_format", "b64_json");
  form.append("output_format", "png");
  form.append("size", size);
  form.append("image", new Blob([image.buffer], { type: image.mimetype }), image.originalname);

  let response;
  try {
    response = await fetch(buildApiUrl(config.baseUrl, "/images/edits"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
        "User-Agent": "photo-skill-studio/1.0",
      },
      body: form,
      signal: AbortSignal.timeout(config.imageTimeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError") {
      throw new ImageApiError("图片生成超时，请稍后重试。", 504);
    }
    throw new ImageApiError(`无法连接图片接口：${error.message}`, 502);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ImageApiError(`图片接口返回了非 JSON 响应（HTTP ${response.status}）。`, 502);
  }
  if (!response.ok || (Number.isInteger(payload?.code) && payload.code !== 0)) {
    throw new ImageApiError(extractError(payload, response.status), response.status >= 400 ? response.status : 502);
  }

  const first = Array.isArray(payload?.data) ? payload.data[0] : null;
  const generated = await responseToImage(first, config.imageTimeoutMs);
  await fs.mkdir(config.generatedDir, { recursive: true });
  const ext = extensionFor(generated.mimeType);
  const filename = `${Date.now()}-${skill.id}-${randomUUID().slice(0, 8)}.${ext}`;
  await fs.writeFile(path.join(config.generatedDir, filename), generated.buffer);

  return {
    filename,
    url: `/generated/${encodeURIComponent(filename)}`,
    skill: { id: skill.id, name: skill.name },
    size,
  };
}
