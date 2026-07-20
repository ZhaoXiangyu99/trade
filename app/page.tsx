"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type AccountSecurity = {
  ticker: string;
  name: string;
};

type AccountGroup = {
  id: string;
  name: string;
  securities: AccountSecurity[];
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

type PortfolioPosition = {
  ticker: string;
  name: string;
  assetClass: "stock" | "btc";
  quantity: string;
  averageCost: string;
  currentPrice: string;
  targetWeight: string;
};

type PortfolioSnapshot = {
  cashBalance: string;
  positions: PortfolioPosition[];
  updatedAt?: string;
};

type GateKey = "leader" | "understood" | "margin" | "sizing" | "invalidation";

type MvrvPoint = { date: string; value: number };

type MvrvData = {
  status: "ready";
  zScore: number;
  marketCap: number;
  realizedCap: number;
  updatedAt: string;
  history: MvrvPoint[];
  source: { name: string; url: string; methodology: string };
};

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

const accountGroups: AccountGroup[] = [
  {
    id: "technology",
    name: "科技",
    securities: [
      { ticker: "SPCX", name: "SpaceX" },
      { ticker: "NVDA", name: "NVIDIA" },
      { ticker: "GOOGL", name: "Alphabet" },
      { ticker: "AMZN", name: "Amazon" },
      { ticker: "AAPL", name: "Apple" },
      { ticker: "TSLA", name: "Tesla" },
      { ticker: "META", name: "Meta Platforms" },
      { ticker: "MSFT", name: "Microsoft" },
    ],
  },
  {
    id: "crypto",
    name: "加密货币",
    securities: [
      { ticker: "BMNR", name: "BitMine Immersion Tech" },
      { ticker: "CRCL", name: "Circle" },
      { ticker: "MSTR", name: "Strategy" },
      { ticker: "COIN", name: "Coinbase" },
      { ticker: "MARA", name: "Mara" },
    ],
  },
  {
    id: "semiconductor",
    name: "半导体",
    securities: [
      { ticker: "SOXL", name: "Direxion Semicon Bull 3X" },
      { ticker: "TSM", name: "Taiwan Semiconductor" },
      { ticker: "AMD", name: "AMD" },
      { ticker: "INTC", name: "Intel" },
    ],
  },
  {
    id: "finance",
    name: "金融",
    securities: [
      { ticker: "BRK.B", name: "Berkshire Hathaway B" },
      { ticker: "HOOD", name: "Robinhood" },
      { ticker: "BAC", name: "Bank of America" },
      { ticker: "JPM", name: "JPMorgan Chase" },
      { ticker: "SOFI", name: "SoFi Tech" },
    ],
  },
  {
    id: "storage",
    name: "存储",
    securities: [
      { ticker: "SNDK", name: "Sandisk" },
      { ticker: "MU", name: "Micron Tech" },
      { ticker: "DRAM", name: "Roundhill Memory ETF" },
    ],
  },
];

const accountSecurities = accountGroups.flatMap((group) =>
  group.securities.map((security) => ({ ...security, groupId: group.id, groupName: group.name })),
);

const tradeSecurities = [
  ...accountSecurities,
  { ticker: "BTC", name: "Bitcoin", groupId: "core", groupName: "策略核心" },
  { ticker: "COST", name: "Costco", groupId: "research", groupName: "研究档案" },
].filter((security, index, collection) => collection.findIndex((item) => item.ticker === security.ticker) === index);

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

function formatUsd(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function mvrvRegime(value: number) {
  if (value < 0) return { label: "历史低估区", tone: "opportunity", note: "市场市值低于已实现价值，仍需结合仓位纪律验证。" };
  if (value >= 7) return { label: "历史过热区", tone: "risk", note: "估值偏离达到历史极端，优先审视风险和仓位。" };
  if (value >= 3.5) return { label: "偏热观察区", tone: "caution", note: "链上未实现利润偏高，避免仅凭动量追价。" };
  return { label: "常态区间", tone: "neutral", note: "尚未进入经典周期极值区，不构成单独行动信号。" };
}

function MvrvChart({ points }: { points: MvrvPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;
    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
      canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      const width = bounds.width;
      const height = bounds.height;
      const padding = { top: 18, right: 12, bottom: 24, left: 34 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const minY = Math.min(-0.5, ...points.map((point) => point.value));
      const maxY = Math.max(7.5, ...points.map((point) => point.value));
      const x = (index: number) => padding.left + (index / (points.length - 1)) * chartWidth;
      const y = (value: number) => padding.top + ((maxY - value) / (maxY - minY)) * chartHeight;

      context.clearRect(0, 0, width, height);
      context.font = "11px Arial";
      context.textAlign = "right";
      [0, 3.5, 7].forEach((level) => {
        const lineY = y(level);
        context.strokeStyle = level === 7 ? "rgba(216,134,115,.55)" : level === 0 ? "rgba(134,185,143,.5)" : "rgba(150,158,152,.22)";
        context.setLineDash(level === 3.5 ? [4, 5] : []);
        context.beginPath();
        context.moveTo(padding.left, lineY);
        context.lineTo(width - padding.right, lineY);
        context.stroke();
        context.fillStyle = "#8f9992";
        context.fillText(String(level), padding.left - 7, lineY + 4);
      });
      context.setLineDash([]);

      const gradient = context.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, "rgba(214,179,106,.28)");
      gradient.addColorStop(1, "rgba(214,179,106,0)");
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(x(index), y(point.value));
        else context.lineTo(x(index), y(point.value));
      });
      context.lineTo(x(points.length - 1), height - padding.bottom);
      context.lineTo(x(0), height - padding.bottom);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();

      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(x(index), y(point.value));
        else context.lineTo(x(index), y(point.value));
      });
      context.strokeStyle = "#d6b36a";
      context.lineWidth = 2;
      context.lineJoin = "round";
      context.stroke();

      const last = points.at(-1)!;
      context.beginPath();
      context.arc(x(points.length - 1), y(last.value), 4, 0, Math.PI * 2);
      context.fillStyle = "#f2efe7";
      context.fill();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [points]);

  return <canvas ref={canvasRef} role="img" aria-label="Bitcoin MVRV Z-Score 最近 365 天走势图，参考线为 0、3.5 和 7" />;
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function Home() {
  const [trade, setTrade] = useState<TradeEntry>(defaultTrade);
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot>({ cashBalance: "", positions: [] });
  const [nextPositionTicker, setNextPositionTicker] = useState("BRK.B");
  const [activeGroupId, setActiveGroupId] = useState("technology");
  const [activeTicker, setActiveTicker] = useState("GOOGL");
  const [weeklyNotes, setWeeklyNotes] = useState("本周只在高确定性资产出现安全边际时行动；没有好价格，现金也是仓位。");
  const [syncState, setSyncState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("正在同步个人决策日志…");
  const [mvrvData, setMvrvData] = useState<MvrvData | null>(null);
  const [mvrvState, setMvrvState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/trades"), fetch("/api/settings"), fetch("/api/portfolio")])
      .then(async ([tradesResponse, settingsResponse, portfolioResponse]) => {
        if (!tradesResponse.ok || !settingsResponse.ok || !portfolioResponse.ok) throw new Error("sync failed");
        const tradeData = (await tradesResponse.json()) as { entries: TradeEntry[] };
        const settingsData = (await settingsResponse.json()) as { weeklyNotes?: string };
        const portfolioData = (await portfolioResponse.json()) as PortfolioSnapshot;
        if (!active) return;
        setEntries(tradeData.entries);
        setPortfolio(portfolioData);
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

  useEffect(() => {
    let active = true;
    fetch("/api/crypto/mvrv-z")
      .then(async (response) => {
        if (!response.ok) throw new Error("mvrv unavailable");
        return (await response.json()) as MvrvData;
      })
      .then((data) => {
        if (!active) return;
        setMvrvData(data);
        setMvrvState("ready");
      })
      .catch(() => {
        if (active) setMvrvState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const ranked = useMemo(() => [...watchlist].sort((a, b) => score(b) - score(a)), []);
  const activeGroup = accountGroups.find((group) => group.id === activeGroupId) ?? accountGroups[0];
  const activeSecurity = accountSecurities.find((item) => item.ticker === activeTicker) ?? accountSecurities[0];
  const activeProfile = watchlist.find((item) => item.ticker === activeTicker);
  const generatedReason = buildReason(trade);
  const buyZoneCount = watchlist.filter((item) => item.action === "Buy zone").length;
  const waitCount = watchlist.filter((item) => item.action === "Wait").length;
  const accountSecurityCount = accountSecurities.length;
  const allGatesPassed = (Object.keys(gateLabels) as GateKey[]).every((gate) => trade.gates.includes(gate));
  const canSave = trade.action === "不行动" || allGatesPassed;
  const mvrvSignal = mvrvData ? mvrvRegime(mvrvData.zScore) : null;
  const portfolioRows = portfolio.positions.map((position) => {
    const marketValue = numberValue(position.quantity) * numberValue(position.currentPrice);
    const costValue = numberValue(position.quantity) * numberValue(position.averageCost);
    return { ...position, marketValue, costValue, pnl: marketValue - costValue };
  });
  const investedValue = portfolioRows.reduce((sum, position) => sum + position.marketValue, 0);
  const cashValue = numberValue(portfolio.cashBalance);
  const portfolioValue = investedValue + cashValue;
  const stockValue = portfolioRows.filter((position) => position.assetClass === "stock").reduce((sum, position) => sum + position.marketValue, 0);
  const bitcoinValue = portfolioRows.filter((position) => position.assetClass === "btc").reduce((sum, position) => sum + position.marketValue, 0);
  const stockWeight = portfolioValue ? (stockValue / portfolioValue) * 100 : 0;
  const bitcoinWeight = portfolioValue ? (bitcoinValue / portfolioValue) * 100 : 0;
  const cashWeight = portfolioValue ? (cashValue / portfolioValue) * 100 : 0;
  const totalPnl = portfolioRows.reduce((sum, position) => sum + position.pnl, 0);
  const largestCompanyWeight = portfolioValue
    ? Math.max(0, ...portfolioRows.filter((position) => position.assetClass === "stock").map((position) => (position.marketValue / portfolioValue) * 100))
    : 0;
  const allocationAlerts = [
    largestCompanyWeight > 15 ? `最大单一公司仓位 ${formatPercent(largestCompanyWeight)}，超过 15% 护栏` : "",
    bitcoinWeight > 15 ? `BTC 仓位 ${formatPercent(bitcoinWeight)}，超过 15% 护栏` : "",
    portfolioValue && (cashWeight < 10 || cashWeight > 25) ? `现金仓位 ${formatPercent(cashWeight)}，偏离 10–25% 区间` : "",
  ].filter(Boolean);

  const weeklySummary = [
    `本周动作：共记录 ${entries.length} 笔决策，其中 ${entries.filter((entry) => entry.action === "买入" || entry.action === "加仓").length} 笔增加风险敞口。`,
    `观察池：Longbridge 自选包含 ${accountGroups.length} 个分组、${accountSecurityCount} 个标的；其中 ${watchlist.filter((item) => accountSecurities.some((security) => security.ticker === item.ticker)).length} 个已有个人研究档案。`,
    `组合实况：总资产 ${formatMoney(portfolioValue)}，股票 ${formatPercent(stockWeight)}，BTC ${formatPercent(bitcoinWeight)}，现金 ${formatPercent(cashWeight)}。`,
    `策略基线：买入研究区 ${buyZoneCount} 个，等待价格 ${waitCount} 个。当前优先研究 ${ranked[0].ticker}，策略分 ${score(ranked[0])}/100。`,
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
      ticker: activeSecurity.ticker,
      thesis: activeProfile?.thesis ?? "先写清这家公司如何赚钱、竞争优势是否可持续，以及为什么现在值得研究。",
      risk: activeProfile?.risk ?? "待补充：最可能导致长期投资逻辑失效的风险。",
      valuation: activeProfile
        ? `策略估值分 ${activeProfile.valuation}/100；只有在目标回报率与安全边际同时满足时执行。`
        : "待补充：基于正常化自由现金流、合理增长率与保守退出估值计算安全边际。",
      invalidation: activeProfile?.risk ?? "待补充：写出一个可验证、会证明当前判断错误的事实。",
      gates: [],
    }));
    document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" });
  }

  function selectGroup(group: AccountGroup) {
    setActiveGroupId(group.id);
    setActiveTicker(group.securities[0]?.ticker ?? "GOOGL");
  }

  function addPosition() {
    if (portfolio.positions.some((position) => position.ticker === nextPositionTicker)) {
      setMessage(`${nextPositionTicker} 已在持仓中`);
      return;
    }
    const security = tradeSecurities.find((item) => item.ticker === nextPositionTicker);
    if (!security) return;
    setPortfolio((current) => ({
      ...current,
      positions: [...current.positions, {
        ticker: security.ticker,
        name: security.name,
        assetClass: security.ticker === "BTC" ? "btc" : "stock",
        quantity: "",
        averageCost: "",
        currentPrice: "",
        targetWeight: "",
      }],
    }));
  }

  function updatePosition(ticker: string, field: keyof PortfolioPosition, value: string) {
    setPortfolio((current) => ({
      ...current,
      positions: current.positions.map((position) => position.ticker === ticker ? { ...position, [field]: value } : position),
    }));
  }

  function removePosition(ticker: string) {
    setPortfolio((current) => ({ ...current, positions: current.positions.filter((position) => position.ticker !== ticker) }));
  }

  async function savePortfolio() {
    setSyncState("saving");
    setMessage("正在保存组合实况…");
    try {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(portfolio),
      });
      if (!response.ok) throw new Error("save failed");
      setPortfolio((await response.json()) as PortfolioSnapshot);
      setSyncState("ready");
      setMessage("组合持仓与现金已云端同步");
    } catch {
      setSyncState("error");
      setMessage("组合保存失败，输入仍保留在页面中");
    }
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
            <a href="#crypto">看 BTC 链上</a>
            <a href="#portfolio">组合实况</a>
            <a href="#trade">写开单理由</a>
            <a href="#crypto">BTC 链上</a>
            <a href="#weekly">看本周报告</a>
          </div>
        </nav>

        <div className="hero-grid" id="top">
          <section className="decision-panel" aria-labelledby="today-title">
            <p className="eyebrow">TODAY&apos;S DEFAULT</p>
            <div className="decision-title-row">
              <h1 id="today-title">先不行动。</h1>
              <span className="date-chip">{new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", timeZone: "Asia/Shanghai" }).format(new Date())}</span>
            </div>
            <p className="decision-copy">
              除非行业龙头、商业确定性、安全边际和仓位上限同时成立。错过机会不会伤害组合，失去纪律会。
            </p>
            <div className="signal-row">
              <div><span>可研究买入</span><strong>{buyZoneCount}</strong><small>先验证，不追价</small></div>
              <div><span>自选分组</span><strong>{accountGroups.length}</strong><small>{accountSecurityCount} 个关注标的</small></div>
              <div><span>本周决策</span><strong>{entries.length}</strong><small>包括“不行动”</small></div>
            </div>
            <div className="principle-strip">
              <span>01 只投龙头</span><span>02 看十年现金流</span><span>03 分批建仓</span><span>04 先写证伪</span>
            </div>
          </section>

          <aside className="allocation-panel" aria-labelledby="allocation-title">
            <p className="eyebrow">PORTFOLIO GUARDRAILS</p>
            <h2 id="allocation-title">组合护栏</h2>
            <div className="allocation-visual" aria-label={portfolioValue ? "当前仓位" : "目标仓位示例"}>
              <span className="core" style={{ flex: portfolioValue ? Math.max(stockWeight, 0.1) : 68 }}>龙头股</span>
              <span className="bitcoin" style={{ flex: portfolioValue ? Math.max(bitcoinWeight, 0.1) : 12 }}>BTC</span>
              <span className="cash" style={{ flex: portfolioValue ? Math.max(cashWeight, 0.1) : 20 }}>现金</span>
            </div>
            <div className="allocation-list">
              <div><span>核心龙头股 · 目标 60–75%</span><strong>{portfolioValue ? formatPercent(stockWeight) : "待录入"}</strong></div>
              <div><span>Bitcoin · 目标 5–15%</span><strong>{portfolioValue ? formatPercent(bitcoinWeight) : "待录入"}</strong></div>
              <div><span>机会现金 · 目标 10–25%</span><strong>{portfolioValue ? formatPercent(cashWeight) : "待录入"}</strong></div>
            </div>
            <div className="risk-note">
              <span>{allocationAlerts.length ? "需要复核" : "硬规则"}</span>
              <p>{allocationAlerts[0] ?? "单一公司原则上不超过 15%；BTC 不超过 15%；新仓分 3–4 次进入。"}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-shell crypto-section" id="crypto" aria-labelledby="mvrv-title">
        <div className="section-heading">
          <div><p className="eyebrow">BITCOIN ON-CHAIN VALUATION</p><h2 id="mvrv-title">MVRV Z-Score</h2></div>
          <p>最近 365 天 · 日频 <span>链上数据通常滞后 1–2 天</span></p>
        </div>
        <div className="mvrv-grid">
          <article className="mvrv-chart-panel">
            <div className="mvrv-chart-heading">
              <div>
                <span>当前读数</span>
                <strong>{mvrvData ? mvrvData.zScore.toFixed(2) : "—"}</strong>
              </div>
              {mvrvSignal && <span className={`mvrv-regime ${mvrvSignal.tone}`}>{mvrvSignal.label}</span>}
            </div>
            <div className={`mvrv-chart ${mvrvState}`}>
              {mvrvData ? <MvrvChart points={mvrvData.history} /> : (
                <div className="mvrv-placeholder">
                  <strong>{mvrvState === "error" ? "链上数据暂不可用" : "正在读取链上数据…"}</strong>
                  <span>{mvrvState === "error" ? "不会用演示数据替代，请稍后刷新。" : "正在核对市场市值与已实现市值。"}</span>
                </div>
              )}
            </div>
            <div className="mvrv-axis-notes"><span>低估区 ≤ 0</span><span>观察线 3.5</span><span>历史过热区 ≥ 7</span></div>
          </article>

          <aside className="mvrv-context-panel">
            <p className="eyebrow">VALUATION CONTEXT</p>
            <h3>{mvrvSignal?.label ?? "等待数据"}</h3>
            <p className="mvrv-interpretation">{mvrvSignal?.note ?? "指标就绪后显示当前估值区间。"}</p>
            <dl className="mvrv-facts">
              <div><dt>市场市值</dt><dd>{mvrvData ? formatUsd(mvrvData.marketCap) : "—"}</dd></div>
              <div><dt>已实现市值</dt><dd>{mvrvData ? formatUsd(mvrvData.realizedCap) : "—"}</dd></div>
              <div><dt>数据日期</dt><dd>{mvrvData ? new Date(mvrvData.updatedAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }) : "—"}</dd></div>
            </dl>
            <div className="mvrv-formula">
              <span>经典公式</span>
              <code>(市场市值 − 已实现市值) ÷ 市场市值历史标准差</code>
            </div>
            <p className="mvrv-source">
              方法参考 TradingView 公开指标；实时序列来自 {mvrvData?.source.name ?? "BTCFunk"}。这是周期估值温度计，不是买卖信号。
            </p>
          </aside>
        </div>
      </section>

      <section className="section-shell portfolio-section" id="portfolio" aria-labelledby="portfolio-title">
        <div className="section-heading">
          <div><p className="eyebrow">PORTFOLIO REALITY</p><h2 id="portfolio-title">用真实仓位约束下一笔交易</h2></div>
          <p>价格由你手动更新，系统不把静态数据冒充实时行情。<span>{portfolio.updatedAt ? `上次保存 ${new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(portfolio.updatedAt))}` : "尚未保存组合快照"}</span></p>
        </div>

        <div className="portfolio-metrics" aria-label="组合摘要">
          <div><span>总资产</span><strong>{formatMoney(portfolioValue)}</strong><small>持仓市值 + 现金</small></div>
          <div><span>持仓盈亏</span><strong className={totalPnl < 0 ? "is-negative" : ""}>{formatMoney(totalPnl)}</strong><small>按录入成本与现价</small></div>
          <div><span>最大公司仓位</span><strong className={largestCompanyWeight > 15 ? "is-negative" : ""}>{formatPercent(largestCompanyWeight)}</strong><small>护栏 ≤ 15%</small></div>
          <div><span>现金比例</span><strong className={portfolioValue && (cashWeight < 10 || cashWeight > 25) ? "is-negative" : ""}>{formatPercent(cashWeight)}</strong><small>目标 10–25%</small></div>
        </div>

        <div className="portfolio-panel">
          <div className="portfolio-toolbar">
            <label>机会现金（USD）<input inputMode="decimal" min="0" placeholder="0" type="number" value={portfolio.cashBalance} onChange={(event) => setPortfolio((current) => ({ ...current, cashBalance: event.target.value }))} /></label>
            <div className="add-position">
              <label>添加持仓<select value={nextPositionTicker} onChange={(event) => setNextPositionTicker(event.target.value)}>{tradeSecurities.map((item) => <option key={item.ticker} value={item.ticker}>{item.ticker} · {item.name}</option>)}</select></label>
              <button className="ghost-button" onClick={addPosition} type="button">加入组合</button>
            </div>
            <button className="primary-button portfolio-save" disabled={syncState === "saving"} onClick={savePortfolio} type="button">保存组合快照</button>
          </div>

          {portfolioRows.length === 0 ? (
            <div className="portfolio-empty"><strong>先添加第一个真实持仓</strong><p>录入数量、平均成本、当前价格和目标仓位后，组合集中度、盈亏和风险提示会自动计算。</p></div>
          ) : (
            <div className="position-table-wrap">
              <table className="position-table">
                <thead><tr><th>标的</th><th>数量</th><th>平均成本</th><th>当前价格</th><th>目标仓位</th><th>当前仓位</th><th>市值 / 盈亏</th><th><span className="sr-only">操作</span></th></tr></thead>
                <tbody>{portfolioRows.map((position) => {
                  const actualWeight = portfolioValue ? (position.marketValue / portfolioValue) * 100 : 0;
                  const targetWeight = numberValue(position.targetWeight);
                  const gap = actualWeight - targetWeight;
                  return (
                    <tr key={position.ticker}>
                      <td><strong>{position.ticker}</strong><small>{position.name}</small></td>
                      <td><input aria-label={`${position.ticker} 数量`} inputMode="decimal" min="0" type="number" value={position.quantity} onChange={(event) => updatePosition(position.ticker, "quantity", event.target.value)} /></td>
                      <td><input aria-label={`${position.ticker} 平均成本`} inputMode="decimal" min="0" type="number" value={position.averageCost} onChange={(event) => updatePosition(position.ticker, "averageCost", event.target.value)} /></td>
                      <td><input aria-label={`${position.ticker} 当前价格`} inputMode="decimal" min="0" type="number" value={position.currentPrice} onChange={(event) => updatePosition(position.ticker, "currentPrice", event.target.value)} /></td>
                      <td><div className="percent-input"><input aria-label={`${position.ticker} 目标仓位`} inputMode="decimal" max="100" min="0" type="number" value={position.targetWeight} onChange={(event) => updatePosition(position.ticker, "targetWeight", event.target.value)} /><span>%</span></div></td>
                      <td><strong>{formatPercent(actualWeight)}</strong>{targetWeight > 0 && <small className={Math.abs(gap) > 2 ? "is-negative" : ""}>{gap > 0 ? "+" : ""}{formatPercent(gap)} vs 目标</small>}</td>
                      <td><strong>{formatMoney(position.marketValue)}</strong><small className={position.pnl < 0 ? "is-negative" : "is-positive"}>{position.pnl >= 0 ? "+" : ""}{formatMoney(position.pnl)}</small></td>
                      <td><button aria-label={`删除 ${position.ticker}`} className="remove-position" onClick={() => removePosition(position.ticker)} type="button">移除</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}

          {allocationAlerts.length > 0 && <div className="portfolio-alerts" role="status">{allocationAlerts.map((alert) => <span key={alert}>{alert}</span>)}</div>}
        </div>
      </section>

      <section className="section-shell" aria-labelledby="watch-title">
        <div className="section-heading">
          <div><p className="eyebrow">LONGBRIDGE WATCHLIST</p><h2 id="watch-title">我的自选分组</h2></div>
          <p>{accountGroups.length} 个分组 · {accountSecurityCount} 个标的 <span>同步于 2026-07-16 · 关注不等于买入建议</span></p>
        </div>
        <div className="group-tabs" role="tablist" aria-label="自选分组">
          {accountGroups.map((group) => (
            <button
              aria-selected={activeGroup.id === group.id}
              className={activeGroup.id === group.id ? "is-active" : ""}
              key={group.id}
              onClick={() => selectGroup(group)}
              role="tab"
              type="button"
            >
              <span>{group.name}</span><em>{group.securities.length}</em>
            </button>
          ))}
        </div>
        <div className="watch-grid">
          {activeGroup.securities.map((security, index) => {
            const profile = watchlist.find((item) => item.ticker === security.ticker);
            return (
              <button
                className={`asset-card ${activeTicker === security.ticker ? "is-active" : ""} ${profile ? "" : "is-unscored"}`}
                key={security.ticker}
                onClick={() => setActiveTicker(security.ticker)}
                type="button"
              >
                <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="asset-topline"><strong>{security.ticker}</strong><em>{profile ? score(profile) : "—"}</em></span>
                <span className="asset-name">{security.name}</span>
                <span className="asset-meta">{activeGroup.name}</span>
                <span className={`pill ${profile ? profile.action.toLowerCase().replace(" ", "-") : "unscored"}`}>
                  {profile ? recommendation(profile) : "待建立档案"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-shell detail-grid">
        <article className="detail-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">CURRENT FOCUS · {activeSecurity.groupName}</p><h2>{activeSecurity.ticker} <span>/ {activeSecurity.name}</span></h2></div>
            <button className="secondary-button" onClick={useAsTicket} type="button">带入开单表</button>
          </div>
          {activeProfile ? (
            <>
              <p className="lead">{activeProfile.thesis}</p>
              <div className="score-bars">
                {([
                  ["护城河", activeProfile.moat], ["确定性", activeProfile.certainty], ["估值", activeProfile.valuation],
                  ["资产负债", activeProfile.balance], ["趋势", activeProfile.momentum],
                ] as [string, number][]).map(([label, value]) => (
                  <div className="bar-row" key={label}>
                    <span>{label}</span><div className="bar-track"><div style={{ width: `${value}%` }} /></div><strong>{value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="unscored-state">
              <strong>已同步到自选，尚未建立研究档案</strong>
              <p>我不会因为它出现在关注列表里就自动给出评分。完成商业模式、财务质量、估值与证伪条件后，才进入优先级排序。</p>
              <span>下一步：写下三句话投资逻辑，再估算正常化自由现金流。</span>
            </div>
          )}
        </article>

        <article className="detail-panel thesis-panel">
          <p className="eyebrow">ACTION MEMO</p>
          <div className="action-score"><h2>{activeProfile ? recommendation(activeProfile) : "待研究"}</h2><strong>{activeProfile?.targetWeight ?? "—"}</strong></div>
          {activeProfile ? (
            <dl>
              <div><dt>进入条件</dt><dd>{activeProfile.trigger}</dd></div>
              <div><dt>反方论点</dt><dd>{activeProfile.risk}</dd></div>
              <div><dt>行动方式</dt><dd>满足条件后只开 1/4 计划仓位；下一次加仓必须重新通过五道门。</dd></div>
            </dl>
          ) : (
            <dl>
              <div><dt>商业质量</dt><dd>收入来源、护城河、资本回报率与周期位置尚待验证。</dd></div>
              <div><dt>估值纪律</dt><dd>没有正常化现金流与安全边际，就没有开单价格。</dd></div>
              <div><dt>当前结论</dt><dd>只观察，不行动。先建立研究档案，再讨论仓位。</dd></div>
            </dl>
          )}
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
              <label>标的<select value={trade.ticker} onChange={(event) => updateTrade("ticker", event.target.value)}>{tradeSecurities.map((item) => <option key={item.ticker} value={item.ticker}>{item.ticker} · {item.groupName}</option>)}</select></label>
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
