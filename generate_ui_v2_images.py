from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

OUT = Path("ui_exports_v2")
OUT.mkdir(exist_ok=True)

W, H = 390, 844
SAFE_TOP = 18
NAV_Y = 780

C = {
    "bg": "#F6F7F8",
    "surface": "#FFFFFF",
    "ink": "#15171A",
    "sub": "#5E6470",
    "muted": "#8A9099",
    "line": "#E9ECEF",
    "line2": "#F1F2F4",
    "green": "#0A7A3D",
    "green_dark": "#07552C",
    "red": "#E6362E",
    "orange": "#FF8A00",
    "blue": "#2F6FED",
    "gold": "#D79B2B",
    "tag_green": "#EAF7EF",
    "tag_red": "#FFF0EF",
    "tag_blue": "#EEF4FF",
    "tag_gold": "#FFF7E8",
}


def get_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size=size, index=0)
        except Exception:
            pass
    return ImageFont.load_default()


F = {k: get_font(v) for k, v in {
    "xs": 10, "sm": 12, "body": 14, "md": 15, "lg": 17, "xl": 21, "xxl": 28
}.items()}


def draw_text(d, xy, text, fill=C["ink"], font="body", anchor=None, align="left", max_w=None):
    if max_w:
        text = ellipsize(d, text, F[font], max_w)
    d.text(xy, text, fill=fill, font=F[font], anchor=anchor, align=align)


def ellipsize(d, text, font, max_w):
    if d.textlength(text, font=font) <= max_w:
        return text
    out = text
    while out and d.textlength(out + "…", font=font) > max_w:
        out = out[:-1]
    return out + "…"


def rr(d, box, fill=C["surface"], r=10, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def line(d, y, x1=16, x2=374):
    d.line((x1, y, x2, y), fill=C["line"], width=1)


def base(title, sub="", active="首页"):
    img = Image.new("RGB", (W, H), C["bg"])
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 72), fill=C["surface"])
    draw_text(d, (16, 20), title, font="xl")
    if sub:
        draw_text(d, (16, 48), sub, fill=C["muted"], font="sm", max_w=210)
    rr(d, (292, 22, 326, 56), "#F7F8FA", 17)
    draw_text(d, (309, 39), "搜", fill=C["sub"], font="sm", anchor="mm")
    rr(d, (340, 22, 374, 56), "#F7F8FA", 17)
    draw_text(d, (357, 39), "铃", fill=C["orange"], font="sm", anchor="mm")
    d.rectangle((0, NAV_Y, W, H), fill=C["surface"])
    line(d, NAV_Y, 0, W)
    navs = ["首页", "赛事", "社区", "文旅", "我的"]
    for i, n in enumerate(navs):
        x = i * 78
        on = n == active
        rr(d, (x + 29, NAV_Y + 13, x + 49, NAV_Y + 33), C["green"] if on else "#DDE2E5", 6)
        draw_text(d, (x + 39, NAV_Y + 54), n, fill=C["green"] if on else C["muted"], font="xs", anchor="mm")
    return img, d


def tag(d, x, y, text, tone="green", w=None):
    fills = {"green": C["tag_green"], "red": C["tag_red"], "blue": C["tag_blue"], "gold": C["tag_gold"], "gray": "#F2F3F5"}
    colors = {"green": C["green"], "red": C["red"], "blue": C["blue"], "gold": C["gold"], "gray": C["sub"]}
    if w is None:
        w = int(d.textlength(text, font=F["xs"]) + 18)
    rr(d, (x, y, x + w, y + 22), fills[tone], 11)
    draw_text(d, (x + w / 2, y + 11), text, fill=colors[tone], font="xs", anchor="mm")
    return w


def section(d, y, title, more="更多"):
    draw_text(d, (16, y), title, font="lg")
    if more:
        draw_text(d, (372, y + 2), more, fill=C["green"], font="sm", anchor="ra")


def match_row(d, y, league, home, away, score, meta, live=False):
    rr(d, (16, y, 374, y + 86), C["surface"], 12, C["line"])
    tag(d, 28, y + 12, league, "green" if league == "村超" else "blue")
    tag(d, 305, y + 12, "进行中" if live else "未开始", "red" if live else "gray", 54)
    draw_text(d, (36, y + 48), home, font="md", max_w=86)
    draw_text(d, (195, y + 45), score, fill=C["red"] if live else C["green"], font="xl", anchor="mm")
    draw_text(d, (354, y + 48), away, font="md", anchor="ra", max_w=86)
    draw_text(d, (195, y + 72), meta, fill=C["muted"], font="xs", anchor="mm")


def news_item(d, y, title, source, stats, hot=False):
    rr(d, (16, y, 374, y + 82), C["surface"], 0)
    draw_text(d, (16, y + 12), title, font="md", max_w=260)
    if hot:
        tag(d, 16, y + 40, "热议", "red", 42)
        sx = 64
    else:
        sx = 16
    draw_text(d, (sx, y + 44), source, fill=C["muted"], font="xs", max_w=130)
    draw_text(d, (360, y + 44), stats, fill=C["muted"], font="xs", anchor="ra")
    rr(d, (304, y + 14, 358, y + 62), "#EEF1F4", 8)
    line(d, y + 82)


def pill_nav(d, y, labels, active=0):
    x = 16
    for i, label in enumerate(labels):
        w = int(d.textlength(label, font=F["sm"]) + 28)
        rr(d, (x, y, x + w, y + 30), C["green"] if i == active else C["surface"], 15, C["line"])
        draw_text(d, (x + w / 2, y + 15), label, fill="#FFFFFF" if i == active else C["sub"], font="sm", anchor="mm")
        x += w + 8


def home():
    img, d = base("村超", "多联赛群众足球资讯平台", "首页")
    pill_nav(d, 84, ["推荐", "关注", "赛程", "视频", "文旅"], 0)
    rr(d, (16, 126, 374, 212), C["surface"], 14, C["line"])
    tag(d, 30, 142, "正在直播", "red", 58)
    draw_text(d, (30, 172), "车江一村 2:1 口寨村", font="xl")
    draw_text(d, (30, 198), "68′ 下半场 · 12.8万人正在看", fill=C["muted"], font="sm")
    rr(d, (292, 162, 350, 194), C["red"], 16)
    draw_text(d, (321, 178), "进入", fill="#FFFFFF", font="sm", anchor="mm")
    section(d, 236, "资讯流")
    items = [
        ("贵州村超20强赛进入关键轮，车江一村边路爆发", "村超战报", "赞 2.1k 评 428 藏 96", True),
        ("苏超南京主场周末开票，城市德比热度继续升温", "苏超频道", "赞 986 评 177 藏 53", False),
        ("榕江周末观赛攻略：停车、预约和非遗巡游时间表", "文旅服务", "赞 633 评 91 藏 188", False),
        ("青超高原主场迎来焦点战，西宁队公布首发名单", "青超频道", "赞 421 评 66 藏 27", False),
        ("村超全国赛各省晋级路径更新，广东球队领跑热榜", "全国赛", "赞 1.3k 评 205 藏 78", True),
    ]
    y = 268
    for item in items:
        news_item(d, y, *item)
        y += 88
    img.save(OUT / "EXPORT_01_HOME_平台首页.png")


def events():
    img, d = base("赛事", "横滑切换联赛，轻按筛赛程，二次进入联赛", "赛事")
    pill_nav(d, 82, ["关注", "村超", "苏超", "青超", "全国赛"], 1)
    section(d, 128, "联赛横滑卡")
    leagues = [
        ("村超", "正在进行 车江一村 2:1 口寨村", "今晚 19:30 忠诚村 vs 三宝队", "red"),
        ("苏超", "今日无直播", "周六 南京队 vs 苏州队", "blue"),
        ("青超", "今日无直播", "周日 西宁队 vs 海东队", "green"),
    ]
    for i, (name, live, next_game, tone) in enumerate(leagues):
        x = 16 + i * 128
        rr(d, (x, 164, x + 116, 246), C["surface"], 14, C["line"])
        draw_text(d, (x + 14, 182), name, font="lg")
        draw_text(d, (x + 14, 208), live, fill=C["red"] if "正在" in live else C["muted"], font="xs", max_w=88)
        draw_text(d, (x + 14, 228), next_game, fill=C["muted"], font="xs", max_w=88)
    rr(d, (16, 266, 374, 310), C["surface"], 12, C["line"])
    draw_text(d, (30, 282), "当前：村超 · 20强赛 · 今天", font="sm")
    draw_text(d, (344, 282), "筛选", fill=C["green"], font="sm", anchor="ra")
    section(d, 334, "接下来赛程")
    match_row(d, 368, "村超", "车江一村", "口寨村", "2 : 1", "68′ · 榕江村超足球场", True)
    match_row(d, 466, "村超", "忠诚村", "三宝队", "19:30", "今晚 · 榕江村超足球场")
    match_row(d, 564, "村超", "平永村", "宰荡村", "15:00", "明天 · B组")
    draw_text(d, (30, 678), "交互：轻按联赛卡筛选上方赛程；再次轻按进入联赛首页。点击比赛进入比赛详情。", fill=C["sub"], font="xs", max_w=330)
    img.save(OUT / "EXPORT_02_EVENTS_赛事频道.png")


def league():
    img, d = base("贵州村超", "联赛首页", "赛事")
    rr(d, (16, 82, 374, 162), C["surface"], 14, C["line"])
    draw_text(d, (30, 104), "榕江（三宝侗寨）和美乡村足球超级联赛", font="lg", max_w=280)
    draw_text(d, (30, 132), "137队 · 20组 · 422场预选赛 · 20强赛进行中", fill=C["muted"], font="xs")
    pill_nav(d, 184, ["赛程", "排行", "球队", "资讯", "文旅"], 0)
    section(d, 232, "赛程")
    match_row(d, 266, "A组", "车江一村", "口寨村", "2 : 1", "下半场 68′", True)
    match_row(d, 364, "A组", "忠诚村", "三宝队", "19:30", "今晚 · 榕江")
    section(d, 486, "排行榜")
    rr(d, (16, 520, 374, 686), C["surface"], 12, C["line"])
    rows = [("1", "车江一村", "6胜1平", "19"), ("2", "口寨村", "5胜2平", "17"), ("3", "忠诚村", "5胜1负", "15"), ("4", "三宝队", "4胜2平", "14")]
    for i, row in enumerate(rows):
        y = 542 + i * 34
        draw_text(d, (34, y), row[0], fill=C["red"] if i == 0 else C["muted"], font="sm")
        draw_text(d, (72, y), row[1], font="sm")
        draw_text(d, (236, y), row[2], fill=C["muted"], font="xs")
        draw_text(d, (344, y), row[3], fill=C["green"], font="sm", anchor="ra")
    img.save(OUT / "EXPORT_03_LEAGUE_联赛首页.png")


def match():
    img, d = base("比赛详情", "村超 · 20强 A组", "赛事")
    rr(d, (16, 82, 374, 206), C["surface"], 16, C["line"])
    draw_text(d, (76, 112), "车江一村", font="md", anchor="mm")
    draw_text(d, (314, 112), "口寨村", font="md", anchor="mm")
    draw_text(d, (195, 126), "2 : 1", fill=C["red"], font="xxl", anchor="mm")
    tag(d, 168, 164, "68′ 进行中", "red", 62)
    draw_text(d, (195, 192), "榕江村超足球场 · 12.8万人热议", fill=C["muted"], font="xs", anchor="mm")
    pill_nav(d, 230, ["赛况", "数据", "阵容", "评论"], 0)
    section(d, 282, "关键事件")
    events = [("68′", "车江一村", "9号 李明禁区推射破门"), ("52′", "口寨村", "6号 王强战术犯规染黄"), ("31′", "车江一村", "11号 杨亮反击得分"), ("18′", "口寨村", "10号 张涛扳平比分")]
    for i, e in enumerate(events):
        y = 318 + i * 64
        rr(d, (16, y, 374, y + 52), C["surface"], 10, C["line"])
        draw_text(d, (34, y + 18), e[0], fill=C["green"], font="sm")
        draw_text(d, (88, y + 14), e[1], font="sm")
        draw_text(d, (88, y + 34), e[2], fill=C["muted"], font="xs")
    section(d, 604, "互动")
    rr(d, (16, 638, 374, 716), C["surface"], 12, C["line"])
    draw_text(d, (32, 660), "这场节奏太快了，车江一村右路完全打开了。", font="sm", max_w=300)
    draw_text(d, (32, 690), "赞 128 · 回复 42 · 收藏", fill=C["muted"], font="xs")
    img.save(OUT / "EXPORT_04_MATCH_比赛详情.png")


def team():
    img, d = base("车江一村足球队", "贵州村超 · 榕江车江乡", "赛事")
    rr(d, (16, 82, 374, 154), C["surface"], 12, C["line"])
    rr(d, (30, 100, 70, 140), C["green"], 20)
    draw_text(d, (50, 120), "车", fill="#FFFFFF", font="lg", anchor="mm")
    draw_text(d, (86, 100), "A组第1 · 6胜1平 · 18进球", font="sm")
    draw_text(d, (86, 124), "关注 12,384 · 本周 2 场比赛", fill=C["muted"], font="xs")
    rr(d, (306, 104, 358, 136), C["red"], 16)
    draw_text(d, (332, 120), "关注", fill="#FFFFFF", font="sm", anchor="mm")
    pill_nav(d, 176, ["资讯", "赛程", "球员", "讨论", "球队信息"], 0)
    section(d, 224, "球队资讯")
    news_item(d, 256, "车江一村右路组合连续三场制造进球", "球队动态", "赞 389 评 71 藏 18", True)
    news_item(d, 344, "队长李明：今年目标先进四强，再谈冠军", "人物", "赞 216 评 38 藏 22", False)
    section(d, 454, "未来赛程")
    match_row(d, 488, "A组", "车江一村", "忠诚村", "19:30", "周六 · 榕江")
    section(d, 604, "讨论区摘选")
    row_discuss(d, 638, "车江一村今年防线比去年稳很多", "赞 88 · 评 21 · 藏 9")
    row_discuss(d, 706, "有没有车江村旅游攻略，周末想顺路去", "赞 42 · 评 16 · 藏 31")
    img.save(OUT / "EXPORT_05_TEAM_球队详情.png")


def row_discuss(d, y, title, stats):
    rr(d, (16, y, 374, y + 54), C["surface"], 10, C["line"])
    draw_text(d, (30, y + 14), title, font="sm", max_w=280)
    draw_text(d, (30, y + 36), stats, fill=C["muted"], font="xs")


def travel():
    img, d = base("文旅服务", "按比赛预约，按村寨探索", "文旅")
    pill_nav(d, 84, ["比赛预约", "村寨攻略", "住宿", "美食"], 0)
    section(d, 132, "预约哪一场")
    rr(d, (16, 166, 374, 254), C["surface"], 14, C["line"])
    tag(d, 30, 184, "今晚", "red", 42)
    draw_text(d, (84, 184), "车江一村 vs 口寨村", font="md")
    draw_text(d, (84, 210), "榕江村超足球场 · 19:30 · 余量紧张", fill=C["muted"], font="xs")
    rr(d, (298, 196, 354, 228), C["red"], 16)
    draw_text(d, (326, 212), "预约", fill="#FFFFFF", font="sm", anchor="mm")
    match_row(d, 270, "村超", "忠诚村", "三宝队", "19:30", "明天 · 榕江村超足球场")
    section(d, 386, "按村寨探索")
    rr(d, (16, 420, 374, 488), C["surface"], 12, C["line"])
    draw_text(d, (30, 438), "搜索村寨 / 球队 / 附近目的地", fill=C["muted"], font="sm")
    tag(d, 30, 462, "车江村", "green", 52)
    tag(d, 90, 462, "三宝侗寨", "blue", 66)
    tag(d, 166, 462, "口寨村", "green", 52)
    section(d, 520, "村寨攻略")
    for i, (a, b) in enumerate([("车江村半日路线", "球队主场故事 · 稻田步道 · 酸汤鱼"), ("三宝侗寨夜游", "鼓楼巡游 · 非遗表演 · 赛后夜宵")]):
        y = 554 + i * 82
        rr(d, (16, y, 374, y + 66), C["surface"], 12, C["line"])
        draw_text(d, (30, y + 16), a, font="md")
        draw_text(d, (30, y + 42), b, fill=C["muted"], font="xs", max_w=270)
        draw_text(d, (346, y + 34), "›", fill=C["green"], font="xl", anchor="mm")
    img.save(OUT / "EXPORT_06_TRAVEL_文旅服务.png")


def community():
    img, d = base("社区", "赛事热线 · 球队圈 · 文旅问答", "社区")
    pill_nav(d, 84, ["热帖", "村超", "苏超", "球队圈"], 0)
    rr(d, (16, 126, 374, 176), C["surface"], 12, C["line"])
    draw_text(d, (30, 146), "发布你的观点，发出前将进行内容审核", fill=C["muted"], font="sm")
    rr(d, (308, 136, 356, 166), C["green"], 15)
    draw_text(d, (332, 151), "发布", fill="#FFFFFF", font="sm", anchor="mm")
    section(d, 204, "赛事热帖")
    posts = [
        ("车江一村这次边路冲击很强", "村超 · 128赞 · 42评 · 19藏"),
        ("南京主场氛围已经拉满了", "苏超 · 86赞 · 31评 · 12藏"),
        ("青超高原主场体能会不会是关键", "青超 · 64赞 · 18评 · 9藏"),
        ("外地游客第一次去榕江怎么停车", "文旅问答 · 42赞 · 31答 · 28藏"),
    ]
    for i, p in enumerate(posts):
        row_discuss(d, 238 + i * 78, *p)
    img.save(OUT / "EXPORT_07_COMMUNITY_社区.png")


def profile():
    img, d = base("我的", "关注、收藏、评论都在这里", "我的")
    rr(d, (16, 82, 374, 154), C["surface"], 14, C["line"])
    rr(d, (30, 102, 70, 142), C["green"], 20)
    draw_text(d, (50, 122), "我", fill="#FFFFFF", font="lg", anchor="mm")
    draw_text(d, (86, 102), "村超观察员", font="md")
    draw_text(d, (86, 126), "关注 3 个联赛 · 6 支球队 · 18条互动", fill=C["muted"], font="xs")
    pill_nav(d, 176, ["关注", "评论", "点赞", "收藏", "浏览"], 1)
    section(d, 224, "我参与的评论")
    news_item(d, 256, "回复了：车江一村这次边路冲击很强", "我的评论：右路两个传中质量很高", "2分钟前", False)
    news_item(d, 344, "评论了：榕江周末观赛攻略", "我的评论：停车场入口能否再补一张图", "昨天", False)
    section(d, 454, "收藏的资讯和帖子")
    news_item(d, 486, "榕江周末观赛攻略：停车、预约和非遗巡游", "已收藏资讯", "赞 633 评 91", False)
    news_item(d, 574, "外地游客第一次去榕江怎么停车", "已收藏帖子", "42赞 31答", False)
    img.save(OUT / "EXPORT_08_PROFILE_我的关注.png")


def article():
    img, d = base("资讯详情", "村超战报", "首页")
    draw_text(d, (16, 88), "贵州村超20强赛进入关键轮，车江一村边路爆发", font="xl", max_w=350)
    draw_text(d, (16, 146), "村超战报 · 20分钟前 · 12.8万阅读", fill=C["muted"], font="xs")
    rr(d, (16, 180, 374, 324), "#EEF1F4", 12)
    draw_text(d, (195, 252), "新闻封面图 / 比赛现场图", fill=C["muted"], font="sm", anchor="mm")
    body = ["车江一村在下半场持续压上，右路连续制造威胁。第68分钟，9号李明接队友横传推射破门。", "本场比赛的讨论热度持续上升，已有428条评论。资讯点赞、评论、收藏后会同步沉淀到“我的”页面。"]
    y = 354
    for p in body:
        draw_text(d, (16, y), p, font="body", max_w=350)
        y += 58
    rr(d, (16, 498, 374, 548), C["surface"], 12, C["line"])
    draw_text(d, (34, 518), "赞 2.1k", fill=C["red"], font="sm")
    draw_text(d, (136, 518), "评论 428", fill=C["sub"], font="sm")
    draw_text(d, (252, 518), "收藏 96", fill=C["sub"], font="sm")
    section(d, 584, "热门评论")
    row_discuss(d, 618, "这球确实漂亮，右边路完全打穿了。", "赞 88 · 回复 12")
    row_discuss(d, 686, "希望赛后能补一版技术统计。", "赞 43 · 回复 7")
    img.save(OUT / "EXPORT_09_ARTICLE_资讯详情.png")


def post_detail():
    img, d = base("帖子详情", "村超 · 赛事热线", "社区")
    rr(d, (16, 84, 374, 250), C["surface"], 14, C["line"])
    draw_text(d, (30, 106), "车江一村这次边路冲击很强", font="xl", max_w=320)
    draw_text(d, (30, 154), "楼主 榕江看球人 · 8分钟前", fill=C["muted"], font="xs")
    draw_text(d, (30, 184), "现场看下来，车江一村的两个边路都很敢压，口寨村中场回防有点慢。", font="body", max_w=320)
    draw_text(d, (30, 226), "赞 128 · 评论 42 · 收藏 19", fill=C["muted"], font="xs")
    section(d, 282, "全部评论")
    comments = [
        ("1楼", "右路9号速度很快，第三次冲刺还能起脚。", "赞 32 · 回复"),
        ("2楼", "口寨村下半场应该早点换人，中场被压住了。", "赞 18 · 回复"),
        ("3楼", "有没有懂的说说这场净胜球影响排名吗？", "赞 11 · 3回复"),
        ("4楼", "现场氛围真的好，外地游客第一次来很震撼。", "赞 26 · 回复"),
    ]
    for i, c in enumerate(comments):
        y = 316 + i * 86
        rr(d, (16, y, 374, y + 72), C["surface"], 10, C["line"])
        tag(d, 30, y + 14, c[0], "gray", 38)
        draw_text(d, (78, y + 16), c[1], font="sm", max_w=250)
        draw_text(d, (78, y + 44), c[2], fill=C["muted"], font="xs")
    img.save(OUT / "EXPORT_10_POST_帖子详情.png")


def flow():
    img = Image.new("RGB", (920, 560), "#FFFFFF")
    d = ImageDraw.Draw(img)
    draw_text(d, (28, 28), "V2 用户路径与行为沉淀", font="xl")
    draw_text(d, (28, 62), "资讯流、赛事、球队、社区、文旅和我的页面形成闭环；点赞/评论/收藏会回到我的页面。", fill=C["sub"], font="sm")
    steps = [
        ("首页资讯流", "看新闻/点赞/收藏"),
        ("资讯详情", "阅读与评论"),
        ("赛事频道", "横滑选联赛"),
        ("联赛首页", "赛程与榜单"),
        ("比赛详情", "看赛况/进评论"),
        ("球队主页", "资讯/赛程/球员/讨论/信息"),
        ("文旅服务", "选择比赛预约/按村寨探索"),
        ("社区帖子", "发帖/回复/收藏"),
        ("我的", "找回评论、点赞、收藏、关注"),
    ]
    for i, (a, b) in enumerate(steps):
        x = 28 + (i % 3) * 298
        y = 118 + (i // 3) * 132
        rr(d, (x, y, x + 250, y + 86), C["surface"], 14, C["line"])
        draw_text(d, (x + 18, y + 20), a, fill=C["green"] if i == 0 else C["ink"], font="lg")
        draw_text(d, (x + 18, y + 52), b, fill=C["sub"], font="sm")
        if i < len(steps) - 1:
            draw_text(d, (x + 268, y + 42), "→", fill=C["green"], font="xl", anchor="mm")
    img.save(OUT / "FLOW_核心用户路径.png")


def contact_sheet():
    files = sorted(OUT.glob("EXPORT_*.png"))
    thumbs = []
    for p in files:
        im = Image.open(p).convert("RGB")
        im.thumbnail((156, 338))
        thumbs.append((p, im.copy()))
    out = Image.new("RGB", (5 * 210, 2 * 392), "#FFFFFF")
    d = ImageDraw.Draw(out)
    for i, (p, im) in enumerate(thumbs):
        x = (i % 5) * 210 + 28
        y = (i // 5) * 392 + 16
        out.paste(im, (x, y))
        draw_text(d, (x, y + 344), p.stem, font="xs", fill=C["ink"], max_w=180)
    out.save(OUT / "UI_CONTACT_SHEET_V2.png")


for fn in [home, events, league, match, team, travel, community, profile, article, post_detail, flow]:
    fn()
contact_sheet()
print("generated", len(list(OUT.glob("*.png"))))
