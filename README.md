# SwarmTracker

自分の Swarm チェックインから「いまどこにいるか」を Web 上に表示する。  
公開表示は管理者が On/Off でき、Swarm 上で private なチェックインは出さない。

設計の詳細は [docs/DESIGN.md](docs/DESIGN.md) を参照。

## Stack

- Next.js (App Router) on Vercel
- Upstash Redis / Vercel KV（On/Off のみ）
- Foursquare / Swarm API（サーバ側のみ）

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

`.env.example` をコピーして `.env.local` を作成する。


| 変数                       | 用途                                |
| ------------------------ | --------------------------------- |
| `FOURSQUARE_OAUTH_TOKEN` | Swarm API                         |
| `ADMIN_TOKEN`            | `/admin` Unlock と `POST /api/visibility` |
| `KV_REST_API_URL`        | Vercel KV / Upstash REST URL      |
| `KV_REST_API_TOKEN`      | Vercel KV / Upstash REST token    |


`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` でも可。

### 3. Foursquare / Swarm token

1. [Foursquare Developer](https://foursquare.com/developers) でアプリを作成
2. OAuth で自分のアカウントに認可し、access token を取得
3. その token を `FOURSQUARE_OAUTH_TOKEN` に設定（アプリ内 OAuth UI は無し）

### 4. Vercel KV / Upstash

1. Vercel プロジェクトに KV（Upstash Redis）を接続する
  または Upstash コンソールで Redis を作成し REST URL / TOKEN を取得
2. 上記 KV 環境変数を設定
3. 未設定時・未書き込み時の公開状態は **off**（安全側）

### 5. Run locally

```bash
npm run dev
```

- `/` — Stack ウィジェット
- `/embed` — 埋め込み（`?variant=stack` 既定 / `?variant=compact`）
- `/admin` — On/Off 管理（Unlock で Bearer トークンを保持）
- `GET /api/presence` — 公開 API
- `POST /api/visibility` — 管理 API（`Authorization: Bearer ${ADMIN_TOKEN}`、失敗時は IP あたり試行制限あり）

ローカルで KV が無い場合、`/api/presence` は **Away（disabled）** を返す。  
`POST /api/visibility` は KV 必須のため失敗する。

```bash
npm run build
```

ビルド自体は env 無しでも通る想定。ランタイム表示・切替には env が必要。

## Deploy (Vercel)

1. リポジトリを Vercel にインポート
2. Env に `FOURSQUARE_OAUTH_TOKEN` / `ADMIN_TOKEN` / KV 変数を設定
3. KV ストレージをプロジェクトにリンク
4. Deploy

## Docs

- [docs/DESIGN.md](docs/DESIGN.md) — アーキテクチャ・API・プライバシー
- [docs/WIDGET.md](docs/WIDGET.md) — UI 文言・レイアウト
- [docs/widget-mockup.html](docs/widget-mockup.html) — 見た目モック
