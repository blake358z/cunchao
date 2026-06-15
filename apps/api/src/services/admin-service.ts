import type { ApiEnvelope } from "@cunchao/shared";
import { activities, bookingEvents, comments, contents, leagues, matches, posts, teams, travelGuides } from "../data/mock-store.js";

type AdminEvent = {
  event: string;
  page?: string;
  targetId?: string;
  targetType?: string;
  properties?: Record<string, unknown>;
  createdAt: string;
};

const analyticsEvents: AdminEvent[] = [];

const envelope = <T>(data: T, source: ApiEnvelope<T>["source"] = "mock"): ApiEnvelope<T> => ({
  data,
  source,
  updatedAt: new Date().toISOString()
});

export class AdminService {
  getOverview() {
    const contentViews = contents.reduce((sum, item) => sum + item.likes * 9 + item.comments * 18 + item.favorites * 12, 0);
    const postViews = posts.reduce((sum, item) => sum + item.likes * 8 + item.comments * 14, 0);
    const matchViews = matches.length * 3680 + bookingEvents.length * 950;
    const bookingClicks = Math.max(620, bookingEvents.length * 218);
    const bookingSuccess = Math.round(bookingClicks * 0.36);

    return envelope({
      metrics: [
        { label: "DAU（日活用户）", value: 28600 + comments.length * 7, delta: 0.126 },
        { label: "平均观看时长", value: 522, delta: 0.082 },
        { label: "资讯点击率 CTR", value: 0.0672, delta: 0.0085 },
        { label: "预约转化率", value: bookingSuccess / bookingClicks, delta: 0.031 }
      ],
      contentModules: [
        "快讯/新闻",
        "赛前前瞻",
        "赛后战报",
        "视频/图集",
        "球队故事",
        "文旅攻略",
        "官方公告",
        "社区精选"
      ],
      operations: [
        { module: "资讯上新", owner: "内容运营", pending: contents.length, workflow: "抓取/人工/供稿 -> 审核 -> 发布" },
        { module: "赛事管理", owner: "赛事数据员", pending: matches.filter((item) => item.status === "scheduled").length, workflow: "导入赛程 -> 核验 -> 发布 -> 赛后更新" },
        { module: "球队球员", owner: "赛事运营", pending: teams.length, workflow: "资料入库 -> 球队认领 -> 运营审核" },
        { module: "文旅攻略", owner: "文旅运营", pending: travelGuides.length, workflow: "赛事匹配 -> 攻略复用 -> 图片核验" },
        { module: "社区审核", owner: "社区运营", pending: posts.length + comments.length, workflow: "机审 -> 人审 -> 精选/处罚" }
      ],
      funnel: [
        { step: "进入首页/赛事页", value: contentViews + postViews + matchViews },
        { step: "点击资讯/比赛详情", value: Math.round((contentViews + matchViews) * 0.42) },
        { step: "关注/收藏/评论", value: Math.round((contentViews + postViews) * 0.18) },
        { step: "点击预约入口", value: bookingClicks },
        { step: "预约成功", value: bookingSuccess }
      ],
      pageAnalytics: [
        { page: "首页", views: contentViews, avgDurationSeconds: 88, ctr: 0.184 },
        { page: "赛事频道", views: matchViews, avgDurationSeconds: 125, ctr: 0.247 },
        { page: "比赛详情", views: Math.round(matchViews * 0.58), avgDurationSeconds: 192, ctr: 0.096 },
        { page: "社区", views: postViews, avgDurationSeconds: 248, ctr: 0.315 },
        { page: "文旅", views: travelGuides.length * 2380, avgDurationSeconds: 166, ctr: 0.132 },
        { page: "我的", views: Math.round((contentViews + postViews) * 0.12), avgDurationSeconds: 58, ctr: 0.068 }
      ],
      eventDictionary: [
        { event: "page_view", purpose: "DAU、路径分析", required: ["page", "leagueId", "source"] },
        { event: "content_click", purpose: "内容 CTR", required: ["contentId", "type", "position"] },
        { event: "match_click", purpose: "赛程转化", required: ["matchId", "leagueId", "status"] },
        { event: "booking_click", purpose: "预约漏斗", required: ["matchId", "venue", "provider"] },
        { event: "comment_submit", purpose: "社区活跃", required: ["targetType", "targetId"] },
        { event: "favorite_toggle", purpose: "我的沉淀", required: ["targetType", "targetId"] }
      ],
      receivedEvents: analyticsEvents.slice(-20),
      updatedAt: new Date().toISOString()
    });
  }

  createDraft(input: { title: string; type: string; owner?: string; source?: string }) {
    return envelope({
      id: `draft-${Date.now()}`,
      title: input.title,
      type: input.type,
      owner: input.owner ?? "内容运营",
      source: input.source ?? "人工上新",
      status: "待审核",
      createdAt: new Date().toISOString()
    });
  }

  trackEvent(input: Omit<AdminEvent, "createdAt">) {
    const next = { ...input, createdAt: new Date().toISOString() };
    analyticsEvents.push(next);
    if (analyticsEvents.length > 500) analyticsEvents.splice(0, analyticsEvents.length - 500);
    return envelope({ ok: true, accepted: 1, event: next });
  }
}
