"use client";

import { useEffect, useMemo, useState } from "react";

type WatchItem = {
  ticker: string;
  name: string;
  className: string;
  moat: number;
  certainty: number;
  valuation: number;
  balance: number;
  momentum: number;
  targetWeight: string;
  action: "Buy zone" | "Hold core" | "Wait" | "Review";
  thesis: string;
  trigger: string;
  risk: string;
};

type TradeEntry = {
  id: string;
  date: string;
  ticker: string;
  action: string;
  size: string;
  price: string;
  thesis: string;
  valuation: string;
  risk: string;
  invalidation: string;
};

const watchlist: WatchItem[] = [
  {
    ticker: "BRK.B",
    name: "Berkshire Hathaway",
    className: "Capital allocator",
    moat: 96,
    certainty: 92,
    valuation: 72,
    balance: 98,
    momentum: 62,
    targetWeight: "10-18%",
    action: "Hold core",
    thesis: "多元现金流、保险浮存金和高质量资本配置，是组合里的防守型价值锚。",
    trigger: "大盘恐慌、估值回到历史中低位、回购强度提升。",
    risk: "接班人执行、保险巨灾、现金拖累回报。",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    className: "Software platform",
    moat: 94,
    certainty: 94,
    valuation: 58,
    balance: 93,
    momentum: 76,
    targetWeight: "8-15%",
    action: "Wait",
    thesis: "企业软件、云、AI 分发能力强，确定性极高，但价格纪律比故事更重要。",
    trigger: "自由现金流收益率改善、Azure 增速稳定、市场给出可接受安全边际。",
    risk: "AI 投入回报周期、监管、估值压缩。",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    className: "Attention + AI",
    moat: 91,
    certainty: 86,
    valuation: 76,
    balance: 96,
    momentum: 71,
    targetWeight: "8-14%",
    action: "Buy zone",
    thesis: "搜索、YouTube、云和 AI 基础设施提供高质量现金流，估值常比同级龙头温和。",
    trigger: "核心广告韧性、云利润率改善、AI 搜索没有明显伤害商业化。",
    risk: "搜索份额变化、反垄断、AI 改变广告入口。",
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    className: "Scale network",
    moat: 90,
    certainty: 84,
    valuation: 65,
    balance: 80,
    momentum: 82,
    targetWeight: "6-12%",
    action: "Review",
    thesis: "AWS、广告和零售规模效应仍强，利润率弹性是核心看点。",
    trigger: "AWS 重回健康增速、零售经营杠杆继续兑现。",
    risk: "资本开支、云竞争、低利润业务拖累。",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    className: "AI infrastructure",
    moat: 93,
    certainty: 76,
    valuation: 42,
    balance: 92,
    momentum: 95,
    targetWeight: "4-10%",
    action: "Wait",
    thesis: "AI 算力龙头地位清晰，但高预期需要更严格的仓位和估值纪律。",
    trigger: "增长预期下修后仍能维持高 ROIC，或回撤给出足够安全边际。",
    risk: "客户资本开支周期、ASIC 替代、出口限制、估值波动。",
  },
  {
    ticker: "COST",
    name: "Costco",
    className: "Consumer compounder",
    moat: 88,
    certainty: 91,
    valuation: 38,
    balance: 87,
    momentum: 74,
    targetWeight: "3-8%",
    action: "Wait",
    thesis: "会员制零售典范，确定性好，但长期优秀公司也不能无视价格。",
    trigger: "估值回到可接受区间、会员续费率保持强势。",
    risk: "估值过高、同店增速放缓、消费环境转弱。",
  },
  {
    ticker: "BTC",
    name: "Bitcoin",
    className: "Digital scarcity",
    moat: 86,
    certainty: 62,
    valuation: 50,
    balance: 72,
    momentum: 79,
    targetWeight: "5-15%",
    action: "Review",
    thesis: "作为稀缺数字资产和宏观对冲，适合用固定纪律持有，而不是情绪追涨。",
    trigger: "长期持仓比例低于目标、链上/宏观恐慌导致分批窗口。",
    risk: "监管、流动性周期、极端波动、保管风险。",
  },
];

const defaultTrade: TradeEntry = {
  id: "",
  date: new Date().toISOString().slice(0, 10),
  ticker: "GOOGL",
  action: "买入",
  size: "1/4 计划仓位",
  price: "",
  thesis: "行业龙头，现金流质量高，当前价格提供可接受安全边际。",
  valuation: "估值低于我愿意持有十年的质量所需回报率。",
  risk: "监管和 AI 搜索入口变化可能压缩利润率。",
  invalidation: "核心业务份额或自由现金流质量连续两个季度明显恶化。",
};

const tradeLogStorageKey = "investor-trade-log";
const weeklyNotesStorageKey = "investor-weekly-notes";

function readSavedEntries() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(tradeLogStorageKey);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as TradeEntry[];
  } catch {
    return [];
  }
}

function readSavedWeeklyNotes() {
  if (typeof window === "undefined") {
    return "本周只在高确定性资产出现安全边际时行动；如果没有好价格，现金也是仓位。";
  }
  return (
    window.localStorage.getItem(weeklyNotesStorageKey) ??
    "本周只在高确定性资产出现安全边际时行动；如果没有好价格，现金也是仓位。"
  );
}

function score(item: WatchItem) {
  return Math.round(
    item.moat * 0.28 +
      item.certainty * 0.28 +
      item.valuation * 0.22 +
      item.balance * 0.12 +
      item.momentum * 0.1,
  );
}

function recommendation(item: WatchItem) {
  const total = score(item);
  if (total >= 82 && item.valuation >= 68) return "可分批开单";
  if (total >= 78) return "核心观察";
  if (item.valuation < 50) return "等待价格";
  return "需要复核";
}

function buildReason(entry: TradeEntry) {
  return [
    `${entry.date} ${entry.action} ${entry.ticker}${entry.price ? ` @ ${entry.price}` : ""}，仓位：${entry.size}。`,
    `理由：${entry.thesis}`,
    `估值纪律：${entry.valuation}`,
    `主要风险：${entry.risk}`,
    `撤销条件：${entry.invalidation}`,
  ].join("\n");
}

export default function Home() {
  const [trade, setTrade] = useState<TradeEntry>(defaultTrade);
  const [entries, setEntries] = useState<TradeEntry[]>(readSavedEntries);
  const [activeTicker, setActiveTicker] = useState("GOOGL");
  const [weeklyNotes, setWeeklyNotes] = useState(readSavedWeeklyNotes);

  useEffect(() => {
    window.localStorage.setItem(tradeLogStorageKey, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    window.localStorage.setItem(weeklyNotesStorageKey, weeklyNotes);
  }, [weeklyNotes]);

  const ranked = useMemo(
    () => [...watchlist].sort((a, b) => score(b) - score(a)),
    [],
  );
  const active = watchlist.find((item) => item.ticker === activeTicker) ?? ranked[0];
  const generatedReason = buildReason(trade);
  const buyZoneCount = watchlist.filter((item) => item.action === "Buy zone").length;
  const waitCount = watchlist.filter((item) => item.action === "Wait").length;

  function updateTrade(field: keyof TradeEntry, value: string) {
    setTrade((current) => ({ ...current, [field]: value }));
  }

  function saveTrade() {
    const id = crypto.randomUUID();
    setEntries((current) => [{ ...trade, id }, ...current].slice(0, 12));
  }

  const weeklySummary = [
    `本周核心动作：买入区 ${buyZoneCount} 个，等待 ${waitCount} 个，最近记录 ${entries.length} 笔。`,
    `最高优先级：${ranked[0].ticker}，综合分 ${score(ranked[0])}，当前结论：${recommendation(ranked[0])}。`,
    `纪律提醒：先确认确定性和安全边际，再决定仓位；任何开单都必须写清撤销条件。`,
    `主观备注：${weeklyNotes}`,
  ].join("\n");

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <section className="hero-shell">
        <nav className="topbar" aria-label="Primary">
          <div>
            <p className="eyebrow">Personal investment cockpit</p>
            <h1>价值投资决策台</h1>
          </div>
          <div className="nav-actions">
            <a href="#trade">开单理由</a>
            <a href="#weekly">周复盘</a>
          </div>
        </nav>

        <div className="hero-grid">
          <section className="decision-panel" aria-labelledby="today-title">
            <p className="eyebrow">Today</p>
            <h2 id="today-title">今天是否值得行动？</h2>
            <div className="signal-row">
              <div>
                <span className="metric">{buyZoneCount}</span>
                <span>买入区</span>
              </div>
              <div>
                <span className="metric">{waitCount}</span>
                <span>等待价格</span>
              </div>
              <div>
                <span className="metric">{entries.length}</span>
                <span>近期记录</span>
              </div>
            </div>
            <p className="decision-copy">
              第一原则：只买行业龙头、确定性最高的公司和 BTC；价格不给安全边际时，默认不动。
            </p>
            <div className="rule-strip">
              <span>确定性</span>
              <span>安全边际</span>
              <span>仓位纪律</span>
              <span>撤销条件</span>
            </div>
          </section>

          <section className="allocation-panel" aria-labelledby="allocation-title">
            <p className="eyebrow">Allocation guardrails</p>
            <h2 id="allocation-title">组合纪律</h2>
            <div className="allocation-list">
              <div>
                <span>核心龙头股</span>
                <strong>60-75%</strong>
              </div>
              <div>
                <span>BTC</span>
                <strong>5-15%</strong>
              </div>
              <div>
                <span>机会现金</span>
                <strong>10-25%</strong>
              </div>
            </div>
            <p>
              单一高波动资产不超过计划上限；新仓分 3-4 次进入，除非价格和确定性同时极端有利。
            </p>
          </section>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Watchlist score</p>
          <h2>候选资产排序</h2>
        </div>
        <div className="watch-grid">
          {ranked.map((item) => (
            <button
              className={`asset-card ${activeTicker === item.ticker ? "is-active" : ""}`}
              key={item.ticker}
              onClick={() => setActiveTicker(item.ticker)}
              type="button"
            >
              <span className="asset-topline">
                <strong>{item.ticker}</strong>
                <span>{score(item)}</span>
              </span>
              <span>{item.name}</span>
              <span className="asset-meta">{item.className}</span>
              <span className={`pill ${item.action.toLowerCase().replace(" ", "-")}`}>
                {recommendation(item)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-shell detail-grid">
        <article className="detail-panel">
          <p className="eyebrow">Current focus</p>
          <h2>
            {active.ticker} · {active.name}
          </h2>
          <p className="lead">{active.thesis}</p>
          <div className="score-bars">
            {[
              ["护城河", active.moat],
              ["确定性", active.certainty],
              ["估值", active.valuation],
              ["资产负债", active.balance],
              ["趋势", active.momentum],
            ].map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div className="bar-track">
                  <div style={{ width: `${value}%` }} />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-panel thesis-panel">
          <p className="eyebrow">Action memo</p>
          <h2>{recommendation(active)}</h2>
          <dl>
            <div>
              <dt>目标仓位</dt>
              <dd>{active.targetWeight}</dd>
            </div>
            <div>
              <dt>触发条件</dt>
              <dd>{active.trigger}</dd>
            </div>
            <div>
              <dt>主要风险</dt>
              <dd>{active.risk}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="section-shell trade-grid" id="trade">
        <div className="section-heading">
          <p className="eyebrow">Order ticket</p>
          <h2>开单理由生成器</h2>
        </div>
        <form className="ticket-panel" onSubmit={(event) => event.preventDefault()}>
          <label>
            日期
            <input
              type="date"
              value={trade.date}
              onChange={(event) => updateTrade("date", event.target.value)}
            />
          </label>
          <label>
            标的
            <select
              value={trade.ticker}
              onChange={(event) => updateTrade("ticker", event.target.value)}
            >
              {watchlist.map((item) => (
                <option key={item.ticker}>{item.ticker}</option>
              ))}
            </select>
          </label>
          <label>
            动作
            <select
              value={trade.action}
              onChange={(event) => updateTrade("action", event.target.value)}
            >
              <option>买入</option>
              <option>加仓</option>
              <option>减仓</option>
              <option>不行动</option>
            </select>
          </label>
          <label>
            仓位
            <input
              value={trade.size}
              onChange={(event) => updateTrade("size", event.target.value)}
            />
          </label>
          <label>
            价格
            <input
              placeholder="可留空"
              value={trade.price}
              onChange={(event) => updateTrade("price", event.target.value)}
            />
          </label>
          <label className="wide">
            投资理由
            <textarea
              value={trade.thesis}
              onChange={(event) => updateTrade("thesis", event.target.value)}
            />
          </label>
          <label className="wide">
            估值纪律
            <textarea
              value={trade.valuation}
              onChange={(event) => updateTrade("valuation", event.target.value)}
            />
          </label>
          <label className="wide">
            主要风险
            <textarea
              value={trade.risk}
              onChange={(event) => updateTrade("risk", event.target.value)}
            />
          </label>
          <label className="wide">
            撤销条件
            <textarea
              value={trade.invalidation}
              onChange={(event) => updateTrade("invalidation", event.target.value)}
            />
          </label>
          <button className="primary-button" onClick={saveTrade} type="button">
            保存这次开单理由
          </button>
        </form>

        <aside className="reason-panel">
          <p className="eyebrow">Generated reason</p>
          <pre>{generatedReason}</pre>
        </aside>
      </section>

      <section className="section-shell weekly-grid" id="weekly">
        <article className="weekly-panel">
          <p className="eyebrow">Weekly review</p>
          <h2>本周总结草稿</h2>
          <textarea
            aria-label="主观备注"
            value={weeklyNotes}
            onChange={(event) => setWeeklyNotes(event.target.value)}
          />
          <pre>{weeklySummary}</pre>
        </article>
        <article className="log-panel">
          <p className="eyebrow">Recent tickets</p>
          <h2>近期记录</h2>
          {entries.length === 0 ? (
            <p className="empty-state">保存第一笔开单理由后，这里会形成你的个人决策日志。</p>
          ) : (
            entries.map((entry) => (
              <div className="log-item" key={entry.id}>
                <span>
                  {entry.date} · {entry.action} · {entry.ticker}
                </span>
                <strong>{entry.size}</strong>
                <p>{entry.thesis}</p>
              </div>
            ))
          )}
        </article>
      </section>
    </main>
  );
}
