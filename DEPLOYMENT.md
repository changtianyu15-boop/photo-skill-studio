# Photo Skill Studio 部署

## 推荐规格

这个项目只负责上传照片、读取 Skill、调用兼容图片 API 和保存结果，服务器不执行本地 AI 推理，因此不需要 GPU。

| 使用量 | 建议规格 | 说明 |
| --- | --- | --- |
| 试用、1-2 人同时操作 | 2 vCPU / 4 GB RAM / 50 GB SSD / 5 Mbps | 成本低，适合内部试用 |
| 约 10 人、偶尔并行生图 | **4 vCPU / 8 GB RAM / 80-100 GB SSD / 10 Mbps** | 推荐起步配置 |
| 10 人高频并发、结果长期保留 | 4-8 vCPU / 16 GB RAM / 100 GB SSD 起 | 同时配对象存储和清理策略 |

腾讯云可按标准型实例选择 2 核 4 GB 或 4 核 8 GB 档；官方规格表中对应 `S2.MEDIUM4`、`S2.LARGE8`。阿里云选择同等 vCPU/内存的通用型实例即可，不要为了这个项目购买 GPU 实例。最终价格会随地域、带宽、包年/按量计费变化。

实例规格可参考[腾讯云官方规格表](https://cloud.tencent.com/document/product/213/11518)。如果服务器放在中国大陆并绑定域名，开通前还要按云厂商流程完成 ICP 备案；腾讯云的[首次备案说明](https://cloud.tencent.com/document/product/243/37402)列出了前置条件。

## 上线前的访问控制

当前版本没有用户登录和按人限额。不要把 `4317` 端口直接暴露到公网，至少选择一种保护方式：

1. 只给固定 10 人使用：服务器安装 Tailscale，应用只通过 tailnet 地址访问。
2. 有域名且需要浏览器登录：用 Cloudflare Access 或同类身份代理放在 Nginx 前面，只允许这 10 个账号。
3. 临时内测：Nginx Basic Auth 可以挡住普通访问，但仍建议后续加入真正的用户和额度系统。

图片 API key 只放在服务器的环境变量文件中，不要写进前端、Git、截图或聊天记录。当前应用会把用户照片转发给上游图片服务，部署前确认团队接受这类数据处理。

## Ubuntu 24.04 部署

以下示例假设服务器系统为 Ubuntu 24.04 LTS、项目目录为 `/opt/photo-skill-studio`，域名为 `image.example.com`。

### 1. 基础软件和系统用户

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ca-certificates ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # 应为 20 或更高

sudo useradd --system --home /opt/photo-skill-studio --shell /usr/sbin/nologin photoapp
sudo mkdir -p /opt/photo-skill-studio
sudo chown -R photoapp:photoapp /opt/photo-skill-studio
```

### 2. 上传项目并安装依赖

把整个 `photo-skill-studio` 文件夹上传到 `/opt/photo-skill-studio`，或用 Git 拉取后执行：

```bash
sudo chown -R photoapp:photoapp /opt/photo-skill-studio
cd /opt/photo-skill-studio
sudo -u photoapp npm ci --omit=dev
sudo -u photoapp mkdir -p data/generated data/installing data/uploads
```

### 3. 配置图片接口

```bash
sudo tee /etc/photo-skill-studio.env >/dev/null <<'EOF'
HOST=127.0.0.1
PORT=4317
CANVAS_API_KEY=replace-with-your-image-api-key
CANVAS_BASE_URL=https://your-provider.example/v1
CANVAS_IMAGE_MODEL=gpt-image-2
IMAGE_TIMEOUT_MS=600000
EOF
sudo chmod 600 /etc/photo-skill-studio.env
```

不要把真实 key 提交到仓库。`CANVAS_BASE_URL` 填你的中转站根地址，通常保留 `/v1`；如果供应商只给根域名，程序会自动补 `/v1`。

### 4. 配置 systemd 常驻运行

```bash
sudo tee /etc/systemd/system/photo-skill-studio.service >/dev/null <<'EOF'
[Unit]
Description=Photo Skill Studio
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=photoapp
WorkingDirectory=/opt/photo-skill-studio
EnvironmentFile=/etc/photo-skill-studio.env
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/opt/photo-skill-studio/data /opt/photo-skill-studio/skills

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now photo-skill-studio
sudo systemctl status photo-skill-studio
curl http://127.0.0.1:4317/api/health
```

### 5. Nginx 反向代理

```bash
sudo tee /etc/nginx/sites-available/photo-skill-studio >/dev/null <<'EOF'
server {
    listen 80;
    server_name image.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:4317;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/photo-skill-studio /etc/nginx/sites-enabled/photo-skill-studio
sudo nginx -t && sudo systemctl reload nginx
```

把 `image.example.com` 换成你的域名，并将 DNS A 记录指向服务器公网 IP。生产环境再申请 HTTPS：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d image.example.com
```

### 6. 防火墙和日常维护

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

journalctl -u photo-skill-studio -f
df -h
```

生成结果会写入 `data/generated/`，项目没有自动清理旧图片。建议按周备份 `skills/` 和 `data/generated/`，并设置 30-90 天清理策略；如果结果很多，改为对象存储更合适。

更新版本：

```bash
cd /opt/photo-skill-studio
sudo -u photoapp git pull --ff-only
sudo -u photoapp npm ci --omit=dev
sudo systemctl restart photo-skill-studio
```

## 上线验收

1. `curl http://127.0.0.1:4317/api/health` 返回 `configured: true`。
2. 浏览器能打开域名，上传限制和 9:16/2:3/4:5 尺寸选择正常。
3. 先只选一个 Skill 做小图测试，再开放四 Skill 并行。
4. 确认 HTTPS、访问控制、备份和日志轮转后，再把地址发给 10 位用户。
