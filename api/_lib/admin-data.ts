type JsonResponse = {
  data: unknown;
  source: "mock";
  updatedAt: string;
};

const metrics = [
  { label: "DAU（日活用户）", value: 39254, delta: 0.126 },
  { label: "平均观看时长", value: 522, delta: 0.082 },
  { label: "资讯点击率 CTR", value: 0.0672, delta: 0.0085 },
  { label: "预约转化率", value: 0.361, delta: 0.031 }
];

export function getAdminOverview(): JsonResponse {
  return {
    data: {
      metrics,
      contentModules: ["快讯/新闻", "赛前前瞻", "赛后战报", "视频/图集", "球队故事", "文旅攻略", "官方公告", "社区精选"],
      operations: [
        { module: "资讯上新", owner: "内容运营", pending: 42, workflow: "抓取/人工/供稿 -> 审核 -> 发布" },
        { module: "赛事管理", owner: "赛事数据员", pending: 14, workflow: "导入赛程 -> 核验 -> 发布 -> 赛后更新" },
        { module: "球队球员", owner: "赛事运营", pending: 32, workflow: "资料入库 -> 球队认领 -> 运营审核" },
        { module: "文旅攻略", owner: "文旅运营", pending: 11, workflow: "赛事匹配 -> 攻略复用 -> 图片核验" },
        { module: "社区审核", owner: "社区运营", pending: 1560, workflow: "机审 -> 人审 -> 精选/处罚" }
      ],
      funnel: [
        { step: "进入首页/赛事页", value: 128640 },
        { step: "点击资讯/比赛详情", value: 54028 },
        { step: "关注/收藏/评论", value: 18592 },
        { step: "点击预约入口", value: 3924 },
        { step: "预约成功", value: 1416 }
      ],
      pageAnalytics: [
        { page: "首页", views: 48200, avgDurationSeconds: 88, ctr: 0.184 },
        { page: "赛事频道", views: 37680, avgDurationSeconds: 125, ctr: 0.247 },
        { page: "比赛详情", views: 21854, avgDurationSeconds: 192, ctr: 0.096 },
        { page: "社区", views: 31520, avgDurationSeconds: 248, ctr: 0.315 },
        { page: "文旅", views: 26180, avgDurationSeconds: 166, ctr: 0.132 },
        { page: "我的", views: 9480, avgDurationSeconds: 58, ctr: 0.068 }
      ],
      eventDictionary: [
        { event: "page_view", purpose: "DAU、路径分析", required: ["page", "leagueId", "source"] },
        { event: "content_click", purpose: "内容 CTR", required: ["contentId", "type", "position"] },
        { event: "match_click", purpose: "赛程转化", required: ["matchId", "leagueId", "status"] },
        { event: "booking_click", purpose: "预约漏斗", required: ["matchId", "venue", "provider"] },
        { event: "comment_submit", purpose: "社区活跃", required: ["targetType", "targetId"] },
        { event: "favorite_toggle", purpose: "我的沉淀", required: ["targetType", "targetId"] }
      ]
    },
    source: "mock",
    updatedAt: new Date().toISOString()
  };
}
