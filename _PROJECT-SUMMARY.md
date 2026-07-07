# The Trading Paper — პროექტის შეჯამება

**ასლის თარიღი:** 2026-06-13
**წყარო:** https://thetradingpaper.github.io (GitHub Pages, branch `main`)
**მფლობელი:** ლაშა ფხაკაძე (Wiesbaden)
**ენა:** მთლიანი საიტი ქართულად. სტილი — გაზეთის ესთეტიკა (serif, ხაზები, „გამოცემა №NN").
**ფუტერი ყველა გვერდზე:** „ეს არ არის ფინანსური რჩევა".

> ეს ფაილი არის უსაფრთხო backup — საიტის მთლიანი შინაარსი (63 ფაილი) დაკოპირებულია,
> რომ ვერაფერი დაიკარგოს, სანამ გადავწყვეტთ რა წაიშლება და რა დაემატება.

---

## 1. რა არის ეს პროექტი

პერსონალური საფინანსო/სავაჭრო საიტი-„გაზეთი". აერთიანებს ლაშას რეალურ
პორტფელებს, ბაზრის მიმოხილვას, სტატიებს, ცნობილი ინვესტორების პორტფელებს და
ავტომატურ სავაჭრო ბოტს. ყველაფერი სტატიკურია (HTML/CSS/JS) — build პროცესის გარეშე,
პირდაპირ GitHub Pages-ზე იდება.

## 2. სამი „წიგნი" (პორტფელი)

| გასაღები | ბროკერი | სტილი | წესი |
|---|---|---|---|
| `bog` | Bank of Georgia | გრძელვადიანი DCA, ETF-ები, არასდროს ყიდვა | $100–200/თვე, მიზანი 35%/წელი |
| `tbc` | TBC Capital | აქტიური, თითო პოზიცია ერთ დროს | წერილობითი თეზისი შესვლამდე; მოგება BOG-ში გადადის |
| `galt` | Galt & Taggart | 2.5× margin გარიგებები (MSTR) | ცალკე კაპიტალი, არასდროს ივსება სხვა წიგნებიდან |

**ერთადერთი წყარო (single source of truth):** `js/portfolios.js` — ყველა ბალანსი,
ჰოლდინგი, ტრანზაქცია და GALT order აქ ცხოვრობს. გვერდები აქედან რენდერდება.
ბოლო სინქი: გამოცემა 09 · 2026-06-12 (BOG-ში 11 სახელი, დაემატა SPCX).

## 3. გვერდები (17 HTML)

- **index.html** — ბაზრის მთავარი გვერდი (TradingView ვიჯეტები)
- **portfolio.html** — ჩემი პორტფელი + „The Mountain" გრაფიკები + PDF არქივი
- **margin.html** — GALT margin პოზიციის სტატუსი
- **strategy.html** — სტრატეგია + GALT ბანერი
- **articles.html / articles/** — სტატიები (3 დაწერილი + `_template.html`)
- **legends.html** — მსოფლიო ცნობილი ინვესტორების პორტფელები
- **research.html** — კვლევა
- **signals.html** — ბოტის სიგნალების დაფა („მეოთხე წიგნი")
- **community.html / register.html / trader.html / my-portfolio.html / my-articles.html / history*.html / startup.html** — ნაწილი legacy/demo (ფეიკ მონაცემები; `history.html` ახლა portfolio.html-ზე გადაამისამართებს)

## 4. PDF გამოცემები (11 ფაილი, `pdfs/`)

- `thetradingpaper1.pdf` … `thetradingpaper9.pdf` — გაზეთის ცხრა გამოცემა
- `research-01-build-out-map.pdf` — კვლევა
- `bot-devlog-01.pdf` — ბოტის დეველოპმენტის ჟურნალი

## 5. ბოტი · Signal Desk (`signals.html`)

მექანიკური swing-signal ბოტი — **მხოლოდ paper trading**, რეალურ ფულს არ ეხება.
- ძრავა: `scripts/signals.js`, ეშვება `.github/workflows/signals.yml`-ით ყოველ 30 წუთში US ბაზრის საათებში.
- Watchlist: 5 აქცია (NVDA, TSLA, MSTR, PLTR, BABA). წესები: R1 oversold bounce / R2 breakout / R3 trend pullback. ATR-based target/stop, მაქს. 5 დღე.
- მდგომარეობა: `data/signals.json`, `data/bot-state.json` ($100 paper), `data/signals-log.json` (საჯარო win rate).
- `bot/research_bot.py`, `bot/bot_lab.py` — კვლევითი/სატესტო ბოტები.

## 6. ავტომატიზაცია (GitHub Actions, `.github/workflows/`)

- **snapshot.yml** → `scripts/snapshot.js` — საათში ერთხელ, სამუშაო დღეებში: Yahoo-დან ფასები → `data/prices.json` + `data/history.json` (ამით იხატება „The Mountain" გრაფიკები).
- **signals.yml** → ბოტის სიგნალები ყოველ 30 წუთში.
- **research-bot.yml** → კვლევითი ბოტი.

⚠️ **ნუ შეასწორებ ხელით** `prices.json`-ს და ბოტის data ფაილებს — ისინი ავტომატურად იწერება.
ნებისმიერი `portfolios.js`-ის შესწორების შემდეგ ჯერ `git pull --rebase`, მერე push (ბოტი საათში ერთხელ commit-ს აკეთებს `main`-ში და კონფლიქტი მოგივა).

## 7. მნიშვნელოვანი დეტალები (Gotchas)

- `js/gate.js` — რბილი პაროლის გეითი (პაროლი `111`, localStorage `ttp_unlock_v1`).
- BOG დივიდენდები: საიტი 30% ქართულ გადასახადს ითვლის (× 0.70).
- TradingView ვიჯეტები — embedded `<script>` JSON ბლოკები, მყიფეა, არ გადააფორმატო.
- Yahoo ticker-ები ზუსტად უნდა ემთხვეოდეს (მაგ. `WQTM`, `KOID`).
- legacy/demo გვერდები (`my-*.html`, `trader.html`, `community.html`, `register.html`) — ფეიკ მონაცემები, არ გააფართოვო.

## 8. დეპლოი

`git add -A && git commit && git pull --rebase && git push` → Pages თავად განახლდება (1–2 წთ).
Windows-ზე არის `deploy.bat` / `deploy_now.bat` / `deploy_push.bat` სკრიპტებიც.

---

## 9. შემდეგი ნაბიჯი (ჩვენი გეგმა)

ეს არის სუფთა backup. შენ თქვი: ჯერ არ გვინდა არსებული ჩარჩოს გაცდენა (მეგობრის
პრომპტში ნახსენები Next.js/Supabase სრული გადაწერა **ჯერ არ ვაკეთებთ**).
ცალკეა საჭირო შენი მითითება — **რა წაიშალოს, რა დაემატოს, როგორი უნდა იყოს საიტი
„ინდივიდზე მორგებული"**. ამის მიხედვით გავაკეთებთ მონახაზს.
