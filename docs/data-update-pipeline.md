# 村超数据每日更新流程

## 当前目标

先让 H5/APK 有一套可每天更新的基础数据，不依赖后端上线。

当前实现会生成：

```bash
apps/web/public/data/bootstrap.json
```

前端启动后优先读取这个静态 JSON；如果读取失败，再回退到内置 mock 数据。

## 数据源分层

### 资讯源

优先级：

1. 官方来源：村超官网、贵州省人民政府「贵州村超来了」专题、榕江官方发布渠道。
2. 权威媒体：新华社、人民网、光明网、贵州日报/天眼新闻、多彩贵州网等。
3. 社交平台：微信公众号、视频号、抖音等，适合做人工审核池，不建议直接无审核入库。

当前已配置：

```bash
data/sources.json
```

抓取脚本：

```bash
node scripts/update-public-data.mjs
```

### 赛事源

赛事数据分两类：

- 赛程文章：可以从公开网页每天抓取，作为资讯/赛事动态展示。
- 结构化比赛：包括主队、客队、时间、场地、比分、状态、积分等，需要官方 API、官方表格或人工维护。

当前方案：

1. 公开网页每天抓取赛程文章。
2. 结构化比赛先从 `data/manual/matches.json` 合并。
3. 拿到官方/组委会表格或接口后，新增 adapter 转换成统一 `Match` 数据。

## 每日自动化

GitHub Actions 文件：

```bash
.github/workflows/update-public-data.yml
```

默认北京时间每天 08:30 运行一次。

执行步骤：

1. 安装依赖。
2. 构建 `@cunchao/shared` 类型和数据包。
3. 抓取公开来源并生成 `apps/web/public/data/bootstrap.json`。
4. 构建 Web，验证数据没有破坏前端。
5. 如果数据变化，自动提交 `Update public data`。
6. 拉取 Vercel 项目设置，构建生产产物并部署到 Vercel Production。

## 后续接入官方 API 的位置

新增一个 adapter，例如：

```bash
scripts/sources/official-matches.mjs
```

输出统一结构：

```ts
Match[]
StandingRow[]
Team[]
```

再由 `scripts/update-public-data.mjs` 合并进 `bootstrap.json`。

## 数据质量建议

资讯可以自动入库，但建议保留来源、原文链接和发布时间。

赛程和比分属于高敏感数据，正式发布前建议至少满足其一：

- 官方 API；
- 组委会每日 Excel/CSV；
- 官方网页结构化表格；
- 人工审核后再发布。

## Vercel 自动发布

GitHub 仓库已配置以下 Actions Secrets：

```bash
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

每日数据更新任务成功后，会执行：

```bash
npx vercel --prod --yes --no-wait --force
```

这样每日任务会触发一次 Vercel 生产部署，由 Vercel 云端按仓库源码构建。用户打开 Vercel 地址时，可以看到当天更新后的 `bootstrap.json`。旧新闻会继续保留在生成文件里，新的新闻排在前面。

注意：数据更新本身不能被 Vercel 临时部署错误阻断，所以 workflow 中 Vercel deploy 是尽力触发。若 Vercel 返回平台侧 `deployment-error`，当天的数据仍会提交到 GitHub，部署问题需要在 Vercel Dashboard 或项目设置里排查。
