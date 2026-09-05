/**
 * 服务条款 / 隐私政策的默认文案。
 * 后台「站点设置 → 法律条款」留空时前台显示这里的内容；填了就以后台为准。
 * 文案里的 {site} 会被替换为站点名称。
 */
export type LegalType = 'terms' | 'privacy'

type LegalLocale = 'zh-CN' | 'zh-TW' | 'en-US'

const terms: Record<LegalLocale, string> = {
  'zh-CN': `
<p>欢迎使用 {site}（下称「本站」）。下单或使用本站服务即表示你已阅读并同意本条款。</p>
<h2>一、服务内容</h2>
<p>本站销售的是虚拟数字商品，包括但不限于卡密、兑换码、账号授权、充值服务等。商品以页面描述为准，付款成功后由系统自动或人工交付。</p>
<h2>二、账户与游客下单</h2>
<ul>
<li>你可以注册账户，也可以以游客身份下单。游客下单需填写有效邮箱，交付内容与订单信息将发送到该邮箱，并可凭邮箱和订单号在本站查询。</li>
<li>请妥善保管账户密码与订单凭证，因你自身原因导致的泄露本站不承担责任。</li>
</ul>
<h2>三、价格与支付</h2>
<ul>
<li>商品价格以下单时页面显示为准。支付通过第三方支付渠道完成，本站不接触也不存储你的银行卡或支付账户信息。</li>
<li>订单在规定时间内未付款将自动取消，占用的库存自动释放。</li>
</ul>
<h2>四、交付</h2>
<ul>
<li>自动交付商品在支付成功后即时送达订单页与邮箱。</li>
<li>人工交付商品由本站在承诺时间内处理，请留意订单状态与邮件通知。</li>
<li>交付内容仅对下单人可见，请勿转发或公开。</li>
</ul>
<h2>五、退款与售后</h2>
<ul>
<li>虚拟商品一经交付不支持无理由退款。</li>
<li>若交付内容无法使用、与描述不符或未收到货，请在下单后 7 天内携订单号联系我们，核实后予以补发或退款。</li>
<li>已使用、已绑定或因你自身操作导致失效的商品，不在售后范围内。</li>
</ul>
<h2>六、禁止行为</h2>
<p>不得使用非法资金支付、恶意拒付或退单、利用系统漏洞下单、批量占用库存，或将商品用于任何违法用途。发现上述行为，本站有权取消订单、冻结账户并保留追责权利。</p>
<h2>七、免责声明</h2>
<p>因第三方平台（支付渠道、商品所属平台等）政策变更、服务中断或不可抗力导致的损失，本站在合理范围内协助处理，但不承担超出订单金额的赔偿责任。</p>
<h2>八、条款变更</h2>
<p>本站可能不时更新本条款，更新后在本页公布即生效。继续使用本站服务视为接受更新后的条款。</p>
<h2>九、联系我们</h2>
<p>对本条款或订单有任何疑问，请通过本站页脚提供的联系方式与我们联系。</p>
`,
  'zh-TW': `
<p>歡迎使用 {site}（下稱「本站」）。下單或使用本站服務即表示你已閱讀並同意本條款。</p>
<h2>一、服務內容</h2>
<p>本站銷售的是虛擬數位商品，包括但不限於卡密、兌換碼、帳號授權、儲值服務等。商品以頁面描述為準，付款成功後由系統自動或人工交付。</p>
<h2>二、帳戶與訪客下單</h2>
<ul>
<li>你可以註冊帳戶，也可以以訪客身分下單。訪客下單需填寫有效信箱，交付內容與訂單資訊將寄送到該信箱，並可憑信箱和訂單號在本站查詢。</li>
<li>請妥善保管帳戶密碼與訂單憑證，因你自身原因導致的外洩本站不承擔責任。</li>
</ul>
<h2>三、價格與付款</h2>
<ul>
<li>商品價格以下單時頁面顯示為準。付款透過第三方支付渠道完成，本站不接觸也不儲存你的銀行卡或支付帳戶資訊。</li>
<li>訂單在規定時間內未付款將自動取消，占用的庫存自動釋放。</li>
</ul>
<h2>四、交付</h2>
<ul>
<li>自動交付商品在付款成功後即時送達訂單頁與信箱。</li>
<li>人工交付商品由本站在承諾時間內處理，請留意訂單狀態與郵件通知。</li>
<li>交付內容僅對下單人可見，請勿轉發或公開。</li>
</ul>
<h2>五、退款與售後</h2>
<ul>
<li>虛擬商品一經交付不支援無理由退款。</li>
<li>若交付內容無法使用、與描述不符或未收到貨，請在下單後 7 天內攜訂單號聯絡我們，核實後予以補發或退款。</li>
<li>已使用、已綁定或因你自身操作導致失效的商品，不在售後範圍內。</li>
</ul>
<h2>六、禁止行為</h2>
<p>不得使用非法資金付款、惡意拒付或退單、利用系統漏洞下單、批量占用庫存，或將商品用於任何違法用途。發現上述行為，本站有權取消訂單、凍結帳戶並保留追責權利。</p>
<h2>七、免責聲明</h2>
<p>因第三方平台（支付渠道、商品所屬平台等）政策變更、服務中斷或不可抗力導致的損失，本站在合理範圍內協助處理，但不承擔超出訂單金額的賠償責任。</p>
<h2>八、條款變更</h2>
<p>本站可能不時更新本條款，更新後在本頁公布即生效。繼續使用本站服務視為接受更新後的條款。</p>
<h2>九、聯絡我們</h2>
<p>對本條款或訂單有任何疑問，請透過本站頁尾提供的聯絡方式與我們聯絡。</p>
`,
  'en-US': `
<p>Welcome to {site} (the "Site"). By placing an order or using the Site you confirm that you have read and agree to these terms.</p>
<h2>1. What we sell</h2>
<p>The Site sells virtual digital goods, including but not limited to card keys, redemption codes, account licenses and top-up services. Product pages describe what you get; after successful payment the goods are delivered automatically by the system or manually by us.</p>
<h2>2. Accounts and guest checkout</h2>
<ul>
<li>You may register an account or check out as a guest. Guest orders require a valid email address: delivery content and order details are sent there, and you can look the order up on the Site with that email and the order number.</li>
<li>Keep your password and order credentials safe. We are not responsible for leaks caused on your side.</li>
</ul>
<h2>3. Prices and payment</h2>
<ul>
<li>The price shown at checkout is the price you pay. Payments are processed by third-party payment providers; the Site never sees or stores your card or payment account details.</li>
<li>Unpaid orders are cancelled automatically after the payment window closes and reserved stock is released.</li>
</ul>
<h2>4. Delivery</h2>
<ul>
<li>Auto-delivered goods are sent to the order page and your email immediately after payment.</li>
<li>Manually delivered goods are handled within the promised time; watch the order status and your inbox.</li>
<li>Delivery content is visible only to the buyer. Do not share or publish it.</li>
</ul>
<h2>5. Refunds and after-sales</h2>
<ul>
<li>Delivered virtual goods cannot be returned for a change of mind.</li>
<li>If the delivered content does not work, does not match the description, or never arrived, contact us within 7 days of ordering with your order number. After verification we will resend or refund.</li>
<li>Goods that have been used, bound to an account, or invalidated by your own actions are not covered.</li>
</ul>
<h2>6. Prohibited conduct</h2>
<p>Do not pay with illegally obtained funds, file abusive chargebacks, exploit bugs to place orders, hoard stock in bulk, or use the goods for any unlawful purpose. We may cancel orders, freeze accounts and pursue further action where such conduct is found.</p>
<h2>7. Disclaimer</h2>
<p>For losses caused by third-party platforms (payment providers, the platform a product belongs to, etc.), policy changes, outages or force majeure, we will assist within reason but our liability is limited to the order amount.</p>
<h2>8. Changes to these terms</h2>
<p>We may update these terms from time to time. Updates take effect when published on this page; continued use of the Site means you accept them.</p>
<h2>9. Contact</h2>
<p>Questions about these terms or an order? Reach us through the contact options in the Site footer.</p>
`,
}

const privacy: Record<LegalLocale, string> = {
  'zh-CN': `
<p>{site}（下称「本站」）重视你的隐私。本政策说明我们收集哪些信息、如何使用，以及你拥有的权利。</p>
<h2>一、我们收集的信息</h2>
<ul>
<li><strong>账户信息</strong>：注册时提供的邮箱和密码，密码以加密形式存储。</li>
<li><strong>订单信息</strong>：购买的商品、金额、下单时间，以及游客下单时填写的邮箱。</li>
<li><strong>支付信息</strong>：支付由第三方支付渠道完成，本站只保存渠道返回的订单号与支付状态，不保存银行卡或支付账户信息。</li>
<li><strong>设备与访问信息</strong>：IP 地址、浏览器类型等，用于安全防护与故障排查。</li>
</ul>
<h2>二、信息的用途</h2>
<ul>
<li>完成订单、交付商品、发送订单与交付通知。</li>
<li>处理售后与退款请求。</li>
<li>防范欺诈、恶意下单与滥用行为。</li>
<li>改进本站的功能与体验。</li>
</ul>
<h2>三、Cookie 与本地存储</h2>
<p>本站使用 Cookie 与浏览器本地存储来保持登录状态、记住语言与主题偏好、保存购物车内容。这些数据不用于跨站追踪。你可以在浏览器中清除它们，但部分功能可能因此不可用。</p>
<h2>四、信息共享</h2>
<p>除以下情况外，我们不会向第三方出售或提供你的个人信息：</p>
<ul>
<li>为完成支付，向你选择的支付渠道传递必要的订单信息。</li>
<li>为发送通知，通过邮件服务商向你的邮箱发送邮件。</li>
<li>法律法规要求，或有权机关依法要求。</li>
</ul>
<h2>五、信息保存</h2>
<p>订单与交付记录在履行售后与财务义务所需的期限内保存。账户信息在账户存续期间保存，注销后依法删除或匿名化。</p>
<h2>六、你的权利</h2>
<p>你可以随时登录账户查看和修改个人资料。如需删除账户或导出你的数据，请通过页脚的联系方式与我们联系，我们会在核实身份后处理。</p>
<h2>七、信息安全</h2>
<p>本站通过 HTTPS 传输数据，密码与敏感配置加密存储，交付内容仅对下单人可见。互联网环境无法保证绝对安全，请妥善保管你的账户与订单凭证。</p>
<h2>八、政策更新</h2>
<p>本政策可能不时更新，更新后在本页公布即生效。</p>
<h2>九、联系我们</h2>
<p>对本政策有任何疑问，请通过本站页脚提供的联系方式与我们联系。</p>
`,
  'zh-TW': `
<p>{site}（下稱「本站」）重視你的隱私。本政策說明我們蒐集哪些資訊、如何使用，以及你擁有的權利。</p>
<h2>一、我們蒐集的資訊</h2>
<ul>
<li><strong>帳戶資訊</strong>：註冊時提供的信箱和密碼，密碼以加密形式儲存。</li>
<li><strong>訂單資訊</strong>：購買的商品、金額、下單時間，以及訪客下單時填寫的信箱。</li>
<li><strong>付款資訊</strong>：付款由第三方支付渠道完成，本站只保存渠道回傳的訂單號與付款狀態，不保存銀行卡或支付帳戶資訊。</li>
<li><strong>裝置與存取資訊</strong>：IP 位址、瀏覽器類型等，用於安全防護與故障排查。</li>
</ul>
<h2>二、資訊的用途</h2>
<ul>
<li>完成訂單、交付商品、寄送訂單與交付通知。</li>
<li>處理售後與退款請求。</li>
<li>防範詐欺、惡意下單與濫用行為。</li>
<li>改進本站的功能與體驗。</li>
</ul>
<h2>三、Cookie 與本機儲存</h2>
<p>本站使用 Cookie 與瀏覽器本機儲存來保持登入狀態、記住語言與主題偏好、保存購物車內容。這些資料不用於跨站追蹤。你可以在瀏覽器中清除它們，但部分功能可能因此無法使用。</p>
<h2>四、資訊分享</h2>
<p>除以下情況外，我們不會向第三方出售或提供你的個人資訊：</p>
<ul>
<li>為完成付款，向你選擇的支付渠道傳遞必要的訂單資訊。</li>
<li>為寄送通知，透過郵件服務商向你的信箱寄送郵件。</li>
<li>法律法規要求，或有權機關依法要求。</li>
</ul>
<h2>五、資訊保存</h2>
<p>訂單與交付紀錄在履行售後與財務義務所需的期限內保存。帳戶資訊在帳戶存續期間保存，註銷後依法刪除或匿名化。</p>
<h2>六、你的權利</h2>
<p>你可以隨時登入帳戶查看和修改個人資料。如需刪除帳戶或匯出你的資料，請透過頁尾的聯絡方式與我們聯絡，我們會在核實身分後處理。</p>
<h2>七、資訊安全</h2>
<p>本站透過 HTTPS 傳輸資料，密碼與敏感設定加密儲存，交付內容僅對下單人可見。網際網路環境無法保證絕對安全，請妥善保管你的帳戶與訂單憑證。</p>
<h2>八、政策更新</h2>
<p>本政策可能不時更新，更新後在本頁公布即生效。</p>
<h2>九、聯絡我們</h2>
<p>對本政策有任何疑問，請透過本站頁尾提供的聯絡方式與我們聯絡。</p>
`,
  'en-US': `
<p>{site} (the "Site") takes your privacy seriously. This policy explains what we collect, how we use it, and the rights you have.</p>
<h2>1. What we collect</h2>
<ul>
<li><strong>Account details</strong>: the email address and password you register with. Passwords are stored in hashed form.</li>
<li><strong>Order details</strong>: the items you buy, amounts, order time, and the email address entered for guest orders.</li>
<li><strong>Payment details</strong>: payments are processed by third-party payment providers. The Site only stores the provider's order reference and payment status, never card or payment account details.</li>
<li><strong>Device and access data</strong>: IP address, browser type and similar data used for security and troubleshooting.</li>
</ul>
<h2>2. How we use it</h2>
<ul>
<li>To process orders, deliver goods and send order and delivery notifications.</li>
<li>To handle after-sales and refund requests.</li>
<li>To prevent fraud, abusive ordering and misuse.</li>
<li>To improve the Site's features and experience.</li>
</ul>
<h2>3. Cookies and local storage</h2>
<p>The Site uses cookies and browser local storage to keep you signed in, remember your language and theme, and keep your cart. This data is not used for cross-site tracking. You can clear it in your browser, though some features may stop working.</p>
<h2>4. Sharing</h2>
<p>We do not sell or hand your personal data to third parties, except:</p>
<ul>
<li>passing the order details a payment provider needs to complete your payment;</li>
<li>sending emails to you through our email service provider;</li>
<li>where required by law or a lawful request from an authority.</li>
</ul>
<h2>5. Retention</h2>
<p>Order and delivery records are kept for as long as needed to meet after-sales and accounting obligations. Account data is kept while the account exists and deleted or anonymised after closure as the law allows.</p>
<h2>6. Your rights</h2>
<p>You can view and edit your profile at any time by signing in. To delete your account or export your data, contact us through the footer; we will act after verifying your identity.</p>
<h2>7. Security</h2>
<p>Data is transmitted over HTTPS, passwords and sensitive settings are stored encrypted, and delivery content is visible only to the buyer. No online service is perfectly secure, so please keep your account and order credentials safe.</p>
<h2>8. Changes</h2>
<p>This policy may be updated from time to time. Updates take effect when published on this page.</p>
<h2>9. Contact</h2>
<p>Questions about this policy? Reach us through the contact options in the Site footer.</p>
`,
}

function pickLocale(locale: string): LegalLocale {
  if (locale === 'zh-TW' || locale === 'en-US') return locale
  return 'zh-CN'
}

/** 返回指定类型与语言的默认文案，站点名已替换。 */
export function getLegalDefault(type: LegalType, locale: string, siteName: string): string {
  const source = type === 'terms' ? terms : privacy
  const html = source[pickLocale(locale)] || source['zh-CN']
  return html.trim().split('{site}').join(siteName)
}
