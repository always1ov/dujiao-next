"""造一套接近真实的演示数据，给本地全栈冒烟与点击测试用（只打本地，不碰线上）。

用法: ADMIN_USER=<后台账号> ADMIN_PASS=<后台密码> python3 seed-demo.py
环境变量: BASE_URL（默认 http://127.0.0.1:18090）
内容: 合规声明确认、SVG 横幅/图标/封面上传、站点与导航设置、首页公告弹窗、二级分类、
      27 个商品（含 SKU / 批发价 / 售罄 / 限购 / 会员专属）、2 篇公告 + 2 篇文章、2 张横幅、2 条指向假网关的易支付渠道。
脚本可重复执行：已存在的商品按 slug 跳过。
"""
import json, urllib.request, uuid, sys, os
BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:18090').rstrip('/') + '/api/v1'
ADMIN_USER = os.environ.get('ADMIN_USER') or sys.exit('缺 ADMIN_USER 环境变量')
ADMIN_PASS = os.environ.get('ADMIN_PASS') or sys.exit('缺 ADMIN_PASS 环境变量')

def call(method, path, data=None, token=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(data).encode() if data is not None else None)
    req.add_header('Content-Type', 'application/json')
    if token: req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or '{}')

def upload(token, filename, content, scene='common'):
    boundary = uuid.uuid4().hex
    body = b''
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="scene"\r\n\r\n{scene}\r\n'.encode()
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: image/svg+xml\r\n\r\n'.encode() + content + b'\r\n'
    body += f'--{boundary}--\r\n'.encode()
    req = urllib.request.Request(BASE + '/admin/upload', method='POST', data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            b = json.loads(r.read().decode() or '{}')
            d = b.get('data') or {}
            return d.get('url') or d.get('path') or d.get('file_url') or json.dumps(d)
    except urllib.error.HTTPError as e:
        print('upload fail', e.code, e.read().decode()[:200]); return ''

def svg(w, h, c1, c2, text, sub=''):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="url(#g)"/>
<circle cx="{int(w*0.82)}" cy="{int(h*0.3)}" r="{int(h*0.35)}" fill="#ffffff" fill-opacity="0.12"/>
<circle cx="{int(w*0.15)}" cy="{int(h*0.85)}" r="{int(h*0.25)}" fill="#ffffff" fill-opacity="0.10"/>
<text x="{int(w*0.06)}" y="{int(h*0.55)}" font-family="Roboto, PingFang SC, Microsoft YaHei, sans-serif" font-size="{int(h*0.16)}" font-weight="600" fill="#ffffff">{text}</text>
<text x="{int(w*0.06)}" y="{int(h*0.72)}" font-family="Roboto, PingFang SC, Microsoft YaHei, sans-serif" font-size="{int(h*0.08)}" fill="#ffffff" fill-opacity="0.85">{sub}</text>
</svg>'''.encode()

def icon_svg(c1, c2, letter):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<rect width="96" height="96" rx="24" fill="url(#g)"/>
<text x="48" y="60" text-anchor="middle" font-family="Roboto, sans-serif" font-size="40" font-weight="700" fill="#fff">{letter}</text></svg>'''.encode()

st, b = call('POST', '/admin/login', {'username': ADMIN_USER, 'password': ADMIN_PASS})
tok = b['data']['token']
print('login ok')

# 1. 合规声明（本地测试环境）
st, b = call('POST', '/admin/compliance/acknowledge', {
    'segment1': '我已阅读并理解上述合规声明提醒',
    'segment2': '知悉相关法律风险',
    'segment3': '并确认自行承担部署运营和收费行为产生的法律责任'}, tok)
print('compliance', st, b.get('msg'))

# 2. 上传图片
banner1 = upload(tok, 'banner-1.svg', svg(1600, 600, '#4f46e5', '#0ea5e9', '开学季 全场秒发', '游戏点卡 · 流媒体会员 · 软件授权'), 'banner')
banner2 = upload(tok, 'banner-2.svg', svg(1600, 600, '#db2777', '#f59e0b', 'Netflix 年卡 8 折', '限时活动，付款即到账'), 'banner')
icons = {}
for slug, c1, c2, L in [('game', '#4f46e5', '#818cf8', 'G'), ('stream', '#db2777', '#f472b6', 'S'), ('software', '#0f766e', '#2dd4bf', 'W'), ('ai', '#b45309', '#fbbf24', 'A'), ('gift', '#7c3aed', '#c4b5fd', 'C'), ('vpn', '#0369a1', '#7dd3fc', 'N')]:
    icons[slug] = upload(tok, f'icon-{slug}.svg', icon_svg(c1, c2, L), 'category')
covers = {}
palette = [('#4f46e5', '#818cf8'), ('#db2777', '#f472b6'), ('#0f766e', '#2dd4bf'), ('#b45309', '#fbbf24'), ('#7c3aed', '#c4b5fd'), ('#0369a1', '#7dd3fc'), ('#be123c', '#fb7185'), ('#4d7c0f', '#a3e635')]
for i, (c1, c2) in enumerate(palette):
    covers[i] = upload(tok, f'cover-{i}.svg', svg(800, 600, c1, c2, f'商品 {i+1}', '付款即到账'), 'product')
print('uploads', banner1, banner2, icons.get('game'), covers.get(0))

# 3. 站点设置
st, b = call('PUT', '/admin/settings', {'key': 'site_config', 'value': {
    'brand': {'site_name': '演示小店', 'site_logo': '', 'site_icon': '',
              'site_description': {'zh-CN': '正版数字商品自助商店，付款即到账', 'zh-TW': '正版數位商品自助商店', 'en-US': 'Digital goods, delivered on payment'}},
    'currency': 'CNY',
    'contact': {'telegram': 'https://t.me/example_store', 'whatsapp': ''},
    'footer_links': [{'name': '常见问题', 'url': '/about'}, {'name': '状态页', 'url': 'https://status.example.com'}],
    'storefront_template': 'md3', 'template_mode': 'card',
}}, tok)
print('site_config', st, b.get('msg'))
st, b = call('PUT', '/admin/settings', {'key': 'nav_config', 'value': {
    'builtin': {'blog': True, 'notice': True, 'about': True, 'personal_center': True},
    'custom_items': [{'id': 1, 'title': {'zh-CN': '充值教程', 'en-US': 'Guide', 'zh-TW': '儲值教學'}, 'link_type': 'internal', 'url': '/blog/how-to-redeem', 'target': '_self', 'sort_order': 1, 'enabled': True, 'icon': 'book'}],
}}, tok)
print('nav_config', st, b.get('msg'))
st, b = call('PUT', '/admin/settings', {'key': 'home_announcement', 'value': {
    'enabled': True, 'title': {'zh-CN': '欢迎光临', 'en-US': 'Welcome'}, 'content': {'zh-CN': '<p>新客下单立减，游客也可以直接购买。</p>', 'en-US': '<p>Guests can buy without an account.</p>'},
    'version': 'v-test-1'}}, tok)
print('announcement', st, b.get('msg'))

# 4. 分类：图标 + 子分类
st, b = call('GET', '/admin/categories', None, tok)
cats = {c['slug']: c for c in (b.get('data') or [])}
for slug, zh, en in [('gift', '礼品卡', 'Gift Cards'), ('vpn', '网络加速', 'Network')]:
    if slug not in cats:
        st, b = call('POST', '/admin/categories', {'slug': slug, 'name': {'zh-CN': zh, 'en-US': en, 'zh-TW': zh}, 'sort_order': 5, 'icon': icons.get(slug, '')}, tok)
        cats[slug] = b.get('data') or {}
for slug in ['game', 'stream', 'software', 'ai']:
    c = cats.get(slug)
    if c:
        call('PUT', f'/admin/categories/{c["id"]}', {'slug': slug, 'name': c['name'], 'sort_order': c.get('sort_order', 0), 'icon': icons.get(slug, ''), 'parent_id': 0}, tok)
for slug, zh, en, parent in [('steam', 'Steam', 'Steam', 'game'), ('psn', 'PlayStation', 'PlayStation', 'game'), ('video', '视频会员', 'Video', 'stream'), ('music', '音乐会员', 'Music', 'stream')]:
    if slug not in cats and cats.get(parent):
        st, b = call('POST', '/admin/categories', {'slug': slug, 'name': {'zh-CN': zh, 'en-US': en, 'zh-TW': zh}, 'sort_order': 1, 'parent_id': cats[parent]['id']}, tok)
        cats[slug] = b.get('data') or {}
        print('child cat', slug, st)

# 5. 商品
st, b = call('GET', '/admin/products?page=1&page_size=100', None, tok)
existing = {p['slug']: p for p in (b.get('data') or [])}
def mk(slug, zh, en, cat, price, ft='auto', pt='guest', tags=None, img=None, skus=None, wholesale=None, stock=None, cards=7, min_q=None, max_q=None):
    if slug in existing: return existing[slug]['id']
    body = {'category_id': cats[cat]['id'], 'slug': slug, 'title': {'zh-CN': zh, 'en-US': en, 'zh-TW': zh},
            'description': {'zh-CN': '正版渠道，付款后自动发货，凭证仅你可见。', 'en-US': 'Official channel, delivered automatically after payment.'},
            'content': {'zh-CN': '<h3>使用说明</h3><p>登录账号后在充值页面输入卡密即可。</p><ul><li>卡密一经发放不支持退换</li><li>如遇问题请通过页脚联系方式反馈</li></ul>'},
            'price_amount': price, 'images': [img] if img else [], 'tags': tags or [], 'purchase_type': pt, 'fulfillment_type': ft,
            'manual_stock_total': (stock if stock is not None else 20) if ft == 'manual' else None, 'is_active': True, 'sort_order': 0}
    if skus: body['skus'] = skus
    if wholesale: body['wholesale_prices'] = wholesale
    if min_q: body['min_purchase_quantity'] = min_q
    if max_q: body['max_purchase_quantity'] = max_q
    st, b = call('POST', '/admin/products', body, tok)
    pid = (b.get('data') or {}).get('id')
    print('prod', slug, st, pid, '' if st < 300 else str(b)[:160])
    if ft == 'auto' and pid and cards and not skus:
        st2, b2 = call('POST', '/admin/card-secrets/batch', {'product_id': pid, 'secrets': [f'{slug.upper()}-KEY-{i:03d}' for i in range(1, cards + 1)]}, tok)
        if st2 >= 300: print('  cards', st2, str(b2)[:100])
    if pid: existing[slug] = {'id': pid}
    return pid

# 已有 6 个；更新其中几个补图片
for slug, i in [('steam-50', 0), ('netflix-1m', 1), ('office-2024', 2), ('chatgpt-plus', 3), ('psn-100', 4), ('spotify-3m', 5)]:
    p = existing.get(slug)
    if p and not (p.get('images') or []):
        p2 = dict(p); p2['images'] = [covers[i]]
        for k in ['id', 'created_at', 'updated_at', 'category', 'skus', 'stock', 'card_secrets_count', 'sales_count', 'deleted_at']: p2.pop(k, None)
        st, b = call('PUT', f'/admin/products/{p["id"]}', p2, tok)
        print('img', slug, st, '' if st < 300 else str(b)[:160])

mk('netflix-family', 'Netflix 家庭组 4K 合租位', 'Netflix Family 4K Slot', 'video', 29.9, tags=['4K', '合租'], img=covers[1],
   skus=[{'sku_code': 'M1', 'spec_values': {'时长': '1 个月'}, 'price_amount': 29.9, 'manual_stock_total': 30, 'is_active': True, 'sort_order': 0},
         {'sku_code': 'M3', 'spec_values': {'时长': '3 个月'}, 'price_amount': 79, 'manual_stock_total': 30, 'is_active': True, 'sort_order': 1},
         {'sku_code': 'M12', 'spec_values': {'时长': '12 个月'}, 'price_amount': 288, 'manual_stock_total': 0, 'is_active': True, 'sort_order': 2}], ft='manual')
mk('steam-100', 'Steam 充值卡 100 元', 'Steam Gift Card ¥100', 'steam', 100, tags=['热销'], img=covers[6], wholesale=[{'min_quantity': 5, 'unit_price': 97}, {'min_quantity': 10, 'unit_price': 95}], cards=30)
mk('steam-200', 'Steam 充值卡 200 元', 'Steam Gift Card ¥200', 'steam', 200, img=covers[7], cards=2)
mk('psn-250', 'PSN 点卡 250 元（港服）', 'PSN Card HK$250', 'psn', 230, tags=['港服'], img=covers[4], cards=12)
mk('psn-500', 'PSN 点卡 500 元（港服）', 'PSN Card HK$500', 'psn', 455, img=covers[0], cards=0)  # 售罄
mk('youtube-premium', 'YouTube Premium 12 个月', 'YouTube Premium 12 Months', 'video', 168, tags=['促销'], img=covers[2], ft='manual', stock=15)
mk('disney-plus', 'Disney+ 年卡', 'Disney+ Annual', 'video', 199, img=covers[3], ft='manual', stock=8)
mk('apple-music', 'Apple Music 3 个月', 'Apple Music 3 Months', 'music', 45, img=covers[5], cards=10)
mk('spotify-12m', 'Spotify 12 个月家庭版', 'Spotify Family 12 Months', 'music', 189, img=covers[6], cards=10)
mk('win11-pro', 'Windows 11 专业版 密钥', 'Windows 11 Pro Key', 'software', 29, tags=['秒发'], img=covers[7], cards=40, max_q=5)
mk('idm-license', 'IDM 终身授权', 'IDM Lifetime', 'software', 59, img=covers[0], cards=10)
mk('jetbrains-all', 'JetBrains 全家桶 1 年', 'JetBrains All Products 1Y', 'software', 699, img=covers[1], ft='manual', stock=5)
mk('claude-pro', 'Claude Pro 代充 1 个月', 'Claude Pro 1 Month', 'ai', 159, tags=['代充'], img=covers[2], ft='manual', stock=10)
mk('midjourney', 'Midjourney 基础版 1 个月', 'Midjourney Basic 1 Month', 'ai', 89, img=covers[3], ft='manual', stock=10)
mk('openai-api', 'OpenAI API 额度 $10', 'OpenAI API Credit $10', 'ai', 85, img=covers[4], cards=10, min_q=2)
mk('amazon-gift-50', 'Amazon 礼品卡 $50', 'Amazon Gift Card $50', 'gift', 365, img=covers[5], cards=10)
mk('apple-gift-100', 'Apple 礼品卡 100 元', 'Apple Gift Card ¥100', 'gift', 100, tags=['热销'], img=covers[6], cards=20)
mk('google-play-50', 'Google Play 礼品卡 $50', 'Google Play $50', 'gift', 360, img=covers[7], cards=10)
mk('nord-1y', 'NordVPN 1 年', 'NordVPN 1 Year', 'vpn', 199, img=covers[0], ft='manual', stock=10)
mk('surfshark-2y', 'Surfshark 2 年', 'Surfshark 2 Years', 'vpn', 239, img=covers[1], ft='manual', stock=10)
mk('express-1m', 'ExpressVPN 1 个月', 'ExpressVPN 1 Month', 'vpn', 79, img=covers[2], ft='manual', stock=10)
mk('xbox-gamepass', 'Xbox Game Pass Ultimate 3 个月', 'Xbox Game Pass Ultimate 3M', 'game', 129, img=covers[3], cards=10)
mk('nintendo-eshop', 'Nintendo eShop 预付卡 $50', 'Nintendo eShop $50', 'game', 360, img=covers[4], cards=10)
print('products total', len(existing))

# 6. 文章与公告
for slug, typ, zh, en, summ, pids in [
    ('maintenance-0910', 'notice', '9 月 10 日凌晨系统维护通知', 'Maintenance on Sep 10', '凌晨 2:00-4:00 暂停下单，已付订单不受影响。', None),
    ('new-payment', 'notice', '新增支付宝当面付通道', 'Alipay F2F channel added', '现已支持支付宝扫码付款，秒到账。', None),
    ('how-to-redeem', 'blog', 'Steam 充值卡使用教程', 'How to redeem a Steam gift card', '三步完成充值：登录、输入卡密、确认区域。', ['steam-50', 'steam-100']),
    ('netflix-faq', 'blog', 'Netflix 合租常见问题', 'Netflix sharing FAQ', '关于同时在线、换设备、续费的说明。', ['netflix-1m']),
]:
    body = {'slug': slug, 'type': typ, 'title': {'zh-CN': zh, 'en-US': en, 'zh-TW': zh}, 'summary': {'zh-CN': summ, 'en-US': summ},
            'content': {'zh-CN': f'<p>{summ}</p><p>如有疑问请通过页脚联系方式反馈。</p>', 'en-US': f'<p>{summ}</p>'}, 'is_published': True}
    if pids: body['product_ids'] = [existing[p]['id'] for p in pids if p in existing]
    st, b = call('POST', '/admin/posts', body, tok)
    print('post', slug, st, '' if st < 300 else str(b)[:160])

# 7. 横幅
for name, img, title, sub, link in [('开学季', banner1, '开学季 全场秒发', '游戏点卡、流媒体会员、软件授权，付款即到账', '/products'),
                                    ('Netflix', banner2, 'Netflix 年卡 8 折', '限时活动，先到先得', '/categories/stream')]:
    st, b = call('POST', '/admin/banners', {'name': name, 'position': 'home_hero', 'title': {'zh-CN': title, 'en-US': title}, 'subtitle': {'zh-CN': sub, 'en-US': sub},
                                            'image': img, 'link_type': 'internal', 'link_value': link, 'is_active': True, 'sort_order': 0}, tok)
    print('banner', name, st, '' if st < 300 else str(b)[:200])

# 8. 支付渠道（易支付 v1 指向本地假网关，只为走通「结算 → 支付页」；notify/return 是校验必填）
st, b = call('GET', '/admin/payment-channels', None, tok)
if not (b.get('data') or []):
    site = BASE.replace('/api/v1', '')
    cfg = {'gateway_url': site + '/__fake_gateway/', 'epay_version': 'v1', 'merchant_id': '1000', 'merchant_key': 'testkey', 'sign_type': 'MD5',
           'notify_url': BASE + '/payment/notify/epay', 'return_url': site + '/pay'}
    for name, ct, mode, so in [('支付宝', 'alipay', 'redirect', 0), ('微信支付', 'wxpay', 'qr', 1)]:
        st, b = call('POST', '/admin/payment-channels', {'name': name, 'provider_type': 'epay', 'channel_type': ct, 'interaction_mode': mode,
                                                         'payment_roles': ['guest', 'member'], 'payment_types': ['order', 'wallet'], 'is_active': True,
                                                         'sort_order': so, 'config_json': cfg}, tok)
        print('channel', name, st, '' if st < 300 and not b.get('status_code') else str(b)[:160])
print('done')
