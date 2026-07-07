#!/usr/bin/env python3
"""
The Trading Paper · Bot Lab — TEST VERSION / სატესტო ვერსია
5 paper portfolios run the same daily research picks with different rules.
Experiment: which allocation style survives contact with the market.

  bot1  კონცენტრატი    $100   all-in on the top pick
  bot2  დივერსიფიკაცია  $100   split across top 5 picks
  bot3  გრძელვადიანი    $100   only long-horizon picks, slow hands
  bot4  ფრთხილი         $100   30% position, one at a time
  bot5  Galt CFD 2.5×   $1000  leveraged CFD sim, mirrors the real
                               Galt & Taggart setup (40% margin,
                               $10 commission, ~-11.3% liquidation)

Paper only. Nothing here touches a real account.
Reads:  data/research.json (today's picks)
Writes: data/bot-lab.json
"""

import json
import os
import sys
import time
from datetime import datetime, timezone

import yfinance as yf

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
FEE_SMALL = 0.50          # bots 1-4, per trade
FEE_CFD = 10.00           # bot 5, per side (like Galt)
CFD_MARGIN = 0.40         # 40% initial margin = 2.5x leverage
CFD_LIQ_DD = -0.113       # price drawdown that liquidates (Galt quote)
CFD_INTEREST_YR = 0.12    # margin interest, annual


def now_utc():
    return datetime.now(timezone.utc)


def today():
    return now_utc().date().isoformat()


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


def default_bot(key, name_ka, desc_ka, start):
    return {
        "key": key, "name_ka": name_ka, "desc_ka": desc_ka,
        "start": start, "cash": float(start),
        "positions": [], "trades": [], "equity": float(start),
        "equity_history": [{"date": today(), "equity": float(start)}],
    }


def fresh_state():
    return {
        "test_version": True,
        "started": today(),
        "bots": {
            "bot1": default_bot("bot1", "ბოტი 1 · კონცენტრატი",
                                "მთელი $100 ერთ საუკეთესო არჩევანში", 100),
            "bot2": default_bot("bot2", "ბოტი 2 · დივერსიფიკაცია",
                                "$100 იყოფა ტოპ 5 არჩევანზე", 100),
            "bot3": default_bot("bot3", "ბოტი 3 · გრძელვადიანი",
                                "მხოლოდ გრძელვადიანი კატალიზატორები, 2-8 კვირა", 100),
            "bot4": default_bot("bot4", "ბოტი 4 · ფრთხილი",
                                "მაქს. 30% პოზიცია, ერთი ჯერზე", 100),
            "bot5": default_bot("bot5", "ბოტი 5 · Galt CFD 2.5×",
                                "$1000, ბერკეტი 2.5×, $10 საკომისიო, ლიკვიდაცია −11.3%-ზე — რეალური Galt სეტაპის ასლი", 1000),
        },
    }


def get_prices(tickers):
    """Latest close for a set of tickers."""
    out = {}
    if not tickers:
        return out
    try:
        import pandas as pd
        df = yf.download(list(tickers), period="5d", interval="1d",
                         group_by="ticker", progress=False, auto_adjust=True)
        for t in tickers:
            try:
                sub = df[t].dropna() if hasattr(df.columns, "levels") else df.dropna()
                out[t] = float(sub["Close"].iloc[-1])
            except Exception:
                continue
    except Exception as e:
        print(f"price fetch failed: {e}", file=sys.stderr)
    return out


def trading_days_open(pos):
    try:
        d0 = datetime.fromisoformat(pos["entry_date"]).date()
        return ((now_utc().date() - d0).days * 5) // 7  # rough calendar->trading
    except Exception:
        return 0


# ---------------------------------------------------------------- exits
def close_position(bot, pos, price, reason, fee):
    if pos.get("leverage"):
        # CFD: equity returned = shares*price - borrowed - interest - fee
        days = max(1, (now_utc().date() - datetime.fromisoformat(pos["entry_date"]).date()).days)
        interest = pos["borrowed"] * CFD_INTEREST_YR * days / 365
        proceeds = pos["shares"] * price - pos["borrowed"] - interest - fee
        invested = pos["own_equity"]
    else:
        proceeds = pos["shares"] * price - fee
        invested = pos["shares"] * pos["entry"] + fee
    ret = (proceeds / invested - 1) * 100 if invested > 0 else 0
    bot["cash"] += max(0.0, proceeds)
    bot["trades"].append({
        "ticker": pos["ticker"], "entry": pos["entry"], "exit": round(price, 2),
        "entry_date": pos["entry_date"], "exit_date": today(),
        "ret_pct": round(ret, 2), "reason": reason,
        "leverage": pos.get("leverage", 1),
    })
    print(f"{bot['key']}: closed {pos['ticker']} @ {price} ({reason}, {ret:+.1f}%)")


def update_positions(bot, prices):
    keep = []
    for pos in bot["positions"]:
        price = prices.get(pos["ticker"])
        if price is None:
            keep.append(pos)
            continue
        days = trading_days_open(pos)
        fee = FEE_CFD if pos.get("leverage") else FEE_SMALL
        if pos.get("leverage"):
            dd = price / pos["entry"] - 1
            if dd <= CFD_LIQ_DD:
                close_position(bot, pos, pos["entry"] * (1 + CFD_LIQ_DD), "LIQUIDATION", fee)
                continue
        if price >= pos["target"]:
            close_position(bot, pos, price, "target", fee)
        elif price <= pos["stop"]:
            close_position(bot, pos, price, "stop", fee)
        elif days >= pos["max_days"]:
            close_position(bot, pos, price, "time", fee)
        else:
            pos["last_price"] = round(price, 2)
            keep.append(pos)
    bot["positions"] = keep


def open_position(bot, pick, budget, max_days, leverage=1, prices=None):
    """budget = own money to commit. Returns True if opened."""
    price = (prices or {}).get(pick["ticker"], pick["price"])
    fee = FEE_CFD if leverage > 1 else FEE_SMALL
    if budget <= fee or budget > bot["cash"] + 1e-9:
        return False
    if leverage > 1:
        own = budget - fee
        notional = own / CFD_MARGIN
        shares = notional / price
        borrowed = notional - own
        pos = {"ticker": pick["ticker"], "shares": round(shares, 6),
               "entry": price, "entry_date": today(),
               "target": pick["plan"]["target"],
               "stop": max(pick["plan"]["stop"], round(price * (1 + CFD_LIQ_DD + 0.01), 2)),
               "max_days": max_days, "leverage": 2.5,
               "own_equity": own, "borrowed": round(borrowed, 2),
               "last_price": price}
    else:
        shares = (budget - fee) / price
        pos = {"ticker": pick["ticker"], "shares": round(shares, 6),
               "entry": price, "entry_date": today(),
               "target": pick["plan"]["target"], "stop": pick["plan"]["stop"],
               "max_days": max_days, "last_price": price}
    bot["cash"] -= budget
    bot["positions"].append(pos)
    print(f"{bot['key']}: opened {pick['ticker']} @ {price} (budget ${budget:.2f}, lev {leverage}x)")
    return True


# ---------------------------------------------------------------- strategies
def run_strategies(state, picks, prices):
    bots = state["bots"]
    held = lambda bot: {p["ticker"] for p in bot["positions"]}
    blocked = lambda bot: held(bot) | {t["ticker"] for t in bot["trades"]
                                       if t.get("exit_date") == today()}

    # bot1: all-in top pick when flat
    b = bots["bot1"]
    cands = [p for p in picks if p["ticker"] not in blocked(b)]
    if not b["positions"] and cands and cands[0]["score"] >= 60:
        open_position(b, cands[0], b["cash"], 7, prices=prices)

    # bot2: equal split across top 5 (score>=45), fill empty slots
    b = bots["bot2"]
    candidates = [p for p in picks if p["score"] >= 45 and p["ticker"] not in blocked(b)][:5]
    slots = 5 - len(b["positions"])
    for p in candidates[:slots]:
        per = b["cash"] / max(1, slots)
        if per >= 10:
            open_position(b, p, per, 7, prices=prices)
            slots -= 1

    # bot3: long-horizon picks only, up to 3, hold long
    b = bots["bot3"]
    longs = [p for p in picks if p["horizon"] == "long" and p["ticker"] not in blocked(b)]
    slots = 3 - len(b["positions"])
    for p in longs[:slots]:
        per = b["cash"] / max(1, slots)
        if per >= 10:
            open_position(b, p, per, 40, prices=prices)
            slots -= 1

    # bot4: cautious — one position, 30% of equity
    b = bots["bot4"]
    cands = [p for p in picks if p["ticker"] not in blocked(b)]
    if not b["positions"] and cands and cands[0]["score"] >= 50:
        open_position(b, cands[0], min(b["cash"], 0.30 * b["equity"]), 7, prices=prices)

    # bot5: Galt CFD 2.5x — only high conviction (>=70), one position, all cash
    b = bots["bot5"]
    cands = [p for p in picks if p["ticker"] not in blocked(b)]
    if not b["positions"] and cands and cands[0]["score"] >= 70:
        open_position(b, cands[0], b["cash"], 10, leverage=2.5, prices=prices)


# ---------------------------------------------------------------- equity
def mark_equity(bot, prices):
    eq = bot["cash"]
    for pos in bot["positions"]:
        price = prices.get(pos["ticker"], pos.get("last_price", pos["entry"]))
        if pos.get("leverage"):
            days = max(1, (now_utc().date() - datetime.fromisoformat(pos["entry_date"]).date()).days)
            interest = pos["borrowed"] * CFD_INTEREST_YR * days / 365
            eq += pos["shares"] * price - pos["borrowed"] - interest
        else:
            eq += pos["shares"] * price
    bot["equity"] = round(eq, 2)
    hist = bot["equity_history"]
    if hist and hist[-1]["date"] == today():
        hist[-1]["equity"] = bot["equity"]
    else:
        hist.append({"date": today(), "equity": bot["equity"]})


def main():
    research = load_json(os.path.join(DATA_DIR, "research.json"), {})
    picks = research.get("picks", [])
    state = load_json(os.path.join(DATA_DIR, "bot-lab.json"), None) or fresh_state()

    tickers = {p["ticker"] for b in state["bots"].values() for p in b["positions"]}
    tickers |= {p["ticker"] for p in picks[:5]}
    prices = get_prices(tickers)
    for p in picks:           # research.json prices are fresh from the same run
        prices.setdefault(p["ticker"], p["price"])

    for b in state["bots"].values():
        update_positions(b, prices)

    run_strategies(state, picks, prices)

    for b in state["bots"].values():
        mark_equity(b, prices)
        wins = sum(1 for t in b["trades"] if t["ret_pct"] > 0)
        b["stats"] = {
            "trades": len(b["trades"]), "wins": wins,
            "win_rate": round(wins / len(b["trades"]) * 100, 1) if b["trades"] else None,
            "return_pct": round((b["equity"] / b["start"] - 1) * 100, 2),
        }

    state["updated"] = now_utc().isoformat()
    save_json(os.path.join(DATA_DIR, "bot-lab.json"), state)
    print("bot-lab updated:", {k: v["equity"] for k, v in state["bots"].items()})


if __name__ == "__main__":
    main()
