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
  gates: string[];
  createdAt?: string;
};

type GateKey = "leader" | "understood" | "margin" | "sizing" | "invalidation";

const watchlist: WatchItem[] = [
  {
    ticker: "BRK.B",
    name: "Berkshire Hathaway",
    className: "资本配置",
    moat: 96,
    certainty: 92,
    valuation: 72,
    balance: 98,
    momentum: 62,
    targetWeight: "10–18%",
    action: "Hold core",
    thesis: "多元现金流、保险浮存金与长期资本配置能力，是组合里的防守型价值锚。",
    trigger: "大盘恐慌、估值回到历史中低位，或回购强度明显提升。",
    risk: "接班人执行、保险巨灾与大量现金对长期回报的拖累。",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    className: "软件平台",
    moat: 94,
    certainty: 94,
    valuation: 58,
    balance: 93,
    momentum: 76,
    targetWeight: "8–15%",
    action: "Wait",
    thesis: "企业软件、云与 AI 分发能力强，确定性极高，但价格纪律比故事更重要。",
    trigger: "自由现金流收益率改善、Azure 增速稳定，且市场给出足够安全边际。",
    risk: "AI 投入回报周期、监管与高估值压缩。",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    className: "注意力 + AI",
    moat: 91,
    certainty: 86,
    valuation: 76,
    balance: 96,
    momentum: 71,
    targetWeight: "8–14%",
    action: "Buy zone",
    thesis: "搜索、YouTube、云与 AI 基础设施提供高质量现金流，估值常比同级龙头温和。",
    trigger: "广告保持韧性、云利润率改善，且 AI 搜索没有显著伤害商业化。",
    risk: "搜索份额变化、反垄断与 AI 改变广告入口。",
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    className: "规模网络",
    moat: 90,
    certainty: 84,
    valuation: 65,
    balance: 80,
    momentum: 82,
    targetWeight: "6–12%",
    action: "Review",
    thesis: "AWS、广告与零售规模效应仍强，利润率弹性是核心看点。",
    trigger: "AWS 回到健康增速，零售经营杠杆继续兑现。",
    risk: "资本开支、云竞争与低利润业务拖累。",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    className: "AI 基础设施",
    moat: 93,
    certainty: 76,
    valuation: 42,
    balance: 92,
    momentum: 95,
    targetWeight: "4–10%",
    action: "Wait",
    thesis: "AI 算力龙头地位清晰，但高预期要求更严格的仓位与估值纪律。",
    trigger: "增长预期下修后仍维持高 ROIC，或回撤提供足够安全边际。",
    risk: "客户资本开支周期、ASIC 替代、出口限制与估值波动。",
  },
  {
    ticker: "COST",
    name: "Costco",
    className: "消费复利",
    moat: 88,
    certainty: 91,
    valuation: 38,
    balance: 87,
    momentum: 74,
    targetWeight: "3–8%",
    action: "Wait",
    thesis: "会员制零售典范，经营确定性高，但优秀公司同样不能无视价格。",
    trigger: "估值回到可接受区间，会员续费率保持强势。",
    risk: "估值过高、同店增速放缓与消费环境转弱。",
  },
  {
    ticker: "BTC",
    name: "Bitcoin",
    className: "数字稀缺资产",
    moat: 86,
    certainty: 62,
    valuation: 50,
    balance: 72,
    momentum: 79,
    targetWeight: "5–15%",
    action: "Review",
    thesis: "作为稀缺数字资产与宏观对冲，用固定纪律持有，不用情绪追涨。",
    trigger: "长期仓位低于目标，且流动性或市场恐慌提供分批窗口。",
    risk: "监管、流动性周期、极端波动与保管风险。",
  },
];

const gateLabels: Record<GateKey, string> = {
  leader: "它是行业龙头或拥有不可替代的网络效应",
  understood: "我能用三句话解释它如何赚钱",
  margin: "当前价格提供了可量化的安全边际",
  sizing: "即使下跌 40%，仓位也不会影响长期计划",
  invalidation: "我已写清什么事实会证明自己错了",
};

const defaultTrade: TradeEntry = {
  id: "",
  date: new Date().toISOString().slice(0, 10),
  ticker: "GOOGL",
  action: "买入",
  size: "1/4 计划仓位",
  price: "",
  thesis: "行业龙头，现金流质量高，当前价格提供可接受安全边际。",
  valuation: "估值低于我愿意持有十年的质量所要求的回报率。",
  risk: "监管与 AI 搜索入口变化可能压缩长期利润率。",
  invalidation: "核心业务份额或自由现金流质量连续两个季度明显恶化。",
  gates: [],
};

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
  if (total >= 82 && item.valuation >= 68) return "可分批研究";
  if (total >= 78) return "核心观察";
  if (item.valuation < 50) return "等待价格";
  return "需要复核";
}

function buildReason(entry: TradeEntry) {
  return [
    `决策：${entry.date} ${entry.action} ${entry.ticker}${entry.price ? ` @ ${entry.price}` : ""}`,
    `仓位：${entry.size}`,
    `为什么现在：${entry.thesis}`,
    `估值纪律：${entry.valuation}`,
    `最大风险：${entry.risk}`,
    `证伪条件：${entry.invalidation}`,
  ].join("\n");
}

function downloadCsv(entries: TradeEntry[]) {
  const fields: Array<keyof TradeEntry> = [
    "date",
    "action",
    "ticker",
    "price",
    "size",
    "thesis",
    "valuation",
    "risk",
    "invalidation",
  ];
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [fields.join(","), ...entries.map((entry) => fields.map((field) => quote(entry[field])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `投资决策日志-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [trade, setTrade] = useState<TradeEntry>(defaultTrade);
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [activeTicker, setActiveTicker] = useState("GOOGL");
  const [weeklyNotes, setWeeklyNotes] = useState("本周只在高确定性资产出现安全边际时行动；没有好价格，现金也是仓位。");
  const [syncState, setSyncState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("正在同步个人决策日志…");

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/trades"), fetch("/api/settings")])
      .then(async ([tradesResponse, settingsResponse]) => {
        if (!tradesResponse.ok || !settingsResponse.ok) throw new Error("sync failed");
        const tradeData = (await tradesResponse.json()) as { entries: TradeEntry[] };
        const settingsData = (await settingsResponse.json()) as { weeklyNotes?: string };
        if (!active) return;
        setEntries(tradeData.entries);
        if (settingsData.weeklyNotes) setWeeklyNotes(settingsData.weeklyNotes);
        setSyncState("ready");
        setMessage("决策日志已云端同步");
      })
      .catch(() => {
        if (!active) return;
        setSyncState("error");
        setMessage("暂时无法连接云端，请稍后重试");
      });
    return () => {
      active = false;
    };
  }, []);

  const ranked = useMemo(() => [...watchlist].sort((a, b) => score(b) - score(a)), []);
  const active = watchlist.find((item) => item.ticker === activeTicker) ?? ranked[0];
  const generatedReason = buildReason(trade);
  const buyZoneCount = watchlist.filter((item) => item.action === "Buy zone").length;
  const waitCount = watchlist.filter((item) => item.action === "Wait").length;
  const allGatesPassed = (Object.keys(gateLabels) as GateKey[]).every((gate) => trade.gates.includes(gate));
  const canSave = trade.action === "不行动" || allGatesPassed;

  const weeklySummary = [
    `本周动作：共记录 ${entries.length} 笔决策，其中 ${entries.filter((entry) => entry.action === "买入" || entry.action === "加仓").length} 笔增加风险敞口。`,
    `观察池：买入研究区 ${buyZoneCount} 个，等待价格 ${waitCount} 个。当前优先研究 ${ranked[0].ticker}，策略分 ${score(ranked[0])}/100。`,
    "纪律：先确认商业确定性与安全边际，再决定仓位；任何开单必须写清证伪条件。",
    `本周主观判断：${weeklyNotes}`,
  ].join("\n\n");

  function updateTrade(field: keyof TradeEntry, value: string) {
    setTrade((current) => ({ ...current, [field]: value }));
  }

  function toggleGate(gate: GateKey) {
    setTrade((current) => ({
      ...current,
      gates: current.gates.includes(gate)
        ? current.gates.filter((item) => item !== gate)
        : [...current.gates, gate],
    }));
  }

  function useAsTicket() {
    setTrade((current) => ({
      ...current,
      ticker: active.ticker,
      thesis: active.thesis,
      risk: active.risk,
      valuation: `策略估值分 ${active.valuation}/100；只有在目标回报率与安全边际同时满足时执行。`,
      invalidation: active.risk,
    }));
    document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" });
  }

  async function saveTrade() {
    if (!canSave || syncState === "saving") return;
    setSyncState("saving");
    setMessage("正在保存决策证据…");
    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(trade),
      });
      if (!response.ok) throw new Error("save failed");
      const saved = (await response.json()) as TradeEntry;
      setEntries((current) => [saved, ...current]);
      setSyncState("ready");
      setMessage("已保存：以后可以用结果检验当时的判断");
    } catch {
      setSyncState("error");
      setMessage("保存失败，内容仍保留在表单中");
    }
  }

  async function deleteTrade(id: string) {
    const response = await fetch(`/api/trades?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  async function saveWeeklyNotes() {
    setSyncState("saving");
    setMessage("正在保存周报判断…");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weeklyNotes }),
      });
      if (!response.ok) throw new Error("save failed");
      setSyncState("ready");
      setMessage("周报判断已保存");
    } catch {
      setSyncState("error");
      setMessage("周报判断保存失败，请稍后重试");
    }
  }

  async function copyReason() {
    await navigator.clipboard.writeText(generatedReason);
    setMessage("开单理由已复制");
  }

  return (
    <main>
      <section className="hero-shell">
        <nav className="topbar" aria-label="主导航">
          <a className="brand" href="#top" aria-label="回到顶部">
            <span className="brand-mark">IV</span>
            <span>
              <strong>INVESTOR OS</strong>
              <small>个人价值投资决策台</small>
            </span>
          </a>
          <div className="nav-actions">
            <span className={`sync-status ${syncState}`}><i />{message}</span>
            <a href="#trade">写开单理由</a>
            <a href="#weekly">看本周报告</a>
          </div>
        </nav>

        <div className="hero-grid" id="top">
          <section className="decision-panel" aria-labelledby="today-title">
            <p className="eyebrow">TODAY'S DEFAULT</p>
            <div className="decision-title-row">
              <h1 id="today-title">先不行动。</h1>
              <span className="date-chip">{new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date())}</span>
            </div>
            <p className="decision-copy">
              除非行业龙头、商业确定性、安全边际和仓位上限同时成立。错过机会不会伤害组合，失去纪律会。
            </p>
            <div className="signal-row">
              <div><span>可研究买入</span><strong>{buyZoneCount}</strong><small>先验证，不追价</small></div>
              <div><span>等待价格</span><strong>{waitCount}</strong><small>好公司 ≠ 好价格</small></div>
              <div><span>本周决策</span><strong>{entries.length}</strong><small>包括“不行动”</small></div>
            </div>
            <div className="principle-strip">
              <span>01 只投龙头</span><span>02 看十年现金流</span><span>03 分批建仓</span><span>04 先写证伪</span>
            </div>
          </section>

          <aside className="allocation-panel" aria-labelledby="allocation-title">
            <p className="eyebrow">PORTFOLIO GUARDRAILS</p>
            <h2 id="allocation-title">组合护栏</h2>
            <div className="allocation-visual" aria-label="目标仓位区间">
              <span className="core" style={{ flex: 68 }}>龙头股</span>
              <span className="bitcoin" style={{ flex: 12 }}>BTC</span>
              <span className="cash" style={{ flex: 20 }}>现金</span>
            </div>
            <div className="allocation-list">
              <div><span>核心龙头股</span><strong>60–75%</strong></div>
              <div><span>Bitcoin</span><strong>5–15%</strong></div>
              <div><span>机会现金</span><strong>10–25%</strong></div>
            </div>
            <div className="risk-note">
              <span>硬规则</span>
              <p>单一公司原则上不超过 15%；BTC 不超过 15%；新仓分 3–4 次进入。</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-shell" aria-labelledby="watch-title">
        <div className="section-heading">
          <div><p className="eyebrow">QUALITY × PRICE</p><h2 id="watch-title">候选资产优先级</h2></div>
          <p>质量 68% · 估值 22% · 趋势 10% <span>策略基线，非实时行情</span></p>
        </div>
        <div className="watch-grid">
          {ranked.map((item, index) => (
            <button
              className={`asset-card ${activeTicker === item.ticker ? "is-active" : ""}`}
              key={item.ticker}
              onClick={() => setActiveTicker(item.ticker)}
              type="button"
            >
              <span className="rank">0{index + 1}</span>
              <span className="asset-topline"><strong>{item.ticker}</strong><em>{score(item)}</em></span>
              <span className="asset-name">{item.name}</span>
              <span className="asset-meta">{item.className}</span>
              <span className={`pill ${item.action.toLowerCase().replace(" ", "-")}`}>{recommendation(item)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-shell detail-grid">
        <article className="detail-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">CURRENT FOCUS</p><h2>{active.ticker} <span>/ {active.name}</span></h2></div>
            <button className="secondary-button" onClick={useAsTicket} type="button">带入开单表</button>
          </div>
          <p className="lead">{active.thesis}</p>
          <div className="score-bars">
            {([
              ["护城河", active.moat], ["确定性", active.certainty], ["估值", active.valuation],
              ["资产负债", active.balance], ["趋势", active.momentum],
            ] as [string, number][]).map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span><div className="bar-track"><div style={{ width: `${value}%` }} /></div><strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-panel thesis-panel">
          <p className="eyebrow">ACTION MEMO</p>
          <div className="action-score"><h2>{recommendation(active)}</h2><strong>{active.targetWeight}</strong></div>
          <dl>
            <div><dt>进入条件</dt><dd>{active.trigger}</dd></div>
            <div><dt>反方论点</dt><dd>{active.risk}</dd></div>
            <div><dt>行动方式</dt><dd>满足条件后只开 1/4 计划仓位；下一次加仓必须重新通过五道门。</dd></div>
          </dl>
        </article>
      </section>

      <section className="section-shell trade-section" id="trade">
        <div className="section-heading">
          <div><p className="eyebrow">PRE-COMMITMENT</p><h2>开单前，先证明这不是冲动</h2></div>
          <p>五道门未全部通过，就不能保存买入理由。</p>
        </div>
        <div className="trade-grid">
          <form className="ticket-panel" onSubmit={(event) => event.preventDefault()}>
            <div className="compact-fields">
              <label>日期<input type="date" value={trade.date} onChange={(event) => updateTrade("date", event.target.value)} /></label>
              <label>标的<select value={trade.ticker} onChange={(event) => updateTrade("ticker", event.target.value)}>{watchlist.map((item) => <option key={item.ticker}>{item.ticker}</option>)}</select></label>
              <label>动作<select value={trade.action} onChange={(event) => updateTrade("action", event.target.value)}><option>买入</option><option>加仓</option><option>减仓</option><option>不行动</option></select></label>
              <label>仓位<input value={trade.size} onChange={(event) => updateTrade("size", event.target.value)} /></label>
              <label>价格<input placeholder="可留空" value={trade.price} onChange={(event) => updateTrade("price", event.target.value)} /></label>
            </div>
            <label>为什么是它，为什么是现在？<textarea value={trade.thesis} onChange={(event) => updateTrade("thesis", event.target.value)} /></label>
            <label>估值纪律 / 预期回报<textarea value={trade.valuation} onChange={(event) => updateTrade("valuation", event.target.value)} /></label>
            <div className="split-fields">
              <label>最大风险<textarea value={trade.risk} onChange={(event) => updateTrade("risk", event.target.value)} /></label>
              <label>什么事实会证明我错了？<textarea value={trade.invalidation} onChange={(event) => updateTrade("invalidation", event.target.value)} /></label>
            </div>
          </form>

          <aside className="commitment-panel">
            <p className="eyebrow">FIVE GATES</p>
            <h3>开单检查</h3>
            <div className="gate-list">
              {(Object.keys(gateLabels) as GateKey[]).map((gate, index) => (
                <label className={trade.gates.includes(gate) ? "checked" : ""} key={gate}>
                  <input type="checkbox" checked={trade.gates.includes(gate)} onChange={() => toggleGate(gate)} />
                  <span>{index + 1}</span><strong>{gateLabels[gate]}</strong>
                </label>
              ))}
            </div>
            <div className="reason-output"><pre>{generatedReason}</pre></div>
            <div className="button-row">
              <button className="ghost-button" onClick={copyReason} type="button">复制理由</button>
              <button className="primary-button" disabled={!canSave || syncState === "saving"} onClick={saveTrade} type="button">
                {canSave ? "保存决策证据" : `还差 ${5 - trade.gates.length} 道门`}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="report-shell" id="weekly">
        <div className="section-shell">
          <div className="section-heading light-heading">
            <div><p className="eyebrow">WEEKLY REVIEW</p><h2>把结果和当时的理由放在一起</h2></div>
            <div className="schedule-badge"><i />每周日 21:00 · Asia/Shanghai</div>
          </div>
          <div className="weekly-grid">
            <article className="weekly-panel">
              <div className="report-meta"><span>自动总结草稿</span><span>{new Date().getFullYear()} / WEEKLY</span></div>
              <pre>{weeklySummary}</pre>
              <label>本周主观判断<textarea aria-label="本周主观判断" value={weeklyNotes} onChange={(event) => setWeeklyNotes(event.target.value)} /></label>
              <button className="paper-button" onClick={saveWeeklyNotes} type="button">保存到下次周报</button>
            </article>
            <article className="log-panel">
              <div className="log-heading"><div><p className="eyebrow">DECISION LEDGER</p><h3>近期决策</h3></div><button disabled={entries.length === 0} onClick={() => downloadCsv(entries)} type="button">导出 CSV</button></div>
              {entries.length === 0 ? (
                <div className="empty-state"><span>0</span><p>你的第一条决策证据会出现在这里。把“不行动”也记下来，它同样是决策。</p></div>
              ) : entries.map((entry) => (
                <div className="log-item" key={entry.id}>
                  <span>{entry.date} · {entry.action}</span><strong>{entry.ticker}</strong><em>{entry.size}</em>
                  <p>{entry.thesis}</p><button onClick={() => deleteTrade(entry.id)} type="button">删除</button>
                </div>
              ))}
            </article>
          </div>
        </div>
      </section>

      <footer>
        <div><strong>INVESTOR OS</strong><span>纪律先于观点，证据先于行动。</span></div>
        <p>这是个人研究与决策记录工具，不构成投资建议。评分是可编辑的策略基线，不代表实时估值或收益承诺。</p>
      </footer>
    </main>
  );
}
