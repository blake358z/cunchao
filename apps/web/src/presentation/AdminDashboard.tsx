import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  Flag,
  LayoutDashboard,
  Map,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BootstrapData } from "../domain/types";
import { buildAdminOverview, loadLocalDrafts, saveLocalDrafts, type AdminDraft, type AdminModuleKey } from "../data/admin";

const navItems: Array<{ key: AdminModuleKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "总览", icon: LayoutDashboard },
  { key: "content", label: "内容上新", icon: FilePlus2 },
  { key: "events", label: "赛事管理", icon: CalendarDays },
  { key: "teams", label: "球队球员", icon: UsersRound },
  { key: "guides", label: "文旅攻略", icon: Map },
  { key: "community", label: "社区审核", icon: MessageSquareWarning },
  { key: "analytics", label: "数据看板", icon: BarChart3 },
  { key: "settings", label: "系统设置", icon: Settings }
];

export function AdminDashboard({ data }: { data: BootstrapData }) {
  const [active, setActive] = useState<AdminModuleKey>("overview");
  const [drafts, setDrafts] = useState<AdminDraft[]>(loadLocalDrafts);
  const overview = useMemo(() => buildAdminOverview(data), [data]);

  const addDraft = (draft: AdminDraft) => {
    const next = [draft, ...drafts].slice(0, 30);
    setDrafts(next);
    saveLocalDrafts(next);
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>村</span>
          <div>
            <strong>村超运营后台</strong>
            <small>Content · Match · Growth</small>
          </div>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <strong>{navItems.find((item) => item.key === active)?.label}</strong>
            <p>面向资讯、赛事、球队、文旅、社区与增长数据的一体化管理台</p>
          </div>
          <div className="admin-status">
            <span><ShieldCheck size={15} /> 数据源每日 08:30 更新</span>
            <span><Activity size={15} /> Vercel H5 测试版</span>
          </div>
        </header>

        {active === "overview" && <OverviewPanel data={data} overview={overview} drafts={drafts} />}
        {active === "content" && <ContentPanel data={data} drafts={drafts} onAddDraft={addDraft} />}
        {active === "events" && <EventsAdminPanel data={data} />}
        {active === "teams" && <TeamsPanel data={data} />}
        {active === "guides" && <GuidesPanel data={data} />}
        {active === "community" && <CommunityModerationPanel data={data} />}
        {active === "analytics" && <AnalyticsPanel overview={overview} />}
        {active === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}

function OverviewPanel({ data, overview, drafts }: { data: BootstrapData; overview: ReturnType<typeof buildAdminOverview>; drafts: AdminDraft[] }) {
  return (
    <section className="admin-grid">
      <div className="admin-metrics">
        {overview.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>
      <Panel title="页面转化漏斗" action="查看埋点方案">
        <div className="funnel">
          {overview.funnel.map((step, index) => (
            <div key={step.label} style={{ width: `${100 - index * 10}%` }}>
              <span>{step.label}</span>
              <strong>{step.value.toLocaleString("zh-CN")}</strong>
              <em>{step.rate}</em>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="今日运营队列" action="进入上新">
        <DataTable
          headers={["内容", "类型", "负责人", "状态"]}
          rows={[...drafts, ...overview.contentQueue].slice(0, 6).map((item) => [item.title, item.type, item.owner, item.status])}
        />
      </Panel>
      <Panel title="模块健康度" action="查看详情">
        <div className="health-list">
          {overview.moduleHealth.map((item) => (
            <div key={item.module}>
              <strong>{item.module}</strong>
              <span>{item.owner}</span>
              <em>{item.pending}</em>
              <small>{item.status}</small>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="核心内容池" action="自动更新中">
        <div className="content-stat-grid">
          <StatPill label="资讯" value={data.contents.length} />
          <StatPill label="未来比赛" value={data.matches.filter((item) => item.status === "scheduled").length} />
          <StatPill label="球队" value={data.teams.length} />
          <StatPill label="文旅攻略" value={data.travelGuides.length} />
          <StatPill label="社区帖" value={data.posts.length} />
          <StatPill label="评论" value={data.comments.length} />
        </div>
      </Panel>
    </section>
  );
}

function ContentPanel({ data, drafts, onAddDraft }: { data: BootstrapData; drafts: AdminDraft[]; onAddDraft: (draft: AdminDraft) => void }) {
  const [form, setForm] = useState({ title: "", type: "资讯", owner: "内容运营", source: "人工上新" });
  const submit = () => {
    if (!form.title.trim()) return;
    onAddDraft({
      id: `draft-${Date.now()}`,
      title: form.title.trim(),
      type: form.type as AdminDraft["type"],
      owner: form.owner,
      status: "待审核",
      updatedAt: "刚刚"
    });
    setForm({ title: "", type: "资讯", owner: "内容运营", source: "人工上新" });
  };

  return (
    <section className="admin-two-col">
      <Panel title="内容上新" action="草稿将进入审核队列">
        <div className="admin-form">
          <label>标题<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如：本周村超焦点战前瞻" /></label>
          <label>类型<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>资讯</option><option>视频</option><option>战报</option><option>攻略</option><option>公告</option></select></label>
          <label>负责人<select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}><option>内容运营</option><option>赛事运营</option><option>文旅运营</option><option>社区运营</option></select></label>
          <label>来源<select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}><option>人工上新</option><option>每日抓取</option><option>官方供稿</option><option>合作媒体</option></select></label>
          <button className="admin-primary" onClick={submit}>加入审核队列</button>
        </div>
      </Panel>
      <Panel title="内容生产板块" action="按体育资讯产品拆分">
        <div className="module-cards">
          {[
            ["快讯/新闻", "日常资讯、官方公告、媒体报道，支持来源和版权标记。"],
            ["赛前前瞻", "自动关联未来比赛、球队战绩、双方看点和预约入口。"],
            ["赛后战报", "从比分、事件、评论热度生成战报草稿。"],
            ["视频/图集", "接入授权素材、视频号/抖音外链和现场图集。"],
            ["球队故事", "村寨历史、球队荣誉、代表球员、人物采访。"],
            ["文旅攻略", "按比赛日自动匹配村寨、住宿、美食、交通路线。"]
          ].map(([title, body]) => <ModuleCard key={title} title={title} body={body} />)}
        </div>
      </Panel>
      <Panel title="审核队列" action={`${drafts.length} 条本地草稿`}>
        <DataTable
          headers={["标题", "类型", "负责人", "状态"]}
          rows={[
            ...drafts.map((item) => [item.title, item.type, item.owner, item.status]),
            ...data.contents.slice(0, 8).map((item, index) => [item.title, item.type === "travel" ? "攻略" : "资讯", ["王编辑", "李运营", "赵审核"][index % 3], index % 2 ? "审核中" : "已发布"])
          ]}
        />
      </Panel>
    </section>
  );
}

function EventsAdminPanel({ data }: { data: BootstrapData }) {
  return (
    <section className="admin-grid">
      <Panel title="赛事管理结构" action="未来接官方数据源">
        <div className="module-cards">
          {[
            ["联赛/赛季", "村超、苏超、青超等多联赛，配置赛季、阶段、赛制和地区。"],
            ["赛程维护", "未来 14 天比赛、对战球队、时间、场地、预约入口。"],
            ["比分事件", "进球、红黄牌、换人、比赛状态、赛后技术统计。"],
            ["积分榜", "按赛制规则自动计算，可人工锁定和审计更正。"]
          ].map(([title, body]) => <ModuleCard key={title} title={title} body={body} />)}
        </div>
      </Panel>
      <Panel title="未来比赛核验表" action={`${data.matches.filter((item) => item.status === "scheduled").length} 场待核验`}>
        <DataTable
          headers={["比赛", "时间", "场地", "状态"]}
          rows={data.matches.slice(0, 10).map((match) => [`${match.homeTeam} vs ${match.awayTeam}`, formatDate(match.startsAt), match.venue, match.status])}
        />
      </Panel>
    </section>
  );
}

function TeamsPanel({ data }: { data: BootstrapData }) {
  return (
    <section className="admin-grid">
      <Panel title="球队资料库" action="球队管理员后续可认领">
        <DataTable
          headers={["球队", "村寨/城市", "战绩", "荣誉数"]}
          rows={data.teams.map((team) => [team.name, team.village, team.record, String(team.honors.length)])}
        />
      </Panel>
      <Panel title="球员与球队信息模块" action="生产版需授权数据">
        <div className="module-cards">
          <ModuleCard title="球员名单" body="姓名、号码、位置、公开统计。敏感身份信息不进入前台。" />
          <ModuleCard title="球队荣誉" body="赛季成绩、历史荣誉、代表比赛、官方认证资料。" />
          <ModuleCard title="村寨特色" body="球队所属村寨、地方文化、旅游特色和商户关联。" />
          <ModuleCard title="数据纠错" body="球队管理员提交纠错，赛事运营审核后发布。" />
        </div>
      </Panel>
    </section>
  );
}

function GuidesPanel({ data }: { data: BootstrapData }) {
  return (
    <section className="admin-grid">
      <Panel title="文旅攻略池" action="按未来比赛自动匹配">
        <DataTable
          headers={["攻略", "地区", "关联球队", "场地"]}
          rows={data.travelGuides.map((guide) => [guide.title, guide.region, guide.teamName ?? "待关联", guide.venue ?? "待补充"])}
        />
      </Panel>
      <Panel title="攻略数据字段" action="可复用入库">
        <div className="module-cards">
          <ModuleCard title="村寨介绍" body="历史、文化、位置、适合观赛人群和推荐停留时长。" />
          <ModuleCard title="旅游路线" body="半日、一日、两日路线，赛前/赛中/赛后建议。" />
          <ModuleCard title="住宿餐饮" body="住宿区、农家乐、美食、价格带、是否需预约。" />
          <ModuleCard title="图片素材" body="每个村寨优先匹配真实相关图片，记录图片来源。" />
        </div>
      </Panel>
    </section>
  );
}

function CommunityModerationPanel({ data }: { data: BootstrapData }) {
  return (
    <section className="admin-grid">
      <Panel title="社区审核台" action="上线前接入真实队列">
        <DataTable
          headers={["帖子", "作者", "互动", "建议动作"]}
          rows={data.posts.slice(0, 10).map((post, index) => [post.title, post.author, `${post.likes}赞 / ${post.comments}评`, index % 3 === 0 ? "置顶候选" : "正常巡检"])}
        />
      </Panel>
      <Panel title="治理能力清单" action="P1 必做">
        <div className="module-cards">
          <ModuleCard title="敏感词机审" body="发帖、评论、昵称均需先过机审再进入人工抽检。" />
          <ModuleCard title="举报处理" body="用户举报进入工单，支持隐藏、删除、禁言、恢复。" />
          <ModuleCard title="运营精选" body="把高质量讨论推入首页、比赛详情和球队页。" />
          <ModuleCard title="账号风控" body="按手机号、微信 openid、设备和 IP 做频控。" />
        </div>
      </Panel>
    </section>
  );
}

function AnalyticsPanel({ overview }: { overview: ReturnType<typeof buildAdminOverview> }) {
  return (
    <section className="admin-grid">
      <Panel title="页面数据" action="DAU / 时长 / CTR / 转化">
        <DataTable
          headers={["页面", "PV", "平均时长", "CTR", "下一步行为"]}
          rows={overview.pageAnalytics.map((item) => [item.page, item.views.toLocaleString("zh-CN"), item.avgDuration, item.ctr, item.nextAction])}
        />
      </Panel>
      <Panel title="埋点事件字典" action="前端 SDK 后续接入">
        <DataTable
          headers={["事件", "触发场景", "关键属性", "业务用途"]}
          rows={[
            ["page_view", "进入页面", "page, leagueId, source", "DAU、路径分析"],
            ["content_click", "点击资讯/视频/攻略", "contentId, type, position", "内容 CTR"],
            ["match_click", "点击比赛卡", "matchId, leagueId, status", "赛程转化"],
            ["booking_click", "点击预约入口", "matchId, venue, provider", "预约漏斗"],
            ["comment_submit", "发表评论/回复", "targetType, targetId", "社区活跃"],
            ["favorite_toggle", "收藏/取消收藏", "targetType, targetId", "我的沉淀"]
          ]}
        />
      </Panel>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="admin-grid">
      <Panel title="系统设置与权限" action="后端生产化">
        <div className="module-cards">
          <ModuleCard title="角色权限" body="系统管理员、内容运营、赛事数据员、社区审核员、球队管理员。" />
          <ModuleCard title="数据源配置" body="公开抓取源、官方表格、合作 API、人工录入源统一配置。" />
          <ModuleCard title="发布流" body="草稿、审核中、已发布、已驳回、定时发布、撤回。" />
          <ModuleCard title="审计日志" body="每次发布、修改比分、删除评论都写入操作日志。" />
        </div>
      </Panel>
    </section>
  );
}

function MetricCard({ metric }: { metric: ReturnType<typeof buildAdminOverview>["metrics"][number] }) {
  const max = Math.max(...metric.trend);
  return (
    <article className="metric-card">
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <em>{metric.delta}</em>
      <div className="sparkline" aria-hidden="true">
        {metric.trend.map((point, index) => <i key={index} style={{ height: `${Math.max(18, (point / max) * 46)}px` }} />)}
      </div>
    </article>
  );
}

function Panel({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <section className="admin-panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span>{action}<ChevronRight size={14} /></span>
      </div>
      {children}
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function ModuleCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="module-card">
      <CheckCircle2 size={17} />
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-pill">
      <Flag size={16} />
      <span>{label}</span>
      <strong>{value.toLocaleString("zh-CN")}</strong>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
