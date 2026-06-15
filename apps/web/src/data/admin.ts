import type { BootstrapData } from "../domain/types";

export type AdminModuleKey = "overview" | "content" | "events" | "teams" | "guides" | "community" | "analytics" | "settings";

export type AdminDraft = {
  id: string;
  title: string;
  type: "资讯" | "视频" | "战报" | "攻略" | "公告";
  owner: string;
  status: "待审核" | "审核中" | "已发布" | "已驳回";
  updatedAt: string;
};

export type AdminMetric = {
  label: string;
  value: string;
  delta: string;
  trend: number[];
};

export type FunnelStep = {
  label: string;
  value: number;
  rate: string;
};

export type AdminOverview = {
  metrics: AdminMetric[];
  funnel: FunnelStep[];
  contentQueue: AdminDraft[];
  moduleHealth: Array<{ module: string; owner: string; pending: number; status: string }>;
  pageAnalytics: Array<{ page: string; views: number; avgDuration: string; ctr: string; nextAction: string }>;
};

const trend = [62, 74, 81, 76, 88, 93, 86];

export function buildAdminOverview(data: BootstrapData): AdminOverview {
  const contentViews = data.contents.reduce((sum, item) => sum + item.likes * 9 + item.comments * 18 + item.favorites * 12, 0);
  const postViews = data.posts.reduce((sum, item) => sum + item.likes * 8 + item.comments * 14, 0);
  const matchViews = data.matches.length * 3680 + data.bookingEvents.length * 950;
  const bookingClicks = Math.max(620, data.bookingEvents.length * 218);
  const bookingSuccess = Math.round(bookingClicks * 0.36);

  return {
    metrics: [
      { label: "DAU（日活用户）", value: formatNumber(28600 + data.comments.length * 7), delta: "+12.6%", trend },
      { label: "平均观看时长", value: "8分42秒", delta: "+8.2%", trend: [45, 50, 53, 60, 58, 66, 61] },
      { label: "资讯点击率 CTR", value: "6.72%", delta: "+0.85%", trend: [22, 26, 24, 27, 31, 28, 33] },
      { label: "预约转化率", value: `${((bookingSuccess / bookingClicks) * 100).toFixed(1)}%`, delta: "+3.1%", trend: [18, 22, 26, 25, 29, 32, 36] }
    ],
    funnel: [
      { label: "进入首页/赛事页", value: contentViews + postViews + matchViews, rate: "100%" },
      { label: "点击资讯/比赛详情", value: Math.round((contentViews + matchViews) * 0.42), rate: "42%" },
      { label: "关注/收藏/评论", value: Math.round((contentViews + postViews) * 0.18), rate: "18%" },
      { label: "点击预约入口", value: bookingClicks, rate: "7.6%" },
      { label: "预约成功", value: bookingSuccess, rate: "2.7%" }
    ],
    contentQueue: [
      ...data.contents.slice(0, 5).map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type === "travel" ? "攻略" : item.type === "video" ? "视频" : "资讯",
        owner: ["王编辑", "李运营", "张编辑", "赵审核"][index % 4],
        status: index % 3 === 0 ? "待审核" : index % 3 === 1 ? "审核中" : "已发布",
        updatedAt: item.publishedAt
      } as AdminDraft))
    ],
    moduleHealth: [
      { module: "资讯上新", owner: "内容运营", pending: data.contents.filter((item) => item.type !== "travel").length, status: "每日自动抓取 + 人审" },
      { module: "赛事管理", owner: "赛事数据员", pending: data.matches.filter((item) => item.status === "scheduled").length, status: "未来14天待核验" },
      { module: "球队球员", owner: "赛事运营", pending: data.teams.length, status: "资料静态库" },
      { module: "文旅攻略", owner: "文旅运营", pending: data.travelGuides.length, status: "按比赛匹配" },
      { module: "社区审核", owner: "社区运营", pending: data.posts.length + data.comments.length, status: "需接入审核队列" }
    ],
    pageAnalytics: [
      { page: "首页", views: contentViews, avgDuration: "1分28秒", ctr: "18.4%", nextAction: "点击资讯详情" },
      { page: "赛事频道", views: matchViews, avgDuration: "2分05秒", ctr: "24.7%", nextAction: "进入比赛详情" },
      { page: "比赛详情", views: Math.round(matchViews * 0.58), avgDuration: "3分12秒", ctr: "9.6%", nextAction: "预约/评论" },
      { page: "社区", views: postViews, avgDuration: "4分08秒", ctr: "31.5%", nextAction: "评论/回复" },
      { page: "文旅", views: data.travelGuides.length * 2380, avgDuration: "2分46秒", ctr: "13.2%", nextAction: "查看攻略/预约" },
      { page: "我的", views: Math.round((contentViews + postViews) * 0.12), avgDuration: "58秒", ctr: "6.8%", nextAction: "找回收藏" }
    ]
  };
}

export function loadLocalDrafts(): AdminDraft[] {
  try {
    return JSON.parse(window.localStorage.getItem("cunchao.admin.drafts") ?? "[]") as AdminDraft[];
  } catch {
    return [];
  }
}

export function saveLocalDrafts(drafts: AdminDraft[]) {
  window.localStorage.setItem("cunchao.admin.drafts", JSON.stringify(drafts.slice(0, 30)));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}
