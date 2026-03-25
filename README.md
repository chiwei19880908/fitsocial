# FitSocial

結構化運動紀錄社群平台 - 以「結構化運動紀錄」為核心的社群平台，透過「課表學習」與「目標諮詢」建立高互動性的運動社群。

## ✨ 功能特色

- 🏃 **結構化紀錄系統** - 有氧 (LSD、間歇、配速跑) 與肌力訓練記錄
- 💪 **低摩擦輸入** - 以標籤選擇與滑桿取代大量文字輸入
- 📚 **課表學習** - 一鍵將他人的運動紀錄存為訓練範本
- 🔥 **連勝天數追蹤** - 激勵持續運動的遊戲化設計
- 📊 **數據可視化** - 個人訓練負荷與成長趨勢圖

## 🛠 技術棧

- **前端框架**: Next.js 16 + React 19
- **樣式**: Tailwind CSS 3
- **圖標**: Lucide React
- **部署**: Vercel
- **版控**: GitHub

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建構生產版本
npm run build

# 啟動生產伺服器
npm start
```

## 📁 專案結構

```
fitsocial/
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── layout.tsx # 根佈局
│   │   ├── page.tsx   # 首頁
│   │   └── globals.css # 全域樣式
│   └── components/    # React 元件
├── public/             # 靜態資源
├── tailwind.config.ts  # Tailwind 配置
└── package.json        # 專案依賴
```

## 🎨 設計原則

根據 FitSocial 系統設計文件 (SD)：

- **視覺語言**: 大量使用 Rounded-2xl 以上的圓角，營造親和力
- **操作優先**: 三點完成任何運動紀錄（選類型 → 選強度 → 填數值）
- **無文字區**: 心得紀錄設為選填，預設提供多組 Emoji 快選
- **反饋機制**: 運動完畢後的「數據摘要卡片」具備高度視覺美感

## 📝 License

ISC
