from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path("ui_exports")
OUT.mkdir(exist_ok=True)

W, H = 390, 844
C = {
    "bg": "#F6F8F5",
    "surface": "#FFFFFF",
    "ink": "#11130F",
    "muted": "#646B63",
    "line": "#E0E5DF",
    "green": "#0E6B38",
    "dark": "#061C13",
    "red": "#DB291E",
    "gold": "#F2AD38",
    "lime": "#B8E047",
    "pale_green": "#E7F5E7",
    "pale_gold": "#FFF4DB",
    "pale_blue": "#E8F0FF",
}

def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size=size, index=0)
        except Exception:
            pass
    return ImageFont.load_default()

F = {
    "xs": font(11),
    "sm": font(13),
    "md": font(15),
    "lg": font(18),
    "xl": font(23),
    "xxl": font(32),
}

def rounded(draw, box, fill, radius=12, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def txt(draw, xy, s, fill=C["ink"], size="md", anchor=None, align="left"):
    draw.text(xy, s, fill=fill, font=F[size], anchor=anchor, align=align)

def chip(draw, xy, label, fill=C["pale_green"], color=C["green"], w=62):
    x, y = xy
    rounded(draw, (x, y, x+w, y+24), fill, 12)
    txt(draw, (x+w/2, y+12), label, fill=color, size="xs", anchor="mm")

def nav(draw, active):
    rounded(draw, (0, 772, W, H), C["surface"], 0, C["line"])
    tabs = [("首页","Home"),("赛事","Events"),("社区","Community"),("文旅","Travel"),("我的","Mine")]
    for i,(label,key) in enumerate(tabs):
        x = i * 78
        on = key == active
        rounded(draw, (x+29, 793, x+49, 813), C["green"] if on else C["line"], 5)
        txt(draw, (x+39, 830), label, fill=C["green"] if on else C["muted"], size="xs", anchor="mm")

def header(draw, title, sub):
    txt(draw, (18, 21), sub, fill=C["muted"], size="xs")
    txt(draw, (18, 54), title, fill=C["ink"], size="xl")
    rounded(draw, (302, 22, 336, 56), C["surface"], 17, C["line"])
    txt(draw, (319, 39), "⌕", fill=C["muted"], size="lg", anchor="mm")
    rounded(draw, (344, 22, 378, 56), C["surface"], 17, C["line"])
    txt(draw, (361, 39), "●", fill=C["gold"], size="xs", anchor="mm")

def base(title, sub, active):
    im = Image.new("RGB", (W, H), C["bg"])
    d = ImageDraw.Draw(im)
    header(d, title, sub)
    nav(d, active)
    return im, d

def row(draw, y, title, sub, badge=None):
    rounded(draw, (18, y, 372, y+58), C["surface"], 12, C["line"])
    if badge:
        chip(draw, (32, y+17), badge, w=54)
        x = 98
    else:
        x = 36
    txt(draw, (x, y+18), title, size="md")
    txt(draw, (x, y+40), sub, fill=C["muted"], size="xs")
    txt(draw, (342, y+29), "›", fill=C["green"], size="xl", anchor="mm")

def team():
    im, d = base("球队详情", "贵州村超 · 榕江", "Events")
    rounded(d, (18,78,372,230), C["dark"], 16)
    rounded(d, (36,112,108,184), C["lime"], 36)
    txt(d, (72,148), "车", fill=C["dark"], size="xxl", anchor="mm")
    txt(d, (126,124), "车江一村足球队", fill="#FFFFFF", size="xl")
    txt(d, (126,158), "榕江县车江乡 · A组第1", fill="#D8EDD8", size="sm")
    rounded(d, (126,184,220,216), C["red"], 16)
    txt(d, (173,200), "关注球队", fill="#FFFFFF", size="xs", anchor="mm")
    txt(d, (18,278), "球队数据", size="lg")
    for i,(n,l) in enumerate([("19","积分"),("18","进球"),("6","失球"),("12K","粉丝")]):
        x=18+i*88
        rounded(d,(x,312,x+78,372),C["surface"],10,C["line"])
        txt(d,(x+39,333),n,fill=C["green"],size="lg",anchor="mm")
        txt(d,(x+39,358),l,fill=C["muted"],size="xs",anchor="mm")
    txt(d,(18,404),"球员名单",size="lg")
    for i,r in enumerate([("9","李明","前锋","8球"),("11","杨亮","边锋","5球"),("6","王强","中场","2助"),("1","陈刚","门将","3零封")]):
        y=440+i*58
        rounded(d,(18,y,372,y+46),C["surface"],10,C["line"])
        txt(d,(42,y+24),r[0],fill=C["green"],size="md",anchor="mm")
        txt(d,(78,y+17),r[1],size="md")
        txt(d,(188,y+17),r[2],fill=C["muted"],size="xs")
        txt(d,(338,y+24),r[3],fill=C["red"],size="sm",anchor="rm")
    im.save(OUT/"EXPORT_05_TEAM_球队详情.png")

def travel():
    im, d = base("文旅服务", "榕江 · 观赛出行", "Travel")
    rounded(d,(18,78,372,194),C["pale_gold"],16,C["gold"])
    txt(d,(36,118),"今晚比赛预约入场",size="lg")
    txt(d,(36,148),"官方预约入口 · 高峰期扫码限流",fill=C["muted"],size="sm")
    rounded(d,(268,119,346,153),C["red"],17)
    txt(d,(307,136),"去预约",fill="#FFFFFF",size="sm",anchor="mm")
    txt(d,(18,236),"到场服务",size="lg")
    items=[("导航","榕江村超足球场"),("停车","3个临时停车区"),("住宿","球场2km内"),("天气","夜间阵雨 23℃")]
    for i,(a,b) in enumerate(items):
        x=18+(i%2)*182; y=272+(i//2)*92
        rounded(d,(x,y,x+172,y+76),C["surface"],12,C["line"])
        rounded(d,(x+14,y+18,x+48,y+52),C["pale_blue"] if i==0 else C["pale_green"],10)
        txt(d,(x+60,y+22),a,size="md")
        txt(d,(x+60,y+46),b,fill=C["muted"],size="xs")
    txt(d,(18,486),"本周路线",size="lg")
    for i,(a,b) in enumerate([("非遗巡游 + 村超夜赛","3小时 · 适合首访游客"),("侗寨美食 + 球队主场","半日 · 亲子友好"),("全国赛城市展馆","2小时 · 特产采购")]):
        row(d,522+i*76,a,b)
    im.save(OUT/"EXPORT_06_TRAVEL_文旅服务.png")

def community():
    im, d = base("社区", "赛事讨论 · 文明观赛", "Community")
    for i,p in enumerate(["热帖","村超","苏超","球队圈"]):
        x=18+i*86
        rounded(d,(x,78,x+76,108),C["green"] if i==0 else C["surface"],15,C["green"] if i==0 else C["line"])
        txt(d,(x+38,93),p,fill="#FFFFFF" if i==0 else C["muted"],size="xs",anchor="mm")
    rounded(d,(18,124,372,192),C["surface"],12,C["line"])
    txt(d,(36,156),"聊聊今晚这场球，发帖前会自动审核",fill=C["muted"],size="sm")
    rounded(d,(292,141,346,171),C["green"],15)
    txt(d,(319,156),"发布",fill="#FFFFFF",size="xs",anchor="mm")
    txt(d,(18,232),"赛事热线",size="lg")
    posts=[("车江一村这次边路冲击很强","村超 · 比赛中 · 128评"),("南京主场氛围已经拉满了","苏超 · 关注中 · 86评"),("青超高原主场体能会不会是关键","青超 · 赛前 · 42评"),("外地游客第一次去榕江怎么停车","文旅问答 · 31答")]
    for i,(a,b) in enumerate(posts):
        y=268+i*104
        rounded(d,(18,y,372,y+86),C["surface"],12,C["line"])
        txt(d,(36,y+24),a,size="md")
        txt(d,(36,y+52),b,fill=C["muted"],size="xs")
        txt(d,(36,y+76),"赞  点评  举报",fill=C["green"],size="xs")
    im.save(OUT/"EXPORT_07_COMMUNITY_社区.png")

def profile():
    im, d = base("我的关注", "微信用户 · 已登录", "Mine")
    rounded(d,(18,78,372,190),C["surface"],16,C["line"])
    rounded(d,(36,104,94,162),C["green"],29)
    txt(d,(65,133),"我",fill="#FFFFFF",size="xl",anchor="mm")
    txt(d,(112,124),"村超观察员",size="lg")
    txt(d,(112,150),"关注 3 个联赛 · 6 支球队",fill=C["muted"],size="sm")
    rounded(d,(292,119,346,149),C["pale_green"],15)
    txt(d,(319,134),"设置",fill=C["green"],size="xs",anchor="mm")
    txt(d,(18,236),"关注联赛",size="lg")
    for i,(a,b) in enumerate([("村超","今晚2场进行中"),("苏超","本周6场"),("青超","周日德比")]):
        x=18+i*118
        rounded(d,(x,272,x+106,354),C["surface"],12,C["line"])
        txt(d,(x+53,298),a,fill=C["green"] if i==0 else C["ink"],size="lg",anchor="mm")
        txt(d,(x+53,330),b,fill=C["muted"],size="xs",anchor="mm")
    txt(d,(18,398),"提醒中心",size="lg")
    for i,(a,b) in enumerate([("19:30 车江一村 vs 口寨村","开赛前30分钟提醒"),("苏超 南京队主场","明天 18:00 推送首发"),("预约入场","榕江周末高峰限流提醒")]):
        y=434+i*74
        rounded(d,(18,y,372,y+58),C["surface"],12,C["line"])
        txt(d,(36,y+18),a,size="md")
        txt(d,(36,y+42),b,fill=C["muted"],size="xs")
        rounded(d,(308,y+17,350,y+39),C["green"] if i==0 else C["line"],11)
    im.save(OUT/"EXPORT_08_PROFILE_我的关注.png")

def flow():
    im = Image.new("RGB",(860,520),"#FAFBF7")
    d=ImageDraw.Draw(im)
    txt(d,(36,44),"核心用户路径检查",size="xl")
    txt(d,(36,84),"从首页进入赛事、切换联赛、查看比赛、关注球队、完成预约与讨论，形成闭环。",fill=C["muted"],size="sm")
    steps=[("首页","今日焦点与关注聚合"),("赛事频道","选择村超/苏超/青超"),("联赛首页","看赛制、榜单、球队"),("比赛详情","比分、事件、评论"),("球队详情","关注球队/球员"),("文旅服务","预约入场与出行"),("我的关注","提醒与收藏聚合")]
    for i,(a,b) in enumerate(steps):
        x=38+(i%4)*198; y=140+(i//4)*150
        rounded(d,(x,y,x+160,y+90),C["surface"],12,C["line"])
        txt(d,(x+80,y+34),a,fill=C["green"] if i==0 else C["ink"],size="lg",anchor="mm")
        txt(d,(x+80,y+62),b,fill=C["muted"],size="xs",anchor="mm")
        if i < len(steps)-1:
            txt(d,(x+180,y+45),"→",fill=C["green"],size="xl",anchor="mm")
    txt(d,(38,448),"完整性检查：多联赛入口不占底部 Tab；每个联赛都有独立主页；比赛详情能回流球队、社区和文旅；我的关注负责跨联赛聚合。",fill=C["green"],size="sm")
    im.save(OUT/"FLOW_核心用户路径.png")

team(); travel(); community(); profile(); flow()
print('generated', len(list(OUT.glob('*.png'))))
