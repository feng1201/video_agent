# Short Drama Studio

> 每个人都是想象力的导演 — AI 短剧剧本创作平台

用 AI 帮你写出爆款短剧剧本。完全不懂创作？没关系，9 步向导带你从一个想法出发，生成完整的 50-100 集短剧剧本。

---

## 立即使用

### 方式一：直接访问服务器 IP（现在就能用）

应用已部署在阿里云服务器，无需任何安装：

```
http://223.109.239.18
```

在浏览器中打开即可使用。

### 方式二：域名访问（DNS 生效后）

DNS 记录已配置，等待传播（通常 24-48 小时）后可通过域名访问：

```
http://shanghaihope.xin
https://shanghaihope.xin   ← DNS 生效后运行 bash /root/test/dep/ssl.sh 开启 HTTPS
```

### 方式三：本地开发运行

```bash
# 1. 安装依赖
cd short-drama-studio
npm install

# 2. 配置 API Key（复制 .env.local.example 或手动创建）
cat > .env.local << 'EOF'
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Pro/deepseek-ai/DeepSeek-V3.2
EOF

# 3. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

---

## 功能介绍

Short Drama Studio 是一个 9 步向导式 AI 创作平台，每一步都有 AI 实时流式生成内容：

| 步骤 | 功能 | 说明 |
|------|------|------|
| 1. 填写基础信息 | 题材、集数、目标受众 | 支持 8 大热门题材卡片选择 |
| 2. 故事策划 | 核心矛盾、爽点设计、商业钩子 | AI 生成完整策划案 |
| 3. 角色体系 | 角色档案 + 可视化关系图 | Mermaid 渲染关系图谱 |
| 4. 分集目录 | 每集简介与钩子设计 | 支持 50-100 集规划 |
| 5. 生成剧本 | 逐集完整剧本 | **批量多选**，顺序生成，随时中止 |
| 6. 质量评审 | 5 维度评分 + 雷达图 | **批量多选**，顺序评审，随时中止 |
| 7. 导出 | Markdown 格式打包下载 | 所有集合并为单文件 |

### 批量生成功能

第 5 步和第 6 步支持批量操作：
- **快速选择**：未完成全选 / 前 10 集 / 前 20 集 / 全选 / 清除
- **滚动复选框**：逐集勾选，已完成的集显示 ✓
- **进度条**：实时显示「X / Y 集完成」
- **随时中止**：点击红色「⏹ 停止」按钮立即终止当前请求

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 14 App Router + TypeScript |
| 样式 | Tailwind CSS |
| 后端 | Next.js API Routes（同一项目） |
| AI 接口 | DeepSeek-V3.2 via SiliconFlow（OpenAI 兼容） |
| 流式传输 | Server-Sent Events (SSE) |
| 状态持久化 | JSON 文件（`data/projects/[projectId]/`） |
| 可视化 | Mermaid（关系图）+ Recharts（雷达图） |
| 进程管理 | PM2 |
| 反向代理 | Nginx（含 `proxy_buffering off` 支持 SSE） |
| HTTPS | Let's Encrypt / Certbot |

---

## 项目结构

```
short-drama-studio/
├── app/
│   ├── page.tsx                        # 首页（项目列表）
│   ├── project/[projectId]/
│   │   ├── start/page.tsx              # 步骤 1：基础设置
│   │   ├── plan/page.tsx               # 步骤 2：故事策划
│   │   ├── characters/page.tsx         # 步骤 3：角色体系
│   │   ├── outline/page.tsx            # 步骤 4：分集目录
│   │   ├── episode/page.tsx            # 步骤 5：生成剧本（批量）
│   │   ├── review/page.tsx             # 步骤 6：质量评审（批量）
│   │   └── export/page.tsx             # 步骤 7：导出
│   └── api/project/
│       ├── new/route.ts                # 创建项目
│       └── [projectId]/
│           ├── state/route.ts          # 读取状态
│           ├── download/route.ts       # 下载导出
│           └── [command]/route.ts      # SSE 流式命令分发
├── lib/
│   ├── commands/                       # 9 个 AI 命令处理器
│   │   ├── plan.ts, characters.ts, outline.ts
│   │   ├── episode.ts, review.ts, export.ts
│   │   └── ...
│   ├── llm.ts                          # DeepSeek 流式调用（含重试）
│   ├── state.ts                        # JSON 状态 CRUD
│   ├── sse.ts                          # SSE 工具函数
│   ├── references.ts                   # 参考文档加载
│   └── useSSE.ts                       # 客户端 SSE 消费（支持 AbortSignal）
├── components/
│   ├── StepLayout.tsx                  # 向导步骤外壳
│   └── StreamingText.tsx               # 流式文字渲染
├── references/                         # 编剧方法论文档（AI Prompt 上下文）
│   ├── genre-guide.md
│   ├── hook-design.md
│   ├── satisfaction-matrix.md
│   └── ...
└── data/projects/                      # 运行时项目数据（.gitignore）
    └── [projectId]/
        ├── .drama-state.json           # 项目状态
        └── episode-*.md                # 已生成的剧本
```

---

## 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run build        # 生产构建
npm start            # 启动生产服务器

# 测试
npm test             # 运行所有测试（Jest）
npm test -- --watch  # 监听模式

# 类型检查
npx tsc --noEmit
```

---

## 服务器部署

### 当前部署状态

```
服务器 IP : 223.109.239.18
域名      : shanghaihope.xin（DNS 传播中）
进程管理  : PM2（进程名：short-drama）
端口      : 3000（内部）→ 80（Nginx 代理）
```

### 常用运维命令

```bash
# 查看运行状态
pm2 status

# 重新部署（构建 + 重启）
bash /root/test/dep/deploy.sh

# 申请 SSL 证书（DNS 生效后执行一次）
bash /root/test/dep/ssl.sh

# 查看日志
pm2 logs short-drama

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 环境变量

生产环境在 `/root/test/short-drama-studio/.env.local` 中配置：

```env
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Pro/deepseek-ai/DeepSeek-V3.2
```

---

## 获取 API Key

1. 注册 [SiliconFlow](https://siliconflow.cn) 账号
2. 进入控制台 → API Keys → 创建新 Key
3. 填入 `.env.local` 的 `SILICONFLOW_API_KEY`

DeepSeek-V3.2 支持超长上下文，适合生成长篇剧本。

---

## 设计取舍

### 框架选型：Next.js App Router（方案1）vs Pages Router（方案2）vs Express 分离（方案3）

评估了三个方案：

| | 方案 | 优点 | 缺点 |
|---|---|---|---|
| ✅ **选择** | **Next.js App Router 全栈** | 前后端一个仓库，`npm run dev` 启动全部；文件路由与向导步骤结构完美对应；AI 代码生成质量最高 | App Router 概念较新，遇到问题文档略复杂 |
| | Next.js Pages Router 全栈 | 文档更多、更稳定 | SSE 实现稍麻烦，属于被逐渐淘汰的方式 |
| | Next.js 前端 + Express 后端 | SSE 在 Express 最简单 | 两个进程、两套端口、部署更复杂 |

选 App Router 的核心原因：`/project/[projectId]/[step]` 路由结构天然对应向导步骤，零额外配置。

### 编程语言/生态：Next.js（方案A）vs FastAPI Python（方案B）vs Vue + Express（方案C）

| | 方案 | 优点 | 缺点 |
|---|---|---|---|
| ✅ **选择** | **Next.js（TypeScript）** | 前后端一体、部署最简单、AI 代码生成质量最高 | React 概念略多 |
| | React (Vite) + FastAPI (Python) | Python 对 AI 调用友好，FastAPI 文档极好 | 两个进程两套依赖，新手容易混乱 |
| | Vue + Express.js | Vue 被认为比 React 更易上手 | 社区资源和 AI 代码生成支持不如 React |

### 状态持久化：JSON 文件（方案B）vs SQLite（方案A）
| ✅ **选择** | **JSON 文件**（每项目一目录，`.drama-state.json` + `.md` 文件）| 零配置、可直接查看和编辑、结构与原版 CLI 完全一致、便于导出 | 不支持并发写入、无法跨服务器共享 |
| | SQLite | 查询方便，适合多项目管理 | 需要额外依赖，增加不必要的复杂度 |

当前场景下 JSON 文件完全够用。

### 选择 SSE 流式输出（而非等待完整响应）
生成一集剧本需要 30-60 秒，如果等待完整响应用户体验很差。SSE 让内容边生成边显示，同时 Nginx 配置了 `proxy_buffering off` 确保字节级实时传输。代价是前端需要处理流式状态管理，Nginx 配置也需要特别注意。

### 选择按需加载参考文档（而非全量注入 Prompt）
`references/` 目录下有 8 份编剧方法论文档（hook 设计、节奏曲线、满足矩阵等）。每个命令只加载与自己相关的 1-3 份文档注入 System Prompt，而非全部加载。避免超出 context 限制，也降低每次调用的 token 成本。

### 选择 nanoid 项目 ID（而非自增 ID）
项目 ID 使用 8 位随机字符串（如 `a1b2c3d4`），而非数据库自增整数。好处是无需中心化 ID 分配，URL 也不会暴露项目数量。缺点是不便于排序，但项目列表可以按文件修改时间排序弥补。

### 批量生成中止用 AbortController + ref 双保险
停止批量生成时，`abortRef` 负责阻止队列继续执行下一集，`AbortController` 负责取消当前正在进行的 HTTP 请求。两者缺一不可：只有 ref 会等当前集生成完才停，只有 AbortController 会在下一集启动前无法阻止。

### 未实现的功能及原因
- **用户账号系统**：当前用 projectId 区分项目，无登录态。加入账号体系需要数据库和 session 管理，超出当前范围。
- **剧本修改/重写**：已生成的集只能重新生成覆盖，无法局部编辑。编辑器功能复杂度较高，暂不纳入。
- **多模型切换**：硬编码了 DeepSeek-V3.2，通过环境变量可换模型，但 UI 上未暴露选项。
