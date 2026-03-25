# FitSocial

結構化運動紀錄社群平台 - 以「結構化運動紀錄」為核心的社群平台，透過「課表學習」與「目標諮詢」建立高互動性的運動社群。

## ✨ 功能特色

- 🏃 **結構化紀錄系統** - 有氧 (LSD、間歇、配速跑) 與肌力訓練記錄
- 💪 **低摩擦輸入** - 以標籤選擇與滑桿取代大量文字輸入
- 🔐 **Google 登入** - 安全的 OAuth 2.0 認證
- 📚 **課表學習** - 一鍵將他人的運動紀錄存為訓練範本
- 🔥 **連勝天數追蹤** - 激勵持續運動的遊戲化設計
- 📊 **數據可視化** - 個人訓練負荷與成長趨勢圖

## 🛠 技術棧

- **前端框架**: Next.js 16 + React 19 + TypeScript
- **樣式**: Tailwind CSS 3
- **圖標**: Lucide React
- **後端**: Supabase (PostgreSQL + Auth)
- **部署**: Vercel
- **版控**: GitHub

## 🔧 環境設定

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 建立新專案
2. 在 SQL Editor 中執行 `supabase/schema.sql`
3. 前往 **Authentication** → **Providers** → 啟用 **Google**

### 2. 設定 Google OAuth

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立 OAuth 2.0 Client ID
3. 在 Supabase **Authentication** → **URL Configuration** 設定：
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. 複製 Google Client ID 和 Client Secret 到 Supabase

### 3. 設定環境變數

複製 `.env.local.example` 為 `.env.local` 並填入：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
│   ├── app/                    # Next.js App Router
│   │   ├── auth/               # 認證頁面
│   │   │   ├── callback/       # OAuth 回調
│   │   │   └── login/          # 登入頁面
│   │   ├── layout.tsx          # 根佈局
│   │   ├── page.tsx            # 首頁
│   │   └── globals.css         # 全域樣式
│   ├── components/             # React 元件
│   │   └── auth/               # 認證相關元件
│   ├── contexts/               # React Context
│   │   └── AuthContext.tsx     # 認證狀態管理
│   ├── hooks/                  # 自定義 Hooks
│   │   └── updateSession.ts    # Session 更新
│   ├── lib/
│   │   ├── api/               # API 函數
│   │   └── supabase/          # Supabase 客戶端
│   └── middleware.ts           # 路由守衛
├── supabase/
│   └── schema.sql              # 資料庫結構
├── .env.local                  # 環境變數
└── package.json
```

## 🎨 設計原則

根據 FitSocial 系統設計文件 (SD)：

- **視覺語言**: 大量使用 Rounded-2xl 以上的圓角，營造親和力
- **操作優先**: 三點完成任何運動紀錄（選類型 → 選強度 → 填數值）
- **無文字區**: 心得紀錄設為選填，預設提供多組 Emoji 快選
- **反饋機制**: 運動完畢後的「數據摘要卡片」具備高度視覺美感

## 📝 資料庫 Schema

### profiles
| 欄位 | 類型 | 描述 |
|------|------|------|
| id | UUID | 用戶 ID |
| username | String | 用戶名 |
| avatar_url | String | 頭像 URL |
| following | Array | 關注列表 |
| streak_count | Int | 連勝天數 |

### workout_logs
| 欄位 | 類型 | 描述 |
|------|------|------|
| id | UUID | 紀錄 ID |
| user_id | UUID | 關聯用戶 |
| type | Enum | aerobic / strength |
| category | String | 項目類別 |
| intensity | Enum | easy / moderate / hard |
| details | JSONB | 結構化數據 |
| is_template | Boolean | 是否為範本 |
| likes | Int | 按讚數 |
| shares | Int | 分享數 |

## 📝 License

ISC
