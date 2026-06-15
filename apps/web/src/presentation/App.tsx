import { CalendarDays, Clock3, Heart, Home, MapPin, MessageCircle, Search, ShieldCheck, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Comment, ContentItem, Match, Post, Team, TravelGuide } from "@cunchao/shared";
import { useBootstrap } from "../application/useBootstrap";
import type { DetailView, TabKey } from "../domain/types";

const navItems: Array<{ key: TabKey; label: string; icon: typeof Home }> = [
  { key: "home", label: "首页", icon: Home },
  { key: "events", label: "赛事", icon: CalendarDays },
  { key: "community", label: "社区", icon: MessageCircle },
  { key: "travel", label: "文旅", icon: MapPin },
  { key: "profile", label: "我的", icon: UserRound }
];

type LocalActivity = {
  id: string;
  type: "comment" | "like" | "favorite" | "history";
  title: string;
  targetType: "article" | "post" | "match" | "team" | "travel";
  createdAt: string;
};

const activityTypeMap: Record<string, LocalActivity["type"]> = {
  点赞: "like",
  评论: "comment",
  回复: "comment",
  评论点赞: "like",
  收藏: "favorite",
  收藏攻略: "favorite",
  关注: "favorite",
  预约入场: "history",
  分享攻略: "history"
};

export function App() {
  const { data, loading } = useBootstrap();
  const [tab, setTab] = useState<TabKey>("home");
  const [selectedLeagueId, setSelectedLeagueId] = useState("gzcunchao");
  const [detail, setDetail] = useState<DetailView>(null);
  const [teamTab, setTeamTab] = useState("资讯");
  const [toast, setToast] = useState("");
  const [localActivities, setLocalActivities] = useState<LocalActivity[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("cunchao.activities") ?? "[]") as LocalActivity[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem("cunchao.activities", JSON.stringify(localActivities.slice(0, 40)));
  }, [localActivities]);

  const league = data?.leagues.find((item) => item.id === selectedLeagueId);
  const leagueMatches = data?.matches.filter((match) => match.leagueId === selectedLeagueId) ?? [];

  const recordActivity = (label: string, title: string, targetType: LocalActivity["targetType"]) => {
    const type = activityTypeMap[label] ?? "history";
    setLocalActivities((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        title: `${label}：${title}`,
        targetType,
        createdAt: "刚刚"
      },
      ...current
    ].slice(0, 40));
  };

  const openDetail = (next: DetailView, title?: string) => {
    setDetail(next);
    if (next?.type && title) recordActivity("浏览", title, next.type === "match" || next.type === "team" || next.type === "travel" ? next.type : next.type === "post" ? "post" : "article");
    window.setTimeout(scrollScreenToTop, 0);
  };

  const changeTab = (next: TabKey) => {
    setTab(next);
    setDetail(null);
    window.setTimeout(scrollScreenToTop, 0);
  };

  const interact = (label: string, title = "当前内容", targetType: LocalActivity["targetType"] = "article") => {
    recordActivity(label, title, targetType);
    setToast(`${label}已记录，可在“我的”里找回`);
    window.setTimeout(() => setToast(""), 1800);
  };

  const screen = useMemo(() => {
    if (!data || loading) return <LoadingScreen />;
    if (detail?.type === "match") {
      const match = data.matches.find((item) => item.id === detail.id) ?? data.matches[0];
      return <MatchDetail match={match} comments={data.comments} teams={data.teams} onBack={() => setDetail(null)} onAction={interact} />;
    }
    if (detail?.type === "team") {
      const team = data.teams.find((item) => item.id === detail.id) ?? data.teams[0];
      return (
        <TeamDetail
          team={team}
          teamTab={teamTab}
          setTeamTab={setTeamTab}
          contents={data.contents}
          matches={data.matches}
          comments={data.comments}
          onBack={() => setDetail(null)}
          onOpenMatch={(id) => openDetail({ type: "match", id })}
          onAction={interact}
        />
      );
    }
    if (detail?.type === "article") {
      const article = data.contents.find((item) => item.id === detail.id) ?? data.contents[0];
      return <ArticleDetail article={article} comments={data.comments} onBack={() => setDetail(null)} onAction={interact} />;
    }
    if (detail?.type === "post") {
      const post = data.posts.find((item) => item.id === detail.id) ?? data.posts[0];
      const postComments = data.comments.filter((comment) => comment.postId === post.id);
      return <PostDetail post={post} comments={postComments.length ? postComments : data.comments.slice(0, 50)} onBack={() => setDetail(null)} onAction={interact} />;
    }
    if (detail?.type === "travel") {
      const guide = data.travelGuides.find((item) => item.id === detail.id) ?? data.travelGuides[0];
      return <TravelDetail guide={guide} onBack={() => setDetail(null)} onAction={interact} />;
    }

    if (tab === "home") {
      return <HomePage contents={data.contents} matches={data.matches} posts={data.posts} leagues={data.leagues} onOpenArticle={(item) => openDetail({ type: "article", id: item.id }, item.title)} onOpenMatch={(match) => openDetail({ type: "match", id: match.id }, `${match.homeTeam} vs ${match.awayTeam}`)} onOpenPost={(post) => openDetail({ type: "post", id: post.id }, post.title)} onAction={interact} />;
    }
    if (tab === "events") {
      return (
        <EventsPage
          leagues={data.leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          matches={leagueMatches}
          standings={data.standings}
          onOpenMatch={(match) => openDetail({ type: "match", id: match.id }, `${match.homeTeam} vs ${match.awayTeam}`)}
          onOpenTeam={(id) => openDetail({ type: "team", id }, "球队详情")}
        />
      );
    }
    if (tab === "community") {
      return <CommunityPage posts={data.posts} onOpenPost={(post) => openDetail({ type: "post", id: post.id }, post.title)} />;
    }
    if (tab === "travel") {
      return <TravelPage guides={data.travelGuides} bookings={data.bookingEvents} matches={data.matches} leagueName={league?.name ?? "贵州村超"} onOpenGuide={(guide) => openDetail({ type: "travel", id: guide.id }, guide.title)} onAction={interact} />;
    }
    return <ProfilePage activities={[...localActivities, ...data.activities]} teams={data.teams} onOpenTeam={(id) => openDetail({ type: "team", id }, "球队详情")} />;
  }, [data, loading, detail, tab, selectedLeagueId, leagueMatches, league, teamTab, localActivities]);

  return (
    <div className="app-viewport">
      <div className="phone-shell">
        <Header title={getTitle(tab, detail)} canBack={Boolean(detail)} onBack={() => { setDetail(null); window.setTimeout(scrollScreenToTop, 0); }} />
        <main className="screen">{screen}</main>
        {!detail && <BottomNav active={tab} onChange={changeTab} />}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

function getTitle(tab: TabKey, detail: DetailView) {
  if (detail?.type === "match") return "比赛详情";
  if (detail?.type === "team") return "球队详情";
  if (detail?.type === "article") return "资讯详情";
  if (detail?.type === "post") return "帖子详情";
  if (detail?.type === "travel") return "村寨攻略";
  return { home: "平台首页", events: "赛事频道", community: "社区", travel: "文旅服务", profile: "我的" }[tab];
}

function Header({ title, canBack, onBack }: { title: string; canBack: boolean; onBack: () => void }) {
  return (
    <header className="top">
      <div className="bar">
        {canBack ? <button className="ghost" onClick={onBack}>返回</button> : <strong>{title}</strong>}
        {canBack && <strong>{title}</strong>}
        <Search size={17} />
      </div>
    </header>
  );
}

function BottomNav({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ key, label, icon: Icon }) => (
        <button key={key} className={active === key ? "active" : ""} onClick={() => onChange(key)}>
          <Icon size={20} strokeWidth={2.2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function LoadingScreen() {
  return <div className="loading">正在加载村超赛事数据...</div>;
}

function HomePage({ contents, matches, posts, leagues, onOpenArticle, onOpenMatch, onOpenPost, onAction }: { contents: ContentItem[]; matches: Match[]; posts: Post[]; leagues: Array<{ id: string; shortName: string; name: string }>; onOpenArticle: (item: ContentItem) => void; onOpenMatch: (match: Match) => void; onOpenPost: (post: Post) => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  const [feedType, setFeedType] = useState("全部");
  const focus = matches.find((match) => match.status === "live") ?? matches[0];
  const upcoming = matches.filter((match) => match.status === "scheduled").slice(0, 3);
  const selectedContents = feedType === "全部" ? contents : contents.filter((item) => {
    if (feedType === "村超") return item.leagueId === "gzcunchao";
    if (feedType === "苏超") return item.leagueId === "js-super";
    if (feedType === "文旅") return item.type === "travel";
    return item.type === "article" || item.type === "news";
  });
  const topPost = posts[0];
  return (
    <section className="page-content">
      <button className="hero-card" onClick={() => onOpenMatch(focus)}>
        <img src="/assets/football-crowd.jpg" alt="村超现场" />
        <div>
          <span className="hero-kicker">{focus.status === "live" ? "正在进行" : "今日焦点"}</span>
          <h1>{focus.homeTeam} vs {focus.awayTeam}</h1>
          <p>{formatMatchTime(focus)} · {focus.venue}</p>
        </div>
      </button>
      <div className="today-panel">
        <div>
          <strong>今天看什么</strong>
          <p>{leagues.length} 个联赛频道 · {upcoming.length} 场未来赛程 · 每日自动更新</p>
        </div>
        <button onClick={() => onOpenMatch(focus)}>看赛程</button>
      </div>
      <SectionTitle title="未来赛程" />
      <div className="mini-match-strip">
        {upcoming.map((match) => <button key={match.id} onClick={() => onOpenMatch(match)}><strong>{match.homeTeam} vs {match.awayTeam}</strong><span>{formatShortDate(match.startsAt)} · {match.venue}</span></button>)}
      </div>
      {topPost && (
        <>
          <SectionTitle title="社区热帖" />
          <button className="list-card hot-post" onClick={() => onOpenPost(topPost)}>
            <strong>{topPost.title}</strong>
            <p>{topPost.body}</p>
            <span>{topPost.author} · 赞 {topPost.likes} · 评 {topPost.comments}</span>
          </button>
        </>
      )}
      <SectionTitle title="最新资讯" />
      <div className="chips">
        {["全部", "村超", "苏超", "战报", "文旅"].map((item) => <button className={feedType === item ? "selected" : ""} key={item} onClick={() => setFeedType(item)}>{item}</button>)}
      </div>
      <div className="feed">
        {selectedContents.map((item) => (
          <ArticleRow key={item.id} item={item} onOpen={() => onOpenArticle(item)} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

function ArticleRow({ item, onOpen, onAction }: { item: ContentItem; onOpen: () => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  return (
    <article className="list-card article-row">
      <button onClick={onOpen}>
        <div>
          <span className="source-chip">{item.source}</span>
          <h3>{item.title}</h3>
          <p>{formatPublishTime(item.publishedAt)} · 赞 {item.likes} · 评 {item.comments} · 藏 {item.favorites}</p>
        </div>
        <img src={item.image} alt="" />
      </button>
      <div className="action-line">
        <button onClick={() => onAction("点赞", item.title, "article")}>点赞</button>
        <button onClick={() => onAction("评论", item.title, "article")}>评论</button>
        <button onClick={() => onAction("收藏", item.title, "article")}>收藏</button>
      </div>
    </article>
  );
}

function EventsPage({ leagues, selectedLeagueId, setSelectedLeagueId, matches, standings, onOpenMatch, onOpenTeam }: { leagues: Array<{ id: string; shortName: string; name: string; liveHint?: string; nextHint?: string; description?: string }>; selectedLeagueId: string; setSelectedLeagueId: (id: string) => void; matches: Match[]; standings: Array<{ rank: number; teamName: string; points: number; teamId: string }>; onOpenMatch: (match: Match) => void; onOpenTeam: (id: string) => void }) {
  const [range, setRange] = useState("14天");
  const selectedLeague = leagues.find((league) => league.id === selectedLeagueId);
  const filteredMatches = matches.filter((match) => filterMatchByRange(match, range));
  return (
    <section className="page-content">
      <div className="chips league-tabs">
        {leagues.map((league) => (
          <button key={league.id} className={selectedLeagueId === league.id ? "selected" : ""} onClick={() => setSelectedLeagueId(league.id)}>
            {league.shortName}
          </button>
        ))}
      </div>
      <p className="hint">横滑选择联赛，轻按筛选赛程，再次点击进入联赛主页</p>
      <div className="league-carousel">
        {leagues.map((league) => (
          <button key={league.id} className={`league-card ${selectedLeagueId === league.id ? "selected" : ""}`} onClick={() => setSelectedLeagueId(league.id)}>
            <strong>{league.name}</strong>
            {league.liveHint && <span className="live">{league.liveHint}</span>}
            <small>{league.nextHint}</small>
          </button>
        ))}
      </div>
      {selectedLeague && (
        <div className="list-card league-brief">
          <strong>{selectedLeague.name}</strong>
          <p>{selectedLeague.description ?? "联赛资料正在补充。"}</p>
          <span>{selectedLeague.nextHint ?? "赛程持续更新中"}</span>
        </div>
      )}
      <SectionTitle title="赛程筛选" />
      <div className="segmented">
        {["今日", "明日", "14天"].map((item) => <button key={item} className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}
      </div>
      <SectionTitle title={range === "14天" ? "未来两周赛程" : `${range}赛程`} />
      {filteredMatches.length ? filteredMatches.map((match) => <MatchCard key={match.id} match={match} onOpen={() => onOpenMatch(match)} />) : (
        <div className="list-card empty-card">
          <strong>暂无{range}赛程</strong>
          <p>每日更新任务会继续抓取官方赛程；拿到结构化数据后会自动补入这里。</p>
        </div>
      )}
      <SectionTitle title="积分榜速览" />
      <div className="list-card standings">
        {standings.map((row) => (
          <button key={row.teamId} onClick={() => onOpenTeam(row.teamId)}>
            <span>{row.rank}</span><strong>{row.teamName}</strong><em>{row.points}分</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match, onOpen }: { match: Match; onOpen: () => void }) {
  const score = match.score ? `${match.score.home} - ${match.score.away}` : new Date(match.startsAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(match.startsAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", weekday: "short" });
  return (
    <button className="list-card match-card" onClick={onOpen}>
      <span>{match.homeTeam}</span>
      <strong className={match.status === "live" ? "live" : ""}>{score}</strong>
      <span>{match.awayTeam}</span>
      <small><em>{matchStatusLabel(match)}</em>{match.status === "live" ? `进行中 ${match.minute}分` : `${date} · ${match.venue}`}</small>
    </button>
  );
}

function MatchDetail({ match, comments, teams, onBack, onAction }: { match: Match; comments: Comment[]; teams: Team[]; onBack: () => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  const homeTeam = teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = teams.find((team) => team.id === match.awayTeamId);
  const title = `${match.homeTeam} vs ${match.awayTeam}`;
  return (
    <section className="page-content detail">
      <div className="scoreboard">
        <div className="match-status-pill">{matchStatusLabel(match)}</div>
        <span>{match.homeTeam}</span><strong>{match.score ? `${match.score.home} - ${match.score.away}` : "VS"}</strong><span>{match.awayTeam}</span>
        <p>{formatMatchTime(match)} · {match.venue}</p>
      </div>
      <div className="match-facts">
        <div><Clock3 size={16} /><span>{formatMatchTime(match)}</span></div>
        <div><MapPin size={16} /><span>{match.venue}</span></div>
        <div><ShieldCheck size={16} /><span>{match.source ? "官方赛程源" : "数据每日更新"}</span></div>
      </div>
      <div className="list-card events">
        <h3>{match.status === "scheduled" ? "赛前信息" : "关键事件"}</h3>
        {match.status === "scheduled" ? (
          <>
            <p>比赛尚未开始，比分将在开赛后更新。</p>
            <p>地点：{match.venue}</p>
            {match.source && <p>赛程来源：{match.source}</p>}
            {match.originalUrl && <a href={match.originalUrl} target="_blank" rel="noreferrer">查看官方赛程</a>}
          </>
        ) : (
          <>
            <p>12分 车江二村 7号远射破门</p>
            <p>31分 寨蒿队反击扳平</p>
            <p>63分 车江二村头球再度领先</p>
          </>
        )}
      </div>
      <div className="team-vs-grid">
        {[homeTeam, awayTeam].map((team) => team && (
          <div className="list-card team-mini" key={team.id}>
            <strong>{team.name}</strong>
            <p>{team.record} · {team.village}</p>
            <span>{team.intro}</span>
          </div>
        ))}
      </div>
      <div className="action-line prominent match-actions">
        <button onClick={() => onAction("预约入场", title, "match")}>预约入场</button>
        <button onClick={() => onAction("关注", title, "match")}>关注比赛</button>
        <button onClick={() => onAction("评论", title, "match")}>参与讨论</button>
      </div>
      <SectionTitle title="互动讨论" />
      <CommentList comments={comments.slice(0, 24)} onAction={(label) => onAction(label, title, "match")} />
      <p className="scroll-hint">下滑继续加载评论</p>
      <button className="primary-wide" onClick={onBack}>返回赛事频道</button>
    </section>
  );
}

function TeamDetail({ team, teamTab, setTeamTab, contents, matches, comments, onBack, onOpenMatch, onAction }: { team: Team; teamTab: string; setTeamTab: (tab: string) => void; contents: ContentItem[]; matches: Match[]; comments: Comment[]; onBack: () => void; onOpenMatch: (id: string) => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  const tabs = ["资讯", "赛程", "球员", "讨论", "球队信息"];
  return (
    <section className="page-content detail">
      <div className="team-head">
        <div><h2>{team.name}</h2><p>{team.record} · 进{team.goalsFor}球 · {team.village}</p></div>
        <button onClick={() => onAction("关注")}>已关注</button>
      </div>
      <div className="chips compact">
        {tabs.map((tab) => <button key={tab} className={teamTab === tab ? "selected" : ""} onClick={() => setTeamTab(tab)}>{tab}</button>)}
      </div>
      {teamTab === "资讯" && contents.slice(0, 2).map((item) => <ArticleRow key={item.id} item={item} onOpen={() => onAction("打开资讯", item.title, "article")} onAction={onAction} />)}
      {teamTab === "赛程" && matches.filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id).map((match) => <MatchCard key={match.id} match={match} onOpen={() => onOpenMatch(match.id)} />)}
      {teamTab === "球员" && <PlayerGrid />}
      {teamTab === "讨论" && <><CommentList comments={comments} onAction={onAction} /><p className="scroll-hint">下滑继续加载帖子</p></>}
      {teamTab === "球队信息" && <div className="list-card prose"><p>{team.intro}</p><p>荣誉：{team.honors.join("、")}</p></div>}
      <button className="primary-wide" onClick={onBack}>返回</button>
    </section>
  );
}

function PlayerGrid() {
  return <div className="player-grid">{["7 石明宇 · 前锋", "10 杨再兴 · 中场", "3 吴江 · 后卫", "1 王守门 · 门将"].map((item) => <div className="list-card" key={item}>{item}</div>)}</div>;
}

function CommunityPage({ posts, onOpenPost }: { posts: Post[]; onOpenPost: (post: Post) => void }) {
  const [filter, setFilter] = useState("热榜");
  const sortedPosts = [...posts].sort((left, right) => {
    if (filter === "最新") return getRecencyScore(left.createdAt) - getRecencyScore(right.createdAt);
    return right.likes + right.comments * 3 + right.favorites * 2 - (left.likes + left.comments * 3 + left.favorites * 2);
  });
  const filteredPosts = sortedPosts.filter((post) => {
    if (filter === "村超") return post.leagueId === "gzcunchao";
    if (filter === "球队圈") return Boolean(post.teamId) || post.title.includes("队");
    return true;
  });
  const hotPosts = sortedPosts.slice(0, 3);
  return (
    <section className="page-content">
      <div className="community-brief">
        <strong>今天大家在聊</strong>
        <p>{posts.length} 个话题 · {posts.reduce((sum, post) => sum + post.comments, 0)} 条讨论 · 热点按互动自动排序</p>
      </div>
      <SectionTitle title="热榜前三" />
      <div className="rank-list">
        {hotPosts.map((post, index) => (
          <button className="rank-row" key={post.id} onClick={() => onOpenPost(post)}>
            <em>{index + 1}</em>
            <span>{post.title}</span>
            <strong>{post.comments}评</strong>
          </button>
        ))}
      </div>
      <div className="chips">
        {["热榜", "最新", "村超", "苏超", "球队圈"].map((item) => <button className={filter === item ? "selected" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      {filteredPosts.length ? filteredPosts.map((post) => (
        <button className="list-card post-card" key={post.id} onClick={() => onOpenPost(post)}>
          <div className="post-card-head"><span>{post.author}</span><em>{post.createdAt}</em></div>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <span>赞 {post.likes} · 评 {post.comments} · 藏 {post.favorites}</span>
        </button>
      )) : <EmptyCard title="暂无匹配话题" body="换一个频道看看，后续接入真实用户后这里会按联赛、球队和位置自动聚合。" />}
    </section>
  );
}

function TravelPage({ guides, bookings, matches, leagueName, onOpenGuide, onAction }: { guides: TravelGuide[]; bookings: Array<{ id: string; title: string; venue: string; startsAt: string; availability: string }>; matches: Match[]; leagueName: string; onOpenGuide: (guide: TravelGuide) => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  const upcomingMatches = matches.filter((match) => match.status === "scheduled").slice(0, 4);
  const guideByMatch = new Map(guides.filter((guide) => guide.matchId).map((guide) => [guide.matchId, guide]));
  return (
    <section className="page-content">
      <div className="travel-brief">
        <strong>跟着比赛去村寨</strong>
        <p>{leagueName} 未来两周赛程会自动匹配球队、村寨、吃住行攻略；已有攻略会优先复用。</p>
      </div>
      <SectionTitle title="按比赛预约入场" />
      {bookings.map((booking) => (
        <div className="list-card booking" key={booking.id}>
          <h3>{booking.title}</h3>
          <p>{new Date(booking.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {booking.venue} · 余量充足</p>
          <button onClick={() => onAction("预约入场", booking.title, "match")}>预约入场</button><button>换场次</button>
        </div>
      ))}
      <SectionTitle title="比赛日计划" />
      <div className="travel-match-list">
        {upcomingMatches.map((match) => {
          const guide = guideByMatch.get(match.id) ?? guides.find((item) => item.teamId === match.homeTeamId || item.teamId === match.awayTeamId);
          return (
            <div className="list-card travel-match" key={match.id}>
              <div>
                <strong>{match.homeTeam} vs {match.awayTeam}</strong>
                <p>{formatShortDate(match.startsAt)} · {match.venue}</p>
              </div>
              {guide ? <button onClick={() => onOpenGuide(guide)}>看攻略</button> : <span>攻略待匹配</span>}
            </div>
          );
        })}
      </div>
      <SectionTitle title="未来两周比赛村寨" />
      {guides.map((guide) => (
        <button className="travel-card" key={guide.id} onClick={() => onOpenGuide(guide)}>
          <img src={guide.image} alt="" />
          <h3>{guide.title}</h3>
          <p>{guide.startsAt ? `${new Date(guide.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · ${guide.venue} · 对阵 ${guide.opponent}` : guide.summary}</p>
          <div className="tag-line">{guide.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </button>
      ))}
      {!guides.length && <EmptyCard title="暂无匹配村寨攻略" body="每日赛程更新后，会按比赛双方球队自动匹配村寨和球队资料。" />}
    </section>
  );
}

function TravelDetail({ guide, onBack, onAction }: { guide: TravelGuide; onBack: () => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  return (
    <section className="page-content detail">
      <img className="detail-image" src={guide.image} alt="" />
      <h1 className="detail-title">{guide.village ?? guide.title}</h1>
      <p className="meta">{guide.teamName} · {guide.startsAt ? new Date(guide.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : guide.region} · {guide.venue}</p>
      {guide.imageCredit && <p className="image-credit">图片来源：{guide.imageCredit}</p>}
      <div className="itinerary-card">
        <strong>比赛日建议</strong>
        <div><span>赛前</span><p>提前 2-3 小时到达，先确认入场口、停车点和返程路线。</p></div>
        <div><span>赛中</span><p>优先轻装看球，老人小孩选择通道更清晰的位置。</p></div>
        <div><span>赛后</span><p>错峰离场，夜宵和住宿建议提前收藏备用。</p></div>
      </div>
      <div className="list-card prose travel-detail-block">
        <h3>村寨介绍</h3>
        <p>{guide.intro ?? guide.summary}</p>
      </div>
      <div className="list-card prose travel-detail-block">
        <h3>队伍介绍</h3>
        <p>{guide.teamIntro ?? "球队资料待补充。"}</p>
      </div>
      <GuideList title="队员速览" items={guide.players ?? []} />
      <GuideList title="旅游攻略" items={guide.travelTips ?? []} />
      <GuideList title="住宿攻略" items={guide.lodgingTips ?? []} />
      <GuideList title="饮食攻略" items={guide.foodTips ?? []} />
      {guide.sourceUrls?.length ? (
        <div className="source-box">
          <strong>资料来源</strong>
          {guide.imageSourceUrl && <a href={guide.imageSourceUrl} target="_blank" rel="noreferrer">{guide.imageCredit ?? "图片来源"}</a>}
          {guide.sourceUrls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url}>{url.replace(/^https?:\/\//, "")}</a>)}
        </div>
      ) : null}
      <div className="action-line prominent"><button onClick={() => onAction("收藏攻略", guide.title, "travel")}>收藏</button><button onClick={() => onAction("分享攻略", guide.title, "travel")}>分享</button><button onClick={() => onAction("预约入场", guide.title, "travel")}>预约</button></div>
      <button className="primary-wide" onClick={onBack}>返回文旅服务</button>
    </section>
  );
}

function GuideList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="list-card prose travel-detail-block">
      <h3>{title}</h3>
      {items.length ? items.map((item) => <p key={item}>{item}</p>) : <p>资料待补充。</p>}
    </div>
  );
}

function ProfilePage({ activities, teams, onOpenTeam }: { activities: Array<{ id: string; title: string; type: string }>; teams: Team[]; onOpenTeam: (id: string) => void }) {
  return (
    <section className="page-content">
      <div className="profile-card"><div className="avatar" /><div><h2>村超球迷 Blake</h2><p>关注 4 个联赛 · 8 支球队</p></div></div>
      <SectionTitle title="我关注的球队" />
      <div className="team-strip">{teams.slice(0, 3).map((team) => <button key={team.id} onClick={() => onOpenTeam(team.id)}>{team.name}</button>)}</div>
      <SectionTitle title="我的参与" />
      {activities.map((activity) => <div className="list-card activity" key={activity.id}><span>{activity.title}</span><strong>{activity.type}</strong></div>)}
    </section>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return <div className="list-card empty-card"><strong>{title}</strong><p>{body}</p></div>;
}

function ArticleDetail({ article, comments, onBack, onAction }: { article: ContentItem; comments: Comment[]; onBack: () => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  const bodyBlocks = (article.body ?? article.summary).split(/\n{2,}/).filter(Boolean);
  const sourceBlocks = bodyBlocks.filter((block) => block.startsWith("来源：") || block.startsWith("原文："));
  const rawContentBlocks = bodyBlocks
    .filter((block) => !sourceBlocks.includes(block))
    .filter((block, index, list) => list.findIndex((item) => normalizeText(item) === normalizeText(block)) === index);
  const uniqueRawBlocks = rawContentBlocks.filter((block) => {
    const normalizedBlock = normalizeText(block);
    const normalizedSummary = normalizeText(article.summary);
    return normalizedBlock !== normalizedSummary && !normalizedBlock.startsWith(normalizedSummary) && !normalizedSummary.startsWith(normalizedBlock);
  });
  const contentBlocks = uniqueRawBlocks.length > 1 ? uniqueRawBlocks : [
    article.summary,
    uniqueRawBlocks[0] ?? "本文根据公开发布信息整理，重点保留比赛时间、地点、赛事状态和原文来源，方便球迷快速判断是否需要继续查看官方原文。",
    "后续接入官方或合作数据源后，正文会进一步补充阵容、现场提醒、交通预约和相关球队资料。"
  ].filter(Boolean);
  const originalUrl = article.originalUrl ?? sourceBlocks.find((block) => block.startsWith("原文："))?.replace("原文：", "");
  return (
    <section className="page-content detail">
      <img className="detail-image" src={article.image} alt="" />
      <h1 className="detail-title">{article.title}</h1>
      <p className="meta">{article.source} · {formatPublishTime(article.publishedAt)} · 赞 {article.likes} · 评 {article.comments} · 藏 {article.favorites}</p>
      {article.imageCredit && <p className="image-credit">图片来源：{article.imageCredit}</p>}
      <div className="trust-strip">
        <span><ShieldCheck size={14} />来源已标注</span>
        <span><Clock3 size={14} />每日更新</span>
        <span><MessageCircle size={14} />可讨论</span>
      </div>
      <div className="body-copy">
        {contentBlocks.map((block) => <p key={block}>{block}</p>)}
      </div>
      <div className="source-box">
        <strong>资讯来源</strong>
        <span>{article.source}</span>
        {originalUrl && <a href={originalUrl} target="_blank" rel="noreferrer">查看原文</a>}
      </div>
      <div className="action-line prominent"><button onClick={() => onAction("点赞", article.title, "article")}>点赞</button><button onClick={() => onAction("评论", article.title, "article")}>评论</button><button onClick={() => onAction("收藏", article.title, "article")}>收藏</button></div>
      <SectionTitle title="热门评论" />
      <CommentList comments={comments.slice(0, 32)} onAction={(label) => onAction(label, article.title, "article")} />
      <p className="scroll-hint">下滑继续加载评论</p>
      <button className="primary-wide" onClick={onBack}>返回首页</button>
    </section>
  );
}

function PostDetail({ post, comments, onBack, onAction }: { post: Post; comments: Comment[]; onBack: () => void; onAction: (label: string, title?: string, targetType?: LocalActivity["targetType"]) => void }) {
  const hotComments = [...comments].sort((left, right) => right.likes - left.likes).slice(0, 3);
  return (
    <section className="page-content detail">
      <article className="list-card post-main">
        <span className="source-chip">社区热帖</span>
        <h1>{post.title}</h1>
        <div className="author-line">
          <div className="mini-avatar"><span>{post.author.slice(0, 1)}</span></div>
          <p><strong>{post.author}</strong><small>楼主 · {post.createdAt}</small></p>
        </div>
        <div>{post.body}</div>
        <strong>赞 {post.likes} · 评论 {post.comments} · 收藏 {post.favorites}</strong>
      </article>
      <div className="action-line prominent"><button onClick={() => onAction("点赞", post.title, "post")}>点赞</button><button onClick={() => onAction("回复", post.title, "post")}>回复</button><button onClick={() => onAction("收藏", post.title, "post")}>收藏</button></div>
      <SectionTitle title="高赞回复" />
      <div className="featured-comments">
        {hotComments.map((comment) => (
          <button className="list-card featured-comment" key={comment.id} onClick={() => onAction("评论点赞", post.title, "post")}>
            <strong>{comment.author}</strong>
            <p>{comment.body}</p>
            <span>赞 {comment.likes} · 回复 {comment.replies}</span>
          </button>
        ))}
      </div>
      <SectionTitle title="全部评论" />
      <CommentList comments={comments} onAction={(label) => onAction(label, post.title, "post")} />
      <p className="scroll-hint">下滑继续加载评论</p>
      <button className="primary-wide" onClick={onBack}>返回社区</button>
    </section>
  );
}

function CommentList({ comments, onAction }: { comments: Comment[]; onAction: (label: string) => void }) {
  return (
    <div className="comments">
      {comments.map((comment) => (
        <div className={`comment ${comment.parentId ? "reply-comment" : ""}`} key={comment.id}>
          <div className="mini-avatar">{comment.avatar ? <img src={comment.avatar} alt="" /> : <span>{comment.author.slice(0, 1)}</span>}</div>
          <div>
            <strong>{comment.author}{comment.likes > 120 && <em>高赞</em>}{comment.replyTo ? <span> 回复 {comment.replyTo}</span> : null}</strong>
            <p>{comment.body}</p>
            <button onClick={() => onAction("评论点赞")}>赞 {comment.likes}</button><button onClick={() => onAction("回复")}>回复 {comment.replies}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPublishTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMatchTime(match: Match) {
  if (match.status === "live") return `进行中 ${match.minute ?? ""}分`;
  return new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function matchStatusLabel(match: Match) {
  if (match.status === "live") return "进行中";
  if (match.status === "finished") return "已结束";
  if (match.status === "postponed") return "延期";
  return "未开始";
}

function filterMatchByRange(match: Match, range: string) {
  if (range === "14天") return true;
  const now = new Date();
  const date = new Date(match.startsAt);
  const target = new Date(now);
  if (range === "明日") target.setDate(now.getDate() + 1);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate();
}

function getRecencyScore(value: string) {
  if (value.includes("刚刚")) return 0;
  const minuteMatch = value.match(/(\d+)分钟/);
  if (minuteMatch) return Number(minuteMatch[1]);
  const hourMatch = value.match(/(\d+)小时/);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  const dayMatch = value.match(/(\d+)天/);
  if (dayMatch) return Number(dayMatch[1]) * 24 * 60;
  if (value.includes("昨天")) return 24 * 60;
  return 999999;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").replace(/[，。！？、：；,.!?;:]/g, "");
}

function scrollScreenToTop() {
  document.querySelector(".screen")?.scrollTo({ top: 0, behavior: "smooth" });
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="section-title">{title}</h2>;
}
