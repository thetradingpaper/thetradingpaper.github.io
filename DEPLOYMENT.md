# Deployment Guide — როგორ ავტვირთო GitHub Pages-ზე

ეს არის ერთჯერადი სამუშაო — 10-15 წუთი. შემდეგ მუდმივად მუშაობს.

## რა გჭირდება

- GitHub account (უფასო) — github.com/join
- Git დაყენებული შენს კომპიუტერზე — [git-scm.com/downloads](https://git-scm.com/downloads)
- ეს ფაილების ფოლდერი: `thetradingpaper/`

---

## ნაბიჯი 1 — GitHub username შექმნა

1. გადადი [github.com/join](https://github.com/join)
2. შექმენი account სახელით **`thetradingpaper`**
   - თუ დაკავებულია, სცადე: `tradingpaperhq`, `tradingpaperlive`, `tpaper-hq`, ან რაც გინდა
3. დაიმახსოვრე შენი username — დაგვჭირდება

> **მნიშვნელოვანი:** შენი მთავარი URL იქნება `{username}.github.io`. რაც დაარქმევ — ის იქნება URL.

## ნაბიჯი 2 — Repository შექმნა

1. შესვლის შემდეგ დააწექი **მწვანე "New" ღილაკს** (ან გადადი [github.com/new](https://github.com/new))
2. **Repository name:** ზუსტად `{username}.github.io`
   - მაგ. თუ username `thetradingpaper` არის → repo სახელი იქნება `thetradingpaper.github.io`
3. დატოვე **Public** (Private GitHub Pages უფასოდ არ მუშაობს)
4. **არ** მონიშნო "Add README" — ჩვენი README უკვე გვაქვს
5. დააწექი **"Create repository"**

## ნაბიჯი 3 — ფაილების ატვირთვა

GitHub-ი გაჩვენებს გვერდს ბრძანებებით. ჩვენი ვერსია:

გახსენი ტერმინალი (Windows: Git Bash; Mac: Terminal) და გადადი ფოლდერში:

```bash
cd "C:\Users\balnoi\Documents\Claude\Projects\stock\thetradingpaper"
```

შემდეგ ბრძანებები (შეცვალე `{username}` შენი username-ით):

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/{username}/{username}.github.io.git
git push -u origin main
```

პირველ push-ზე GitHub მოგთხოვს ავტორიზაციას — შესვლა ბრაუზერით.

## ნაბიჯი 4 — GitHub Pages ჩართვა

1. გადადი შენი repo-ს გვერდზე → **Settings** (ზედა მენიუ)
2. მარცხნივ → **Pages**
3. **Source:** "Deploy from a branch"
4. **Branch:** `main` → `/ (root)` → **Save**
5. დაელოდე 1-2 წუთი — საიტი იქნება ცოცხალი: `https://{username}.github.io`

---

## ნაბიჯი 5 — განახლებების შეტანა

ნებისმიერი ცვლილების შემდეგ:

```bash
cd "C:\Users\balnoi\Documents\Claude\Projects\stock\thetradingpaper"
git add .
git commit -m "update — რა შეცვალე"
git push
```

1-2 წუთში ცვლილებები იქნება ცოცხალ საიტზე.

---

## ხშირი პრობლემები

**"Permission denied" push-ის დროს**
GitHub ახლა iccusual password-ს არ მიიღებს. გადადი [github.com/settings/tokens](https://github.com/settings/tokens) → "Generate new token (classic)" → მონიშნე `repo` → კოპირება. ეს გამოიყენე password-ის ნაცვლად.

**საიტი არ ხსნა "404"**
დაიცადე 5 წუთი — პირველად შეიძლება გაჭიანურდეს. შემოწმდი Settings → Pages — სტატუსი უნდა იყოს მწვანე "Your site is live at...".

**TradingView widgets-ი არ ჩანს**
ეს ნორმალურია localhost-ზე — სრულად მხოლოდ ცოცხალ URL-ზე იტვირთება. შეამოწმე GitHub Pages URL-ზე.

---

## საიტი მუდამ რჩება?

დიახ. GitHub Pages უფასოა და სამუდამოა, თუ:
- შენი account აქტიურია (გათიშავ თუ 1+ წელი არ შეხვალ)
- Repo-ს არ წაშლი
- GitHub-ი არ შეცვლის პოლიტიკას (2008-დან არ ცვლის)

თუ უსაფრთხო გინდა გრძელვადიანი ჰოსტინგი — შემიძლია გასწავლო backup-ი Cloudflare Pages-ზე ($0).
