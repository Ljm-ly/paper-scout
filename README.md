# PaperScout - 学术论文搜索阅读工具

一键搜索、阅读、收藏、翻译学术论文的 Web 工具。

![PaperScout](https://img.shields.io/badge/PaperScout-v1.0-blue)

## 功能特性

- **多源搜索** - 同时从 6 大数据库搜索论文（arXiv、Semantic Scholar、OpenAlex、CrossRef、X-Mol、PubMed）
- **AI 智能搜索** - 使用 DeepSeek AI 评估每篇论文与搜索主题的相关度，智能排序
- **在线阅读** - 内置 PDF 阅读器，直接在浏览器中阅读论文全文
- **关联推荐** - 基于 Semantic Scholar 的引用关系，自动推荐相关论文、展示引用和被引文献
- **收藏夹 + 笔记** - 收藏感兴趣的论文，添加阅读笔记和标签分类
- **AI 摘要翻译** - 集成 DeepSeek API，一键翻译论文标题和摘要为中文
- **智能筛选** - 按来源、年份、引用数等条件筛选搜索结果
- **数据安全** - 所有数据保存在浏览器本地，不上传任何服务器

## 技术栈

- **React 18** + **TypeScript** - 前端框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **fast-xml-parser** - arXiv XML 数据解析
- **GitHub Pages** - 静态部署

## 数据源

| 数据源 | 说明 |
|--------|------|
| [arXiv](https://arxiv.org) | 全球最大的预印本论文库，涵盖物理、数学、计算机、生物等 |
| [Semantic Scholar](https://www.semanticscholar.org) | AI 驱动的学术搜索引擎，提供引用关系和推荐 |
| [OpenAlex](https://openalex.org) | 免费的开放学术数据库，覆盖 2.5 亿+ 学术作品 |
| [CrossRef](https://www.crossref.org) | 多学科核心期刊数据库，提供 DOI 元数据 |
| [X-Mol](https://www.x-mol.com) | 化学、材料、生物医药领域论文平台，含影响因子信息 |
| [PubMed](https://pubmed.ncbi.nlm.nih.gov) | 生物医学领域权威数据库，覆盖生命科学和医学研究 |

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 部署到 GitHub Pages

1. Fork 或创建 GitHub 仓库
2. 在仓库 Settings > Pages 中，将 Source 设置为 **GitHub Actions**
3. 推送代码到 `main` 分支，自动触发部署
4. 访问 `https://<你的用户名>.github.io/paper-scout/`

## 设置说明

### CORS 代理

由于浏览器安全限制，从 GitHub Pages 访问某些 API 需要 CORS 代理。默认使用 [corsproxy.io](https://corsproxy.io)，你可以在设置中修改。

### AI 功能

PaperScout 集成 DeepSeek AI 提供两项智能功能：

1. **AI 摘要翻译** - 一键翻译论文标题和摘要为中文
2. **AI 智能搜索** - 自动评估每篇论文与搜索主题的相关度（0-100分），按相关度排序

启用方法：
1. 前往 [DeepSeek Platform](https://platform.deepseek.com/api_keys) 获取 API Key
2. 在 PaperScout 的「设置」页面填入 Key
3. 选择模型（推荐 DeepSeek Chat，快速便宜）
4. 开启「启用 AI 智能搜索」开关

## 项目结构

```
paper-scout/
├── .github/workflows/    # GitHub Actions 部署配置
├── public/               # 静态资源
├── src/
│   ├── api/              # 论文 API 服务
│   │   ├── arxiv.ts      # arXiv API
│   │   ├── semanticScholar.ts  # Semantic Scholar API
│   │   ├── openalex.ts   # OpenAlex API
│   │   ├── crossref.ts   # CrossRef API
│   │   ├── xmol.ts       # X-Mol API（HTML 抓取）
│   │   └── pubmed.ts     # PubMed API
│   ├── components/       # UI 组件
│   │   ├── SearchBar.tsx
│   │   ├── PaperCard.tsx
│   │   ├── PaperDetail.tsx
│   │   ├── FavoritesPanel.tsx
│   │   └── SettingsPanel.tsx
│   ├── context/          # React Context 状态管理
│   ├── pages/            # 页面组件
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   │   ├── storage.ts    # 本地存储和代理
│   │   ├── translate.ts  # AI 翻译功能
│   │   └── aiScore.ts    # AI 相关度评分
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # 入口文件
│   └── index.css         # 全局样式
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## License

MIT
