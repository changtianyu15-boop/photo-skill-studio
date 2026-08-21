# Photo Skill Studio 安装包格式

网站使用声明式 Skill 包，不会执行 ZIP 里的 JavaScript、Python、Shell 或安装脚本。这样新增风格时只需提供元数据和生图提示词。

## 目录结构

ZIP 根目录可以直接包含以下文件，也可以只套一层同名文件夹：

```text
my-photo-skill.zip
├── skill.json
├── prompt.txt
└── preview.png       # 可选，最大 2 MB
```

`skill.json` 示例：

```json
{
  "id": "my-photo-skill",
  "name": "My Photo Skill",
  "description": "一句简短的中文风格说明。",
  "version": "1.0.0",
  "accent": "#2f6fed",
  "preservation": "high",
  "defaultSize": "1024x1792"
}
```

字段规则：

- `id`：2–63 位小写字母、数字和连字符，且必须以字母或数字开头。
- `name`：界面显示名称。
- `description`：界面显示的风格说明。
- `version`：可选，默认 `1.0.0`。
- `accent`：可选，六位十六进制颜色。
- `preservation`：可选值为 `high`、`medium` 或 `low`。
- `defaultSize`：可选值为 `1024x1792`、`1024x1536` 或 `1024x1280`。

`prompt.txt` 是发送给图片编辑接口的完整基础提示词。提示词中用 `Image 1` 指代用户上传的照片，并清晰说明照片保真范围、允许变化、视觉构图和禁止项。用户在界面填写的补充要求会附加到基础提示词末尾。

## 手工安装

也可以把解压后的 Skill 文件夹直接放到项目的 `skills/` 目录，然后刷新网页。后端每次请求都会重新扫描 Skill 库，不需要重启服务。

## Codex Skill 兼容边界

Codex 的完整 `SKILL.md` 可能包含多阶段工作流、脚本、引用文件和工具调用，不能直接作为网站提示词安全执行。要迁移这类 Skill，请保留原 Skill 的视觉规则，把最终生图规则整理到本格式的 `prompt.txt` 中；原包可以作为资料保存，但网站只加载上述声明文件。
