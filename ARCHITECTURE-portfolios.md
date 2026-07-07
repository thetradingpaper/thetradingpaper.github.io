# THE TRADING PAPER — `js/portfolios.js` რუკა

> სად რა ხდება და როგორ დგას საიტი ფეხზე ახლა.
> ეს ფაილი **მხოლოდ აღწერაა** — კოდს არ ცვლის. წყარო: `js/portfolios.js` (611 ხაზი).

---

## 0. ერთწინადადებიანი არსი

ერთი დიდი ობიექტი `portfolios` ინახავს **სამ წიგნს** (BOG, TBC, GALT). თითო წიგნს აქვს `holdings` (პოზიციები) და `transactions` (ისტორია). `aggregate(p)` ამ მონაცემებიდან ითვლის ყველა ციფრს, `render*()` ფუნქციები ხატავენ DOM-ში, `fetchLiveQuote()` კი ცოცხალ ფასებს ამატებს ყოველ 30 წამში.

---

## 1. ⚠️ მნიშვნელოვანი დაზუსტება „ჭეშმარიტების წყაროზე"

რეალურად კოდი **ჰიბრიდია**, არა სუფთა „ტრანზაქცია = ერთადერთი წყარო":

| ციფრი | საიდან მოდის |
|---|---|
| `deposits`, `bought`, `sold`, `fees` | **`transactions` მასივიდან** (+ `priorDeposits` / `priorCostBasis`) |
| `currentValue` | **`holdings` მასივიდან** (`h.value` ჯამი + `cash`), არა ტრანზაქციებიდან |

ანუ `holdings` ცალკე, აშკარად ჩაწერილი მასივია (cached მნიშვნელობებით), რომელსაც ცოცხალი ფასი ყოველ რეფრეშზე გადახატავს (`h.value = shares × livePrice`). **ეს არის მთავარი, რაც ჩემმა პირველმა გამოცნობამ ვერ დაიჭირა.**

---

## 2. მონაცემთა სტრუქტურა — `portfolios` (ხ. 14–151)

სამი წიგნი, თითო თავისი წესით:

- **`bog`** — Bank of Georgia · გრძელვადიანი DCA · $100–200/თვე · მიზანი 35%/წ. აქვს `divYield` ველი თითო holding-ზე (დივიდენდის დათვლისთვის).
- **`tbc`** — აქტიური ვაჭრობა · ერთი კომპანია (MSTR) · მიზანი 150%/წ.
- **`galt`** — Galt & Taggart · CFD 2.5× margin · `cash` **უარყოფითია** (−375.41, ნასესხები ფული), აქვს დამატებითი `order` და `plan` ობიექტები.

**წიგნის ველები:** `name`, `fullName`, `tagline`, `startDate`, `annualGoalPct`, `holdings[]`, `cash`, `priorDeposits`, `priorCostBasis`, `transactions[]`.

**`holdings[]` ერთეული:** `ticker`, `name`, `shares`, `avgBuy`, `invested`, `value`, `color`, (BOG-ში) `divYield`.
ცოცხალი რეფრეში ამ ერთეულს ამატებს: `livePrice`, `liveSession`, `liveState`, `previousClose`, `dayChangePct`.

**`transactions[]` ერთეული** (უახლესი ზემოთ): `date`, `type` ∈ {`deposit`,`buy`,`sell`,`fee`}, + ტიპის მიხედვით `ticker`/`shares`/`price`/`commission` ან `amount`.

---

## 3. დამხმარეები — helpers (ხ. 157–173)

- `fmtMoney(n)` → `$1,234.56` / უარყოფითზე `−$...`
- `fmtPct(n)` → `+12.34%`
- `fmtDate(s)` → `18 Jun 2026`
- `txPaid(tx)` = `shares×price + commission` (ყიდვაზე გადახდილი)
- `txReceived(tx)` = `shares×price − commission` (გაყიდვაზე მიღებული)

---

## 4. გული — `aggregate(p)` (ხ. 175–191)

იღებს ერთ წიგნს, აბრუნებს ერთ ობიექტს. ⟦ ერთადერთი ადგილი, სადაც ციფრები ცხოვრობს ⟧

```
deposits     = priorDeposits + Σ deposit.amount
bought       = priorCostBasis + Σ (buy.shares × buy.price)
sold         = Σ (sell.shares × sell.price)
fees         = Σ commission (buy/sell) + Σ fee.amount
currentValue = Σ holdings.value + cash        ← holdings-დან, არა ტრანზაქციებიდან
netInvested  = deposits
pnl          = currentValue − deposits
pnlPct       = deposits > 0 ? pnl/deposits×100 : 0
hasHistory   = ტრანზაქცია არსებობს თუ priorDeposits > 0
```

დაბრუნება: `{ deposits, bought, sold, fees, currentValue, netInvested, pnl, pnlPct, hasHistory }`

---

## 5. მხატვრები — `render*()` (ხ. 197–429, 553–611)

ყველა იღებს `containerId`-ს და `portfolioKey`-ს, ლოგიკას არ ითვლის — მხოლოდ ხატავს. სტილი: ძველი გაზეთი (Noto Serif Georgian, წითელი `#b91c1c`, კრემისფერი).

| ფუნქცია | რას ხატავს |
|---|---|
| `renderTx(tx)` | ერთი ტრანზაქციის სტრიქონი (badge-ით: DEPOSIT/BUY/SELL/FEE) |
| `renderStatBanner` | ზედა ბანერი: ჩარიცხული · ღირებულება · P/L · უკუგება · **დივიდენდი** (წმინდა, GE 30% გადასახადის შემდეგ) |
| `renderDonut` | Chart.js დონატი — პოზიციების წილი (+ CASH თუ > 0) |
| `renderPaginated` | ტრანზაქციების ჟურნალი გვერდებად (4/გვ.) |
| `renderHoldingsCards` | გაზეთის ბარათები — თითო აქცია (SHARES/AVG/PRICE/VALUE/UNREALISED/DAY) |
| `renderHoldings` | იგივე, ცხრილის ფორმით |
| `renderAllTx` | ყველა ტრანზაქცია ერთ სიად |
| `renderSummary` | ჯამური ბარათები (deposit/fees/bought/sold/net/value) |
| `renderChart` | Chart.js bar — Deposit/ნაყიდი/გაყიდული/საკომისიო/მიმდინარე |

> შენიშვნა: `renderMountain`, `renderHoldingsSummary`, `renderAllocLegend` **არ არის** ამ ფაილში — ისინი `portfolio.html`-ის `<script>`-შია.

---

## 6. ცოცხალი ფასები (ხ. 431–530)

- **`PRICE_PROXIES`** — 3 ცდა: პირდაპირ → `corsproxy.io` → `allorigins.win` (CORS-ის გვერდის ასავლელად).
- **`fetchLiveQuote(ticker)`** — Yahoo v8 chart API. ცნობს სესიას (PRE/REG/POST), აბრუნებს `{ price, session, state, regular, pre, post, previousClose }`.
- **`fetchLivePrice(ticker)`** — მხოლოდ ფასი.
- **`loadCachedPrices()`** — fallback: `data/prices.json` (GitHub Action-ით განახლებული, `cached.quotes[ticker]`).
- **`loadHistory()`** — `data/history.json` (mountain chart-ისთვის).
- **`refreshLivePrices(key)`** — ცდის ცოცხალს, ვერ მოსულზე cache-ს ჩაანაცვლებს, **ცვლის `holdings`-ს** (`livePrice`, `value`, `dayChangePct`…).
- **`refreshAndRender(key, opts)`** — ცოცხალი refresh + დათითოებული render (banner/cards/donut/stamp).

---

## 7. შეკვრა — სად ერთიანდება (`portfolio.html`)

`portfolios.js`-ში **არ არის `init()`** — გვერდი თვითონ აერთებს ნაჭრებს:

```
გვერდის ჩატვირთვა:
  renderStatBanner / renderHoldingsCards / renderDonut / renderPaginated   (bog, tbc)
       ↓
  refreshAll('bog'); refreshAll('tbc')        ← ცოცხალი ფასები + გადახატვა
       ↓
  setInterval(refreshAll, 30000)              ← ყოველ 30 წმ-ში თავიდან
```

`refreshAll(key)` = `refreshLivePrices` → banner/cards/holdings-summary/alloc-legend/donut გადახატვა + `● LIVE HH:MM` stamp.

ფაილს იყენებს ბევრი გვერდი: `index.html`, `portfolio.html`, `history-bog.html`, `history-tbc.html`, `startup.html` და სხვ.

---

## 8. ახალი ფუნქციის დაშენების წესი (შენი მოთხოვნა)

ამ არქიტექტურაში სუფთა გაფართოება ნიშნავს:

1. **ახალი ციფრი** → დაამატე `aggregate()`-ში (ერთი წყარო), არსად სხვაგან.
2. **ახალი ვიზუალი** → ახალი `renderXxx(containerId, portfolioKey)` ფუნქცია, იგივე ხელწერით; ლოგიკას არ ითვლის.
3. **გადახატვა ცოცხალზე** → ჩაამატე `refreshAll`/`refreshAndRender`-ის სიაში.
4. **ახალი მონაცემი** → წიგნის ან holding-ის ახალი ველი; ძველს ხელი არ ახლო.

> ამ რუკის მერე შემიძლია კონკრეტული ფუნქცია ავაშენო ზემოდან — ისტორიული გრაფიკი, benchmark შედარება, დივიდენდის ტრექინგი, ან რებალანსი. ყოველი ცვლილების წინ გაჩვენებ რა ფაილში რა იცვლება.
