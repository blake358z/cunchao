import type {
  BookingEvent,
  Comment,
  ContentItem,
  League,
  Match,
  Post,
  StandingRow,
  Team,
  TravelGuide,
  UserActivity
} from "./index.js";

export const leagues: League[] = [
  {
    id: "gzcunchao",
    name: "贵州村超",
    shortName: "村超",
    type: "village",
    region: "贵州榕江",
    season: "2026",
    description: "以村寨球队、民族文化展演和群众足球为核心的全国热门乡村足球赛事。",
    liveHint: "正在进行：车江二村 1-0 寨蒿",
    nextHint: "明天 19:30 忠诚 vs 平永"
  },
  {
    id: "js-super",
    name: "江苏苏超",
    shortName: "苏超",
    type: "city",
    region: "江苏",
    season: "2026",
    description: "以城市队、主客场和城市德比为主要叙事的群众足球赛事。",
    nextHint: "今天 20:00 南京 vs 苏州"
  },
  {
    id: "qh-youth",
    name: "青海青超",
    shortName: "青超",
    type: "provincial",
    region: "青海",
    season: "2026",
    description: "高原地区城市与州队共同参与的区域足球赛事。",
    nextHint: "周日 16:00 西宁 vs 海东"
  },
  {
    id: "jx-super",
    name: "江西赣超",
    shortName: "赣超",
    type: "provincial",
    region: "江西",
    season: "2026",
    description: "连接城市足球、县域文化和地方文旅的新兴赛事。",
    nextHint: "6月18日 南昌 vs 九江"
  }
];

export const teams: Team[] = [
  {
    id: "team-chejiang",
    leagueId: "gzcunchao",
    name: "车江二村代表队",
    village: "榕江县车江片区",
    record: "6胜1平",
    goalsFor: 18,
    intro: "球队由本村青年和返乡球员组成，边路推进和高位逼抢是本赛季的鲜明特点。",
    honors: ["2025赛季八强", "2026预选赛小组第一"]
  },
  {
    id: "team-zhaigao",
    leagueId: "gzcunchao",
    name: "寨蒿队",
    village: "寨蒿镇",
    record: "5胜1负",
    goalsFor: 14,
    intro: "反击速度快，擅长利用边路空间创造机会。",
    honors: ["2024赛季人气球队"]
  },
  {
    id: "team-zhongcheng",
    leagueId: "gzcunchao",
    name: "忠诚队",
    village: "忠诚镇",
    record: "5胜1平",
    goalsFor: 16,
    intro: "阵型稳定，防守反击转换效率高。",
    honors: ["2026预选赛不败球队"]
  },
  {
    id: "team-pingyong",
    leagueId: "gzcunchao",
    name: "平永队",
    village: "平永镇",
    record: "4胜2平",
    goalsFor: 12,
    intro: "中场控球能力强，擅长阵地推进。",
    honors: ["2025公平竞赛奖"]
  }
];

export const matches: Match[] = [
  {
    id: "match-live-1",
    leagueId: "gzcunchao",
    homeTeamId: "team-chejiang",
    awayTeamId: "team-zhaigao",
    homeTeam: "车江二村",
    awayTeam: "寨蒿队",
    venue: "榕江一号场",
    startsAt: "2026-06-13T19:30:00+08:00",
    status: "live",
    score: { home: 2, away: 1 },
    minute: 68
  },
  {
    id: "match-next-1",
    leagueId: "gzcunchao",
    homeTeamId: "team-zhongcheng",
    awayTeamId: "team-pingyong",
    homeTeam: "忠诚队",
    awayTeam: "平永队",
    venue: "榕江一号场",
    startsAt: "2026-06-15T19:30:00+08:00",
    status: "scheduled"
  },
  {
    id: "match-next-2",
    leagueId: "gzcunchao",
    homeTeamId: "team-dali",
    awayTeamId: "team-leli",
    homeTeam: "大利队",
    awayTeam: "乐里队",
    venue: "榕江一号场",
    startsAt: "2026-06-16T16:00:00+08:00",
    status: "scheduled"
  },
  {
    id: "match-js-1",
    leagueId: "js-super",
    homeTeamId: "team-nanjing",
    awayTeamId: "team-suzhou",
    homeTeam: "南京队",
    awayTeam: "苏州队",
    venue: "南京奥体中心",
    startsAt: "2026-06-13T20:00:00+08:00",
    status: "scheduled"
  }
];

export const standings: StandingRow[] = [
  { teamId: "team-chejiang", rank: 1, teamName: "车江二村", played: 7, won: 6, drawn: 1, lost: 0, points: 19 },
  { teamId: "team-zhongcheng", rank: 2, teamName: "忠诚队", played: 6, won: 5, drawn: 1, lost: 0, points: 16 },
  { teamId: "team-zhaigao", rank: 3, teamName: "寨蒿队", played: 6, won: 5, drawn: 0, lost: 1, points: 15 }
];

export const contents: ContentItem[] = [
  {
    id: "article-weekend",
    type: "article",
    title: "榕江赛区周末关键战：20强席位进入最后争夺",
    summary: "本轮比赛将决定多个小组的出线形势，现场预约入口已同步开放。",
    source: "村超官方",
    leagueId: "gzcunchao",
    image: "/assets/football-action.jpg",
    likes: 238,
    comments: 64,
    favorites: 31,
    publishedAt: "2026-06-13T10:00:00+08:00",
    body: "本轮比赛将决定多个小组的出线形势。车江二村、忠诚队、寨蒿队都将在周末迎来直接对话，现场预约入口已同步开放。"
  },
  {
    id: "article-derby",
    type: "news",
    title: "苏超城市德比升温：南京队主场预约通道已开放",
    summary: "城市德比带动本地看球和短途出行热度。",
    source: "苏超观察",
    leagueId: "js-super",
    image: "/assets/football-crowd.jpg",
    likes: 186,
    comments: 42,
    favorites: 20,
    publishedAt: "2026-06-13T09:20:00+08:00"
  },
  {
    id: "travel-sanbao",
    type: "travel",
    title: "跟着比赛去旅行：三宝侗寨一日路线更新",
    summary: "赛前吃酸汤鱼，赛后看侗族大歌，适合第一次到榕江看球的游客。",
    source: "文旅攻略",
    leagueId: "gzcunchao",
    image: "/assets/village-scene.jpg",
    likes: 92,
    comments: 18,
    favorites: 55,
    publishedAt: "2026-06-12T18:00:00+08:00"
  }
];

const communityAuthors = [
  "榕江看球人",
  "阿亮在球场边",
  "酸汤鱼加折耳根",
  "南京来的客队球迷",
  "车江二村小吴",
  "寨蒿左边路",
  "带娃看球的妈妈",
  "鼓楼下等开场",
  "球场摄影师阿峰",
  "小满村口便利店",
  "苏超观察员",
  "高铁到榕江",
  "懂一点战术",
  "村BA也爱看球",
  "侗寨民宿老板",
  "榕江志愿者",
  "夜市摊主老杨",
  "从贵阳自驾来",
  "平永队老粉",
  "忠诚镇门将粉",
  "周末不加班",
  "江边吹风",
  "带相机的老周",
  "县城公交司机",
  "第一次来贵州",
  "球衣收藏夹",
  "小朋友踢边线",
  "赛后吃粉",
  "直播间潜水员",
  "看台第三排"
];

const avatarPool = Array.from({ length: 50 }, (_, index) => `/data/avatars/avatar-${String(index + 1).padStart(2, "0")}.svg`);

function avatarForAuthor(author: string) {
  let hash = 0;
  for (const char of author) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return avatarPool[hash % avatarPool.length];
}

function avatarForComment(author: string, commentId: string) {
  return avatarForAuthor(`${author}-${commentId}`);
}

const discussionTopics = [
  {
    id: "post-atmosphere",
    title: "现场看村超最打动你的一个瞬间是什么？",
    author: "榕江看球人",
    body: "我最喜欢开场前各村寨一起进场那一段，感觉不是单纯比赛，更像整个县城一起过节。大家现场看过的瞬间里，哪个最难忘？",
    leagueId: "gzcunchao",
    teamId: "team-chejiang",
    createdAt: "刚刚",
    tags: ["现场", "氛围"]
  },
  {
    id: "post-parking-route",
    title: "周末去榕江看球，停车和入场路线怎么安排最稳？",
    author: "从贵阳自驾来",
    body: "准备带爸妈和孩子过去，想避开最挤的时间。大家一般提前多久到？车停哪里比较省心？",
    leagueId: "gzcunchao",
    createdAt: "12分钟前",
    tags: ["攻略", "入场"]
  },
  {
    id: "post-food-after-match",
    title: "赛后你们都去吃什么？求一份不踩雷夜宵清单",
    author: "赛后吃粉",
    body: "看完球出来特别饿，酸汤鱼、牛瘪、卷粉、烧烤都想试，但只有一个胃。大家按优先级排一下？",
    leagueId: "gzcunchao",
    createdAt: "28分钟前",
    tags: ["美食", "文旅"]
  },
  {
    id: "post-su-vs-cun",
    title: "苏超和村超的气质到底差在哪里？",
    author: "苏超观察员",
    body: "苏超更像城市之间的较劲，村超更像村寨生活长出来的热闹。两个都好看，但好看的点不太一样。",
    leagueId: "js-super",
    createdAt: "43分钟前",
    tags: ["苏超", "对比"]
  },
  {
    id: "post-wing-play",
    title: "车江二村这场边路推进是不是本轮最佳？",
    author: "懂一点战术",
    body: "现场看下来，右路连续三次打到禁区肋部，边前卫回撤和前插很默契。大家觉得这套踢法能撑到淘汰赛吗？",
    leagueId: "gzcunchao",
    teamId: "team-chejiang",
    createdAt: "1小时前",
    tags: ["战术", "球队"]
  },
  {
    id: "post-keeper",
    title: "忠诚队门将这几次出击，真的有点东西",
    author: "忠诚镇门将粉",
    body: "不只是扑救，关键是敢出来摘高球，后防线一下子稳了很多。有没有人也注意到了？",
    leagueId: "gzcunchao",
    teamId: "team-zhongcheng",
    createdAt: "1小时前",
    tags: ["球员", "战术"]
  },
  {
    id: "post-live-stream",
    title: "不能到现场的话，直播间怎么才更有现场感？",
    author: "直播间潜水员",
    body: "我觉得光拍比赛不够，赛前村寨队伍、看台、摊位、解说互动都应该多给一点镜头。",
    leagueId: "gzcunchao",
    createdAt: "2小时前",
    tags: ["直播", "体验"]
  },
  {
    id: "post-kids",
    title: "带小朋友看村超，有哪些位置和时间点更友好？",
    author: "带娃看球的妈妈",
    body: "孩子第一次看球，很兴奋也怕人太多。想问大家带娃看台、厕所、吃饭这些怎么安排。",
    leagueId: "gzcunchao",
    createdAt: "2小时前",
    tags: ["亲子", "攻略"]
  },
  {
    id: "post-tourism-route",
    title: "如果只在榕江待一天，比赛+村寨路线怎么排？",
    author: "第一次来贵州",
    body: "上午到，晚上看比赛，第二天走。想尽量不赶，但又想看点侗寨和吃点本地东西。",
    leagueId: "gzcunchao",
    createdAt: "3小时前",
    tags: ["路线", "文旅"]
  },
  {
    id: "post-referee",
    title: "今天这场判罚尺度你们觉得怎么样？",
    author: "球场摄影师阿峰",
    body: "我在场边看感觉身体对抗放得比较开，比赛节奏是起来了，但有几次铲抢看台反应挺大。",
    leagueId: "gzcunchao",
    createdAt: "3小时前",
    tags: ["判罚", "比赛"]
  },
  {
    id: "post-merch",
    title: "村超周边如果做得更好，你最想买什么？",
    author: "球衣收藏夹",
    body: "我想要各村队徽章、围巾、球衣号码贴，还有那种能写村寨名字的小旗子。",
    leagueId: "gzcunchao",
    createdAt: "4小时前",
    tags: ["周边", "消费"]
  },
  {
    id: "post-rumor",
    title: "最近关于赛程的消息很多，大家怎么辨别真假？",
    author: "榕江志愿者",
    body: "建议还是看官方发布和现场公告，群里转发的图有时候是旧图。我们产品后面也应该标清楚来源和更新时间。",
    leagueId: "gzcunchao",
    createdAt: "4小时前",
    tags: ["辟谣", "赛程"]
  },
  {
    id: "post-village-pride",
    title: "为什么大家会对自己村的队这么上头？",
    author: "小满村口便利店",
    body: "有时候不是因为踢得多专业，而是里面真有邻居、同学、亲戚。进一个球，整个村都像自己进了球。",
    leagueId: "gzcunchao",
    createdAt: "5小时前",
    tags: ["村寨", "情感"]
  },
  {
    id: "post-traffic",
    title: "散场后怎么走最快？公交、步行、打车哪个靠谱？",
    author: "县城公交司机",
    body: "散场那一波最容易堵，想听听大家的真实体验，也方便给外地朋友做攻略。",
    leagueId: "gzcunchao",
    createdAt: "5小时前",
    tags: ["交通", "散场"]
  },
  {
    id: "post-photo-spots",
    title: "村超现场有哪些适合拍照的位置？",
    author: "带相机的老周",
    body: "想拍比赛，也想拍看台和烟火气。哪些位置既不影响别人，又能拍到好画面？",
    leagueId: "gzcunchao",
    createdAt: "6小时前",
    tags: ["摄影", "现场"]
  },
  {
    id: "post-volunteer",
    title: "志愿者服务有哪些细节是外地游客最需要的？",
    author: "榕江志愿者",
    body: "最近问路、预约、厕所、餐饮的人都很多。如果要做小程序指引，大家最想先看到什么？",
    leagueId: "gzcunchao",
    createdAt: "6小时前",
    tags: ["服务", "产品建议"]
  },
  {
    id: "post-away-fans",
    title: "外地球迷来村超，最容易被什么圈粉？",
    author: "南京来的客队球迷",
    body: "我以为自己只是来看球，结果被看台、歌舞、夜市和大家的热情一起拿下了。",
    leagueId: "gzcunchao",
    createdAt: "昨天",
    tags: ["外地游客", "体验"]
  },
  {
    id: "post-youth",
    title: "村超对小朋友踢球的影响会不会越来越明显？",
    author: "小朋友踢边线",
    body: "看台边很多孩子一直在模仿球员动作。热闹之后，能不能留下更多训练场和教练资源？",
    leagueId: "gzcunchao",
    createdAt: "昨天",
    tags: ["青训", "长期"]
  },
  {
    id: "post-music",
    title: "你们最喜欢哪段赛前表演？",
    author: "鼓楼下等开场",
    body: "有些表演一出来，现场气氛直接被点燃。感觉这部分和比赛一样重要。",
    leagueId: "gzcunchao",
    createdAt: "昨天",
    tags: ["表演", "氛围"]
  },
  {
    id: "post-weather",
    title: "雨天看球体验如何？需要准备什么？",
    author: "周末不加班",
    body: "天气预报有雨，想问下雨衣、鞋、包这些怎么准备比较舒服。",
    leagueId: "gzcunchao",
    createdAt: "昨天",
    tags: ["天气", "攻略"]
  },
  {
    id: "post-ticket",
    title: "预约入场有没有必要做候补提醒？",
    author: "产品小白也看球",
    body: "热门场次如果满了，能不能有人取消就提醒我？这个功能感觉很刚需。",
    leagueId: "gzcunchao",
    createdAt: "昨天",
    tags: ["预约", "产品建议"]
  },
  {
    id: "post-data",
    title: "大家最想看到哪些球员数据？",
    author: "懂一点战术",
    body: "进球助攻当然要有，但我还想看抢断、射门、扑救、跑动热区，哪怕先从简单统计做起。",
    leagueId: "gzcunchao",
    createdAt: "2天前",
    tags: ["数据", "球员"]
  },
  {
    id: "post-culture",
    title: "村超最特别的是足球，还是足球外面的生活？",
    author: "江边吹风",
    body: "我觉得是两者绑在一起才成立。只有比赛会少一点味道，只有表演也不会这么抓人。",
    leagueId: "gzcunchao",
    createdAt: "2天前",
    tags: ["文化", "讨论"]
  },
  {
    id: "post-host",
    title: "解说和主持能不能再多讲点村寨故事？",
    author: "村BA也爱看球",
    body: "很多外地人不知道球队背后的村寨、产业、历史。比赛间隙讲一点，会更容易记住。",
    leagueId: "gzcunchao",
    createdAt: "2天前",
    tags: ["解说", "内容"]
  },
  {
    id: "post-safety",
    title: "人多的时候，现场安全感怎么样？",
    author: "带娃看球的妈妈",
    body: "整体很热闹，但高峰期还是希望入口、出口、医疗点标识更明显一点。",
    leagueId: "gzcunchao",
    createdAt: "2天前",
    tags: ["安全", "现场"]
  },
  {
    id: "post-local-business",
    title: "村超给本地小店带来的变化明显吗？",
    author: "夜市摊主老杨",
    body: "比赛日人流确实大，但也想知道大家是不是愿意多走进村寨，而不是只在球场附近消费。",
    leagueId: "gzcunchao",
    createdAt: "2天前",
    tags: ["商业", "文旅"]
  },
  {
    id: "post-team-history",
    title: "球队页是不是应该补每个村的历史和荣誉？",
    author: "平永队老粉",
    body: "只看赛程不够，大家还想知道这支队从哪里来、以前有哪些经典比赛、村里有什么特色。",
    leagueId: "gzcunchao",
    teamId: "team-pingyong",
    createdAt: "3天前",
    tags: ["球队", "产品建议"]
  },
  {
    id: "post-gaoqing",
    title: "能不能出每场比赛的高清图集？",
    author: "球场摄影师阿峰",
    body: "很多瞬间短视频刷过去就没了，图集适合收藏，也适合球队和球员自己转发。",
    leagueId: "gzcunchao",
    createdAt: "3天前",
    tags: ["图集", "内容"]
  },
  {
    id: "post-away-city",
    title: "城市联赛能学村超的哪些东西？",
    author: "苏超观察员",
    body: "不一定复制歌舞和村寨，但可以学那种本地身份感，让球迷觉得这场比赛和自己有关。",
    leagueId: "js-super",
    createdAt: "3天前",
    tags: ["城市联赛", "对比"]
  },
  {
    id: "post-app-feature",
    title: "如果这个 App 先做社区，你最想要哪个功能？",
    author: "产品小白也看球",
    body: "我投球队圈、赛后评分、现场问答和攻略收藏。大家觉得哪个最该先做？",
    leagueId: "gzcunchao",
    createdAt: "3天前",
    tags: ["产品建议", "社区"]
  }
];

const commentOpeners = [
  "这个话题我太有感了，",
  "现场看过一次之后真的不一样，",
  "我觉得不能只看热闹，",
  "作为外地游客说一句，",
  "站在本地人的角度，",
  "这个建议可以直接进产品需求，",
  "别的不说，",
  "我在直播间看的感受是，",
  "带家人去过一次，",
  "如果后面要长期做，"
];

const commentBodies = [
  "最重要的是把信息说清楚，时间、地点、入口、停车这些比花哨功能更刚需。",
  "大家喜欢的是那种真实劲儿，球员不是明星，但每一次拼抢都能把人带进去。",
  "看台上的鼓声、喊声、孩子跟着跑，确实比单纯看比分更上头。",
  "外地人第一次来会有点懵，如果有路线和本地人推荐，会舒服很多。",
  "不要把它做成只有流量的东西，村寨、人、比赛和生活都要留住。",
  "评论区最好能按最新、最热、楼主回复分开，不然人一多就找不到重点。",
  "有些信息一定要标来源和更新时间，旧赛程图真的很容易误导人。",
  "我更想看赛后的真实评价，哪支队踢得硬，哪个球员今天状态好。",
  "文旅内容别太官方，最好是球迷真实路线，几点到、吃什么、哪里排队少。",
  "如果能把球队、村寨、比赛、攻略串起来，这个 App 就不只是查赛程了。"
];

const replyBodies = [
  "同意，尤其是更新时间，差一天体验就完全不同。",
  "这个可以做成置顶回复，免得每次都有人重复问。",
  "我补一句，老人和小孩的路线也要单独考虑。",
  "确实，现场工作人员的提示有时候比网上攻略更准。",
  "这个角度好，不能只看输赢，还要看参与感。",
  "哈哈我也是，本来只想看一场，结果逛到晚上才走。",
  "如果后面有官方数据源，这块会更稳。",
  "建议加收藏，我经常想回头找某条攻略。",
  "这就是社区该有的价值，真实经验比宣传文案有用。",
  "说得很实在，先把基础体验做好。"
];

function buildCommentsForTopic(topic: (typeof discussionTopics)[number], topicIndex: number): Comment[] {
  return Array.from({ length: 50 }, (_, index) => {
    const isReply = index > 0 && index % 5 === 0;
    const parentIndex = isReply ? index - 1 : undefined;
    const author = communityAuthors[(topicIndex * 7 + index) % communityAuthors.length];
    const replyTo = parentIndex !== undefined ? communityAuthors[(topicIndex * 7 + parentIndex) % communityAuthors.length] : undefined;
    const body = isReply
      ? `回复 @${replyTo}：${replyBodies[(topicIndex + index) % replyBodies.length]}`
      : `${commentOpeners[(topicIndex + index) % commentOpeners.length]}${commentBodies[(topicIndex * 3 + index) % commentBodies.length]}`;
    const id = `${topic.id}-comment-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      postId: topic.id,
      parentId: parentIndex !== undefined ? `${topic.id}-comment-${String(parentIndex + 1).padStart(2, "0")}` : undefined,
      replyTo,
      author,
      avatar: avatarForComment(author, id),
      body,
      likes: 8 + ((topicIndex * 17 + index * 11) % 180),
      replies: isReply ? 0 : (index + topicIndex) % 6,
      createdAt: index < 3 ? "刚刚" : index < 12 ? `${index * 3}分钟前` : index < 30 ? `${index - 10}小时前` : `${Math.ceil(index / 12)}天前`
    };
  });
}

export const posts: Post[] = discussionTopics.map((topic, index) => ({
  id: topic.id,
  title: topic.title,
  author: topic.author,
  body: topic.body,
  leagueId: topic.leagueId,
  teamId: topic.teamId,
  likes: 96 + ((index * 37) % 420),
  comments: 50,
  favorites: 18 + ((index * 19) % 96),
  createdAt: topic.createdAt
}));

export const comments: Comment[] = discussionTopics.flatMap(buildCommentsForTopic);

export const travelGuides: TravelGuide[] = [
  {
    id: "guide-sanbao",
    title: "三宝侗寨路线：赛前吃酸汤鱼，赛后看侗族大歌",
    leagueId: "gzcunchao",
    region: "榕江",
    image: "/assets/village-scene.jpg",
    summary: "支持按联赛、球队、附近、热门村寨搜索，不把几百个村寨平铺在顶部。",
    tags: ["附近", "热门村寨", "球队筛选"]
  }
];

export const bookingEvents: BookingEvent[] = [
  {
    id: "booking-1",
    matchId: "match-next-1",
    title: "贵州村超 · 忠诚队 vs 平永队",
    venue: "榕江一号场",
    startsAt: "2026-06-15T19:30:00+08:00",
    availability: "available",
    provider: "official"
  }
];

export const activities: UserActivity[] = [
  { id: "act-1", type: "comment", title: "评论/回帖：可找回参与过的资讯与帖子", targetType: "post", createdAt: "今天" },
  { id: "act-2", type: "like", title: "点赞记录：包括资讯、帖子、评论", targetType: "article", createdAt: "昨天" },
  { id: "act-3", type: "favorite", title: "收藏内容：攻略、比赛、深度帖", targetType: "travel", createdAt: "本周" },
  { id: "act-4", type: "history", title: "浏览历史：最近看过的球队和比赛", targetType: "team", createdAt: "本周" }
];
