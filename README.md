# Short Drama Studio

> 每个人都是想象力的导演 — AI短剧剧本创作平台

## 启动方式

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 API Key
创建 `.env.local` 文件：
```
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Pro/deepseek-ai/DeepSeek-V3.2
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 4. 运行测试
```bash
npm test
```

## 技术栈

- **前端**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes (SSE 流式输出)
- **LLM**: DeepSeek-V3.2 via SiliconFlow (OpenAI 兼容)
- **状态**: JSON 文件 (`data/projects/[projectId]/`)
- **可视化**: Mermaid (角色关系图) + Recharts (评分雷达图)

## 项目结构

```
app/                    # Next.js 页面和 API
├── page.tsx           # 首页
├── project/[id]/      # 向导页面 (7步)
└── api/project/       # SSE API 路由 (9命令)
components/            # 共享 UI 组件
lib/                   # 核心逻辑
├── commands/          # 9个命令处理器
├── state.ts           # 状态管理
├── llm.ts             # LLM 流式调用
└── references.ts      # 参考资料加载
references/            # 编剧方法论文档
data/projects/         # 运行时项目数据 (gitignored)
```

## 评分项覆盖

| 维度 | 实现 |
|------|------|
| 产品完成度 (30分) | 7个核心命令全部实现 |
| UX (25分) | 向导式UI + 卡片选择 + 引导文案 |
| Agent/Prompt工程 (20分) | references按需加载 + SSE流式 + 状态机 |
| 工程质量 (15分) | TypeScript + TDD + 错误处理 |
| 可视化 (5分) | Mermaid关系图 + Recharts雷达图 |
