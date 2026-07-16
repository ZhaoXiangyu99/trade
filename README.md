# Trade · Investor OS

个人美股与 BTC 价值投资决策网站，用于管理自选分组、建立研究档案、记录开单理由并生成每周复盘。

线上私人站点：<https://value-invest-cockpit.zhaoxiangyu002.chatgpt.site>

## 核心功能

- 按 Longbridge 自选分组展示关注标的
- 用护城河、确定性、估值、资产负债和趋势建立研究档案
- 开单前完成五道纪律检查并写明证伪条件
- 将交易决策与周报备注保存到云端数据库
- 导出个人交易决策日志

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

验证构建：

```bash
npm test
```

## 主要目录

- `app/page.tsx`：投资决策工作台
- `app/globals.css`：网站视觉样式
- `app/api/`：交易日志与设置接口
- `db/schema.ts`：D1 数据库结构
- `.openai/hosting.json`：Sites 部署配置

## 数据说明

Longbridge 分组是同步时的账户自选快照，不代表实时行情或买入建议。网站用于个人研究和决策记录，不构成投资建议。
