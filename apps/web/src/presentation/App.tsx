import { CalendarDays, Heart, Home, MapPin, MessageCircle, Search, Star, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { Comment, ContentItem, Match, Post, Team } from "@cunchao/shared";
import { useBootstrap } from "../application/useBootstrap";
import type { DetailView, TabKey } from "../domain/types";

const navItems: Array<{ key: TabKey; label: string; icon: typeof Home }> = [
  { key: "home", label: "首页", icon: Home },
  { key: "events", label: "赛事", icon: CalendarDays },
  { key: "community", label: "社区", icon: MessageCircle },
  { key: "travel", label: "文旅", icon: MapPin },
  { key: "profile", label: "我的", icon: UserRound }
];

export function App() {
  const { data, loading } = useBootstrap();
  const [tab, setTab] = useState<TabKey>("home");
  const [selectedLeagueId, setSelectedLeagueId] = useState("gzcunchao");
  const [detail, setDetail] = useState<DetailView>(null);
  const [teamTab, setTeamTab] = useState("资讯");
  const [toast, setToast] = useState("");

  const league = data?.leagues.find((item) => item.id === selectedLeagueId);
  const leagueMatches = data?.matches.filter((match) => match.leagueId === selectedLeagueId) ?? [];

  const openDetail = (next: DetailView) => {
    setDetail(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const interact = (label: string) => {
    setToast(`${label}已记录，可在“我的”里找回`);
    window.setTimeout(() => setToast(""), 1800);
  };

  const screen = useMemo(() => {
    if (!data || loading) return <LoadingScreen />;
    if (detail?.type === "match") {
      const match = data.matches.find((item) => item.id === detail.id) ?? data.matches[0];
      return <MatchDetail match={match} comments={data.comments} onBack={() => setDetail(null)} onAction={interact} />;
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

    if (tab === "home") {
      return <HomePage contents={data.contents} matches={data.matches} onOpenArticle={(id) => openDetail({ type: "article", id })} onOpenMatch={(id) => openDetail({ type: "match", id })} onAction={interact} />;
    }
    if (tab === "events") {
      return (
        <EventsPage
          leagues={data.leagues}
          selectedLeagueId={selectedLeagueId}
          setSelectedLeagueId={setSelectedLeagueId}
          matches={leagueMatches}
          standings={data.standings}
          onOpenMatch={(id) => openDetail({ type: "match", id })}
          onOpenTeam={(id) => openDetail({ type: "team", id })}
        />
      );
    }
    if (tab === "community") {
      return <CommunityPage posts={data.posts} onOpenPost={(id) => openDetail({ type: "post", id })} />;
    }
    if (tab === "travel") {
      return <TravelPage guides={data.travelGuides} bookings={data.bookingEvents} leagueName={league?.name ?? "贵州村超"} onAction={interact} />;
    }
    return <ProfilePage activities={data.activities} teams={data.teams} onOpenTeam={(id) => openDetail({ type: "team", id })} />;
  }, [data, loading, detail, tab, selectedLeagueId, leagueMatches, league, teamTab]);

  return (
    <div className="app-viewport">
      <div className="phone-shell">
        <Header title={getTitle(tab, detail)} canBack={Boolean(detail)} onBack={() => setDetail(null)} />
        <main className="screen">{screen}</main>
        {!detail && <BottomNav active={tab} onChange={setTab} />}
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
  return { home: "平台首页", events: "赛事频道", community: "社区", travel: "文旅服务", profile: "我的" }[tab];
}

function Header({ title, canBack, onBack }: { title: string; canBack: boolean; onBack: () => void }) {
  return (
    <header className="top">
      <div className="status"><span>9:41</span><strong>村超</strong><span /></div>
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

function HomePage({ contents, matches, onOpenArticle, onOpenMatch, onAction }: { contents: ContentItem[]; matches: Match[]; onOpenArticle: (id: string) => void; onOpenMatch: (id: string) => void; onAction: (label: string) => void }) {
  const live = matches.find((match) => match.status === "live") ?? matches[0];
  return (
    <section className="page-content">
      <button className="hero-card" onClick={() => onOpenMatch(live.id)}>
        <img src="/assets/football-crowd.jpg" alt="村超现场" />
        <div>
          <h1>今晚焦点：{live.homeTeam}迎战{live.awayTeam}</h1>
          <p>赛前热度 12.8万 · {live.venue}</p>
        </div>
      </button>
      <div className="chips">
        {["全部", "村超", "苏超", "战报", "文旅"].map((item, index) => <button className={index === 0 ? "selected" : ""} key={item}>{item}</button>)}
      </div>
      <div className="feed">
        {contents.map((item) => (
          <ArticleRow key={item.id} item={item} onOpen={() => onOpenArticle(item.id)} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

function ArticleRow({ item, onOpen, onAction }: { item: ContentItem; onOpen: () => void; onAction: (label: string) => void }) {
  return (
    <article className="list-card article-row">
      <button onClick={onOpen}>
        <div>
          <h3>{item.title}</h3>
          <p>{item.source} · 赞 {item.likes} · 评 {item.comments} · 藏 {item.favorites}</p>
        </div>
        <img src={item.image} alt="" />
      </button>
      <div className="action-line">
        <button onClick={() => onAction("点赞")}>点赞</button>
        <button onClick={() => onAction("评论")}>评论</button>
        <button onClick={() => onAction("收藏")}>收藏</button>
      </div>
    </article>
  );
}

function EventsPage({ leagues, selectedLeagueId, setSelectedLeagueId, matches, standings, onOpenMatch, onOpenTeam }: { leagues: Array<{ id: string; shortName: string; name: string; liveHint?: string; nextHint?: string }>; selectedLeagueId: string; setSelectedLeagueId: (id: string) => void; matches: Match[]; standings: Array<{ rank: number; teamName: string; points: number; teamId: string }>; onOpenMatch: (id: string) => void; onOpenTeam: (id: string) => void }) {
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
      <SectionTitle title="未来两周赛程" />
      {matches.length ? matches.map((match) => <MatchCard key={match.id} match={match} onOpen={() => onOpenMatch(match.id)} />) : (
        <div className="list-card empty-card">
          <strong>暂无未来两周赛程</strong>
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
      <small>{match.status === "live" ? `进行中 ${match.minute}分` : `${date} · ${match.venue}`}</small>
    </button>
  );
}

function MatchDetail({ match, comments, onBack, onAction }: { match: Match; comments: Comment[]; onBack: () => void; onAction: (label: string) => void }) {
  return (
    <section className="page-content detail">
      <div className="scoreboard">
        <span>{match.homeTeam}</span><strong>{match.score ? `${match.score.home} - ${match.score.away}` : "VS"}</strong><span>{match.awayTeam}</span>
        <p>{match.status === "live" ? `进行中 ${match.minute}分` : new Date(match.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {match.venue}</p>
      </div>
      <div className="list-card events">
        <h3>{match.status === "scheduled" ? "赛前信息" : "关键事件"}</h3>
        {match.status === "scheduled" ? (
          <>
            <p>比赛尚未开始，比分将在开赛后更新。</p>
            <p>地点：{match.venue}</p>
            {match.source && <p>赛程来源：{match.source}</p>}
          </>
        ) : (
          <>
            <p>12分 车江二村 7号远射破门</p>
            <p>31分 寨蒿队反击扳平</p>
            <p>63分 车江二村头球再度领先</p>
          </>
        )}
      </div>
      <SectionTitle title="互动讨论" />
      <CommentList comments={comments} onAction={onAction} />
      <p className="scroll-hint">下滑继续加载评论</p>
      <button className="primary-wide" onClick={onBack}>返回赛事频道</button>
    </section>
  );
}

function TeamDetail({ team, teamTab, setTeamTab, contents, matches, comments, onBack, onOpenMatch, onAction }: { team: Team; teamTab: string; setTeamTab: (tab: string) => void; contents: ContentItem[]; matches: Match[]; comments: Comment[]; onBack: () => void; onOpenMatch: (id: string) => void; onAction: (label: string) => void }) {
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
      {teamTab === "资讯" && contents.slice(0, 2).map((item) => <ArticleRow key={item.id} item={item} onOpen={() => onAction("打开资讯")} onAction={onAction} />)}
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

function CommunityPage({ posts, onOpenPost }: { posts: Post[]; onOpenPost: (id: string) => void }) {
  return (
    <section className="page-content">
      <div className="chips"><button className="selected">推荐</button><button>村超</button><button>苏超</button><button>球队圈</button></div>
      {posts.map((post) => (
        <button className="list-card post-card" key={post.id} onClick={() => onOpenPost(post.id)}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <small>{post.author} · {post.createdAt}</small>
          <span>赞 {post.likes} · 评 {post.comments} · 藏 {post.favorites}</span>
        </button>
      ))}
    </section>
  );
}

function TravelPage({ guides, bookings, leagueName, onAction }: { guides: Array<{ id: string; title: string; summary: string; image: string; tags: string[] }>; bookings: Array<{ id: string; title: string; venue: string; startsAt: string; availability: string }>; leagueName: string; onAction: (label: string) => void }) {
  return (
    <section className="page-content">
      <SectionTitle title="按比赛预约入场" />
      {bookings.map((booking) => (
        <div className="list-card booking" key={booking.id}>
          <h3>{booking.title}</h3>
          <p>{new Date(booking.startsAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {booking.venue} · 余量充足</p>
          <button onClick={() => onAction("预约入场")}>预约入场</button><button>换场次</button>
        </div>
      ))}
      <SectionTitle title={`${leagueName} 村寨文旅攻略`} />
      {guides.map((guide) => (
        <article className="travel-card" key={guide.id}>
          <img src={guide.image} alt="" />
          <h3>{guide.title}</h3>
          <p>{guide.summary}</p>
          <div className="chips compact">{guide.tags.concat("搜索").map((tag, index) => <button className={index === 0 ? "selected" : ""} key={tag}>{tag}</button>)}</div>
        </article>
      ))}
    </section>
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

function ArticleDetail({ article, comments, onBack, onAction }: { article: ContentItem; comments: Comment[]; onBack: () => void; onAction: (label: string) => void }) {
  const bodyBlocks = (article.body ?? article.summary).split(/\n{2,}/).filter(Boolean);
  const sourceBlocks = bodyBlocks.filter((block) => block.startsWith("来源：") || block.startsWith("原文："));
  const contentBlocks = bodyBlocks.filter((block) => !sourceBlocks.includes(block));
  const originalUrl = article.originalUrl ?? sourceBlocks.find((block) => block.startsWith("原文："))?.replace("原文：", "");
  return (
    <section className="page-content detail">
      <img className="detail-image" src={article.image} alt="" />
      <h1 className="detail-title">{article.title}</h1>
      <p className="meta">{article.source} · 赞 {article.likes} · 评 {article.comments} · 藏 {article.favorites}</p>
      {article.imageCredit && <p className="image-credit">图片来源：{article.imageCredit}</p>}
      <div className="body-copy">
        {contentBlocks.map((block) => <p key={block}>{block}</p>)}
      </div>
      <div className="source-box">
        <strong>资讯来源</strong>
        <span>{article.source}</span>
        {originalUrl && <a href={originalUrl} target="_blank" rel="noreferrer">查看原文</a>}
      </div>
      <div className="action-line prominent"><button onClick={() => onAction("点赞")}>点赞</button><button onClick={() => onAction("评论")}>评论</button><button onClick={() => onAction("收藏")}>收藏</button></div>
      <SectionTitle title="热门评论" />
      <CommentList comments={comments} onAction={onAction} />
      <p className="scroll-hint">下滑继续加载评论</p>
      <button className="primary-wide" onClick={onBack}>返回首页</button>
    </section>
  );
}

function PostDetail({ post, comments, onBack, onAction }: { post: Post; comments: Comment[]; onBack: () => void; onAction: (label: string) => void }) {
  return (
    <section className="page-content detail">
      <article className="list-card post-main">
        <h1>{post.title}</h1>
        <p>楼主 {post.author} · {post.createdAt}</p>
        <div>{post.body}</div>
        <strong>赞 {post.likes} · 评论 {post.comments} · 收藏 {post.favorites}</strong>
      </article>
      <div className="action-line prominent"><button onClick={() => onAction("点赞")}>点赞</button><button onClick={() => onAction("回复")}>回复</button><button onClick={() => onAction("收藏")}>收藏</button></div>
      <SectionTitle title="全部评论" />
      <CommentList comments={comments} onAction={onAction} />
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
          <div className="mini-avatar" />
          <div>
            <strong>{comment.author}{comment.replyTo ? <span> 回复 {comment.replyTo}</span> : null}</strong>
            <p>{comment.body}</p>
            <button onClick={() => onAction("评论点赞")}>赞 {comment.likes}</button><button onClick={() => onAction("回复")}>回复 {comment.replies}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="section-title">{title}</h2>;
}
