#!/usr/bin/env python3
"""
The Trading Paper · Research Bot
Scans the whole US market, reads news catalysts, learns which catalyst
types actually moved prices, and outputs max 10 picks/day with one clear
allocation suggestion. Paper trading only.

Outputs:
  data/research.json        today's picks + notification text
  data/research-log.json    every pick ever made (for learning)
  data/catalyst-stats.json  learned win rates per catalyst category
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta

import pandas as pd
import yfinance as yf

# ---------------------------------------------------------------- config
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MAX_PICKS = 10
STAGE1_KEEP = 120          # candidates that survive the cheap screen
MIN_PRICE = 3.0
MAX_PRICE = 2000.0
MIN_DOLLAR_VOL = 8_000_000   # avg daily $ traded
EVAL_AFTER_DAYS = 7          # learning loop: grade picks after ~5 trading days
WIN_THRESHOLD = 3.0          # % gain to count as a win
LOSS_THRESHOLD = -3.0

UNIVERSE_URL = "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqtraded.txt"

# catalyst categories: keywords + base score + default horizon
CATALYSTS = {
    "earnings_beat":  {"score": 22, "horizon": "short", "kw": [
        "beats", "beat estimates", "tops estimates", "record revenue",
        "record quarter", "above expectations", "earnings beat"]},
    "guidance_raise": {"score": 25, "horizon": "long", "kw": [
        "raises guidance", "raised guidance", "raises outlook",
        "boosts forecast", "hikes forecast", "raises full-year"]},
    "analyst_upgrade": {"score": 15, "horizon": "short", "kw": [
        "upgrade", "upgraded", "overweight", "outperform rating",
        "initiates buy", "buy rating", "price target raised",
        "raises price target", "lifts price target"]},
    "big_contract":   {"score": 18, "horizon": "long", "kw": [
        "wins contract", "awarded contract", "signs deal",
        "partnership with", "strategic partnership", "multi-year deal",
        "collaboration with", "selected by"]},
    "fda_approval":   {"score": 28, "horizon": "long", "kw": [
        "fda approval", "fda approves", "fda clearance",
        "positive phase 3", "positive trial", "breakthrough designation"]},
    "m_and_a":        {"score": 26, "horizon": "short", "kw": [
        "acquisition", "to acquire", "merger", "buyout", "takeover bid",
        "acquires stake", "to be acquired"]},
    "buyback_dividend": {"score": 12, "horizon": "long", "kw": [
        "buyback", "share repurchase", "dividend increase",
        "raises dividend", "special dividend"]},
    "growth_news":    {"score": 10, "horizon": "long", "kw": [
        "expansion", "new product launch", "launches", "data center",
        "ai partnership", "production ramp", "opens new"]},
    # negatives
    "earnings_miss":  {"score": -25, "horizon": "short", "kw": [
        "misses", "missed estimates", "falls short", "below expectations",
        "cuts guidance", "lowers guidance", "lowered outlook", "warns",
        "profit warning"]},
    "analyst_downgrade": {"score": -15, "horizon": "short", "kw": [
        "downgrade", "downgraded", "underweight", "sell rating",
        "price target cut", "cuts price target", "lowers price target"]},
    "dilution":       {"score": -20, "horizon": "short", "kw": [
        "stock offering", "share offering", "dilution",
        "convertible notes", "secondary offering", "sells shares",
        "registered direct"]},
    "legal_trouble":  {"score": -22, "horizon": "long", "kw": [
        "lawsuit", "investigation", "sec probe", "fraud", "recall",
        "subpoena", "class action"]},
    "short_report":   {"score": -18, "horizon": "short", "kw": [
        "short seller", "short report", "hindenburg", "muddy waters"]},
}


def now_utc():
    return datetime.now(timezone.utc)


def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)


# ---------------------------------------------------------- universe
def get_universe():
    """All US tickers from Nasdaq Trader symbol directory (free, no key)."""
    try:
        req = urllib.request.Request(UNIVERSE_URL, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "ignore")
    except Exception as e:
        print(f"universe download failed: {e}", file=sys.stderr)
        return []
    tickers = []
    for line in raw.splitlines()[1:]:
        parts = line.split("|")
        if len(parts) < 8:
            continue
        sym, name, etf, test = parts[1], parts[2], parts[5], parts[3]
        if test == "Y" or etf == "Y":
            continue                      # skip test issues and ETFs
        if not sym or not sym.isalpha() or len(sym) > 5:
            continue                      # skip warrants/units/weird symbols
        if any(w in name.upper() for w in ("WARRANT", "RIGHT", " UNIT", "ACQUISITION CORP")):
            continue
        tickers.append(sym)
    print(f"universe: {len(tickers)} tickers")
    return tickers


# ---------------------------------------------------------- stage 1 screen
def stage1_screen(tickers):
    """Cheap bulk screen: price, volume, momentum. Keeps STAGE1_KEEP names."""
    rows = []
    chunk = 250
    for i in range(0, len(tickers), chunk):
        batch = tickers[i:i + chunk]
        try:
            df = yf.download(batch, period="1mo", interval="1d",
                             group_by="ticker", threads=True,
                             progress=False, auto_adjust=True)
        except Exception as e:
            print(f"chunk {i} failed: {e}", file=sys.stderr)
            continue
        for t in batch:
            try:
                sub = df[t].dropna() if isinstance(df.columns, pd.MultiIndex) else df.dropna()
                if len(sub) < 15:
                    continue
                close = sub["Close"]
                vol = sub["Volume"]
                price = float(close.iloc[-1])
                avg_vol = float(vol.tail(20).mean())
                dollar_vol = price * avg_vol
                if not (MIN_PRICE <= price <= MAX_PRICE):
                    continue
                if dollar_vol < MIN_DOLLAR_VOL:
                    continue
                mom5 = (price / float(close.iloc[-6]) - 1) * 100 if len(close) >= 6 else 0
                vol_surge = float(vol.iloc[-1]) / avg_vol if avg_vol > 0 else 0
                # interestingness: movement + unusual volume
                heat = abs(mom5) * 1.5 + max(0, vol_surge - 1) * 20
                rows.append({"ticker": t, "price": price, "mom5": mom5,
                             "vol_surge": vol_surge, "heat": heat})
            except Exception:
                continue
        time.sleep(1)
    rows.sort(key=lambda r: r["heat"], reverse=True)
    keep = rows[:STAGE1_KEEP]
    print(f"stage1: {len(rows)} passed filters, keeping {len(keep)}")
    return keep


# ---------------------------------------------------------- indicators
def rsi(closes, period=14):
    if len(closes) < period + 1:
        return 50.0
    deltas = closes.diff().dropna()
    gain = deltas.clip(lower=0).rolling(period).mean()
    loss = (-deltas.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, 1e-9)
    return float((100 - 100 / (1 + rs)).iloc[-1])


def atr(df, period=14):
    h, l, c = df["High"], df["Low"], df["Close"]
    tr = pd.concat([h - l, (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    return float(tr.rolling(period).mean().iloc[-1])


# ---------------------------------------------------------- news
def fetch_news(ticker_obj):
    """Return list of {title, age_h}. Handles both old and new yfinance shapes."""
    out = []
    try:
        items = ticker_obj.news or []
    except Exception:
        return out
    now = now_utc()
    for it in items[:12]:
        try:
            content = it.get("content", it)
            title = content.get("title") or it.get("title") or ""
            ts = None
            if "providerPublishTime" in it:
                ts = datetime.fromtimestamp(it["providerPublishTime"], tz=timezone.utc)
            else:
                pub = content.get("pubDate") or content.get("displayTime")
                if pub:
                    ts = datetime.fromisoformat(str(pub).replace("Z", "+00:00"))
            age_h = (now - ts).total_seconds() / 3600 if ts else 999
            if title:
                out.append({"title": title.strip(), "age_h": round(age_h, 1)})
        except Exception:
            continue
    return out


def learned_multiplier(cat, learned):
    """Catalysts that historically worked get boosted, losers get faded."""
    s = learned.get(cat)
    if not s or s.get("n", 0) < 5:
        return 1.0
    wr = s["wins"] / s["n"]
    return round(0.6 + 0.8 * wr, 2)   # 0.6x (never works) .. 1.4x (always works)


def score_news(news_items, learned):
    """Match headlines to catalyst categories. Returns (score, matches)."""
    total = 0.0
    matches = []
    seen_cats = set()
    for n in news_items:
        title_l = n["title"].lower()
        if n["age_h"] > 72:
            continue
        freshness = 1.0 if n["age_h"] <= 24 else (0.6 if n["age_h"] <= 48 else 0.3)
        for cat, spec in CATALYSTS.items():
            if cat in seen_cats:
                continue
            if any(kw in title_l for kw in spec["kw"]):
                mult = learned_multiplier(cat, learned)
                pts = spec["score"] * freshness * mult
                total += pts
                seen_cats.add(cat)
                matches.append({"category": cat, "headline": n["title"],
                                "age_h": n["age_h"], "points": round(pts, 1)})
    return total, matches


# ---------------------------------------------------------- stage 2 deep dive
def stage2_research(candidates, learned):
    picks = []
    for c in candidates:
        t = c["ticker"]
        try:
            tk = yf.Ticker(t)
            hist = tk.history(period="6mo", auto_adjust=True)
            if len(hist) < 40:
                continue
            close = hist["Close"]
            price = float(close.iloc[-1])
            sma20 = float(close.rolling(20).mean().iloc[-1])
            sma50 = float(close.rolling(50).mean().iloc[-1])
            r = rsi(close)
            a = atr(hist)
            high20 = float(hist["High"].tail(20).max())

            tech = 0.0
            if price > sma20:
                tech += 10
            if sma20 > sma50:
                tech += 8          # uptrend structure
            if 45 <= r <= 68:
                tech += 8          # healthy, not overheated
            elif r > 78:
                tech -= 10         # chasing
            elif r < 30:
                tech += 4          # bounce potential
            if price >= high20 * 0.985:
                tech += 10         # breakout zone
            tech += min(10, max(0, c["vol_surge"] - 1) * 8)
            tech += max(-8, min(10, c["mom5"]))

            news = fetch_news(tk)
            nscore, matches = score_news(news, learned)
            if nscore <= 0:
                continue           # only pick names WITH a positive catalyst
            total = round(tech + nscore, 1)
            horizon = "long" if any(
                CATALYSTS[m["category"]]["horizon"] == "long" and m["points"] > 0
                for m in matches) else "short"
            picks.append({
                "ticker": t, "price": round(price, 2), "score": total,
                "tech_score": round(tech, 1), "news_score": round(nscore, 1),
                "rsi": round(r, 1), "mom5": round(c["mom5"], 2),
                "vol_surge": round(c["vol_surge"], 2),
                "catalysts": matches,
                "horizon": horizon,
                "plan": {
                    "entry": round(price, 2),
                    "target": round(price + (3.0 if horizon == "long" else 2.0) * a, 2),
                    "stop": round(price - 1.2 * a, 2),
                    "hold": "2-8 კვირა" if horizon == "long" else "3-7 დღე",
                },
            })
        except Exception as e:
            print(f"{t}: {e}", file=sys.stderr)
        time.sleep(0.4)
    picks.sort(key=lambda p: p["score"], reverse=True)
    return picks[:MAX_PICKS]


# ---------------------------------------------------------- allocation logic
def build_notification(picks):
    """One clear instruction. No noise."""
    if not picks:
        return ("WAIT", "ბოტი ელოდება — no clean catalyst setups today. Cash is a position too.")
    top = picks[0]
    second = picks[1]["score"] if len(picks) > 1 else 0
    strong = [p for p in picks if p["score"] >= 55]
    if top["score"] >= 75 and top["score"] - second >= 15:
        return ("CONCENTRATE",
                f"🔥 One clear standout: {top['ticker']} (score {top['score']}). "
                f"Bot would put the whole paper $100 here. "
                f"Entry {top['plan']['entry']}, target {top['plan']['target']}, stop {top['plan']['stop']}.")
    if len(strong) >= 3:
        names = ", ".join(p["ticker"] for p in strong[:5])
        return ("DIVERSIFY",
                f"📊 {len(strong[:5])} solid setups — split the paper $100 across: {names}. "
                f"No single hero today, the basket is the play.")
    if top["score"] >= 45:
        return ("STARTER",
                f"🌱 Mild edge on {top['ticker']} (score {top['score']}). "
                f"Bot would risk only ~30% of paper cash. Not a back-up-the-truck day.")
    return ("WAIT", "ბოტი ელოდება — candidates exist but nothing scores high enough. Skip today.")


# ---------------------------------------------------------- learning loop
def evaluate_past_picks(log, learned):
    """Grade picks older than EVAL_AFTER_DAYS, update catalyst win rates."""
    cutoff = now_utc() - timedelta(days=EVAL_AFTER_DAYS)
    pending = [e for e in log if e.get("status") == "open"
               and datetime.fromisoformat(e["date"]) < cutoff]
    if not pending:
        return log, learned
    tickers = list({e["ticker"] for e in pending})
    prices = {}
    try:
        df = yf.download(tickers, period="5d", interval="1d",
                         group_by="ticker", progress=False, auto_adjust=True)
        for t in tickers:
            try:
                sub = df[t].dropna() if isinstance(df.columns, pd.MultiIndex) else df.dropna()
                prices[t] = float(sub["Close"].iloc[-1])
            except Exception:
                continue
    except Exception as e:
        print(f"eval download failed: {e}", file=sys.stderr)
        return log, learned
    for e in pending:
        cur = prices.get(e["ticker"])
        if cur is None:
            continue
        ret = (cur / e["entry"] - 1) * 100
        e["status"] = "graded"
        e["exit_price"] = round(cur, 2)
        e["return_pct"] = round(ret, 2)
        outcome = "win" if ret >= WIN_THRESHOLD else ("loss" if ret <= LOSS_THRESHOLD else "flat")
        e["outcome"] = outcome
        for cat in e.get("catalyst_cats", []):
            s = learned.setdefault(cat, {"n": 0, "wins": 0, "sum_ret": 0.0})
            s["n"] += 1
            if outcome == "win":
                s["wins"] += 1
            s["sum_ret"] = round(s["sum_ret"] + ret, 2)
        print(f"graded {e['ticker']}: {ret:+.1f}% ({outcome})")
    return log, learned


# ---------------------------------------------------------- main
def main():
    learned = load_json(os.path.join(DATA_DIR, "catalyst-stats.json"), {})
    log = load_json(os.path.join(DATA_DIR, "research-log.json"), [])

    # 1. learn from the past first
    log, learned = evaluate_past_picks(log, learned)

    # 2. scan the whole market
    universe = get_universe()
    if not universe:
        print("no universe — aborting without overwriting data", file=sys.stderr)
        sys.exit(1)
    candidates = stage1_screen(universe)

    # 3. deep research on survivors
    picks = stage2_research(candidates, learned)
    mode, notification = build_notification(picks)

    # 4. log today's picks for future learning
    today = now_utc().date().isoformat()
    already = {(e["ticker"], e["date"][:10]) for e in log}
    for p in picks:
        if (p["ticker"], today) in already:
            continue
        log.append({
            "date": now_utc().isoformat(),
            "ticker": p["ticker"], "entry": p["price"], "score": p["score"],
            "horizon": p["horizon"],
            "catalyst_cats": [m["category"] for m in p["catalysts"] if m["points"] > 0],
            "status": "open",
        })

    # 5. learned stats summary for the website
    learned_view = []
    for cat, s in sorted(learned.items(), key=lambda kv: -kv[1].get("n", 0)):
        if s.get("n", 0) >= 3:
            learned_view.append({
                "category": cat, "n": s["n"],
                "win_rate": round(s["wins"] / s["n"] * 100, 1),
                "avg_return": round(s["sum_ret"] / s["n"], 2),
                "weight_now": learned_multiplier(cat, learned),
            })

    save_json(os.path.join(DATA_DIR, "research.json"), {
        "updated": now_utc().isoformat(),
        "mode": mode,
        "notification": notification,
        "picks": picks,
        "learned": learned_view,
        "scanned": len(universe),
        "shortlisted": len(candidates),
        "disclaimer": "Not financial advice — paper trading research bot. You decide real trades.",
    })
    save_json(os.path.join(DATA_DIR, "research-log.json"), log)
    save_json(os.path.join(DATA_DIR, "catalyst-stats.json"), learned)
    print(f"done: {len(picks)} picks, mode={mode}")


if __name__ == "__main__":
    main()
