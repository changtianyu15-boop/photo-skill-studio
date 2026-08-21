# Photo Skill Studio

一个本地运行的照片风格生成工作台。用户上传一张照片，选择一个或多个 Skill，浏览器会并行调用后端；后端读取本地 Skill 提示词并通过 OpenAI 兼容的 `/v1/images/edits` 接口生成图片。

界面采用高留白案例叙事视觉：`#f8f8f8` 纸白背景、黑色信息带、红色操作信号、超大标题、窄正文列和宽幅照片舞台。设计语言参考 [Awwwards 上的 Mastercard Business Outcomes 案例页](https://www.awwwards.com/mastercard-business-outcomes-making-the-invisible-visible.html)，但不包含其品牌、图片、文案、视频、Cookies 或第三方功能。

## 已包含功能

- JPG、PNG、WebP 上传与本地预览，最大 15 MB。
- 四个内置风格：Photo Relic、Minimal Zine、Gathered Scenes、Photo Abstract。
- 多 Skill 并行生成、独立状态、失败重试和结果下载。
- 三种竖版尺寸与最多 500 字的补充要求。
- 本地 Skill 库自动发现。
- ZIP Skill 包安装，包含路径穿越防护、大小限制和声明校验。
- API key 只在后端读取，不会发送到浏览器。
- 生成结果保存在 `data/generated/`。

## 启动

```powershell
cd C:\Users\luo\Documents\ChatGPT\绘pencil\photo-skill-studio
npm install
npm start
```

打开 `http://127.0.0.1:4317`。

应用先读取项目根目录的 `.env`。若不存在，则会读取当前用户目录里的 `~/.canvas-draw-image.env`，因此本机已配置的 `canvas-draw-image` 接口可以直接复用。

如需独立配置：

```powershell
Copy-Item .env.example .env
```

然后填写：

```dotenv
CANVAS_API_KEY=your-key
CANVAS_BASE_URL=https://your-provider.example/v1
CANVAS_IMAGE_MODEL=gpt-image-2
```

当前兼容上游不应发送 `quality` 参数，因此后端只发送 `model`、`prompt`、`n`、`response_format`、`output_format`、`size` 和图片文件。

## Skill 库

每个 Skill 位于 `skills/<skill-id>/`，至少包含：

```text
skill.json
prompt.txt
```

网页右上角的“安装 Skill”支持符合 [SKILL_PACKAGE.md](./SKILL_PACKAGE.md) 规范的 ZIP 包。也可以直接把解压目录放到 `skills/` 后刷新网页。

## API

- `GET /api/health`：接口配置状态，不返回密钥。
- `GET /api/skills`：列出已安装 Skill，不返回完整提示词。
- `POST /api/generate`：单个 Skill 图片生成，前端并行提交多个请求。
- `POST /api/skills/install`：安装声明式 ZIP Skill 包。
- `GET /generated/:filename`：读取本地生成结果。

## 测试

```powershell
npm test
```

测试不调用外部图片接口。

本地视觉回归可运行：

```powershell
$env:QA_SOURCE_IMAGE='C:\path\to\photo.jpg'
npm run qa:local
```

该检查覆盖 1440、768、390 三档视口、上传状态、Skill 数量、安装弹窗、横向溢出和浏览器控制台错误，不会提交生图请求。
