# The Trading Paper

ლაშას პორტფელის ბლოგი — ბაზრის მიმოხილვა, სტატიები, ლეგენდები, ჩემი პორტფელი.

**ცოცხალი საიტი:** `https://thetradingpaper.github.io` (აქ იქნება, თუ deployment წარმატებით გავიდა)

## სტრუქტურა

```
thetradingpaper/
├── index.html          → ბაზრის მთავარი გვერდი (TradingView widgets)
├── articles.html       → სტატიების სია
├── legends.html        → მსოფლიოს ცნობილი ინვესტორების პორტფელები
├── portfolio.html      → ჩემი პორტფელი (Dogma + Active)
├── css/
│   └── style.css       → ყველა გვერდის სტილი
└── articles/
    └── 01-shesavali.html
```

## დეპლოიმენტი — სრული ნაბიჯ-ნაბიჯ გზამკვლევი

იხილე `DEPLOYMENT.md`.

## ახალი სტატიის დამატება

1. შექმენი ახალი ფაილი `articles/02-{slug}.html` (გადააკოპირე `01-shesavali.html`)
2. შეცვალე title, თარიღი და ტექსტი
3. დაამატე ბარათი `articles.html`-ში `<div class="grid cols-2">`-ის შიგნით
4. Git commit + push → ავტომატურად განახლდება საიტი

## პორტფელის განახლება

1. გახსენი `portfolio.html`
2. ცხრილებში შეცვალე ციფრები
3. შეცვალე "განახლება" თარიღი
4. Git commit + push
