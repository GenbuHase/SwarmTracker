# SwarmTracker 設計書

自分の Swarm チェックインから「いまどこにいるか」を Web 上に表示する。  
公開表示は管理者が On/Off でき、Swarm 上で private なチェックインは出さない。

最終更新: 2026-07-12（UI 文言・時刻フォーマット確定後）

---

## 1. 基本設計

### 1.1 目的

- Swarm の最新チェックイン（条件付き）を Web / 埋め込みウィジェットで表示する
- 公開表示を On/Off で切り替え、Off 時は位置情報が漏れないようにする
- チェックインした**現地の絶対時刻**（例: `7/11 22:51`）を表示する

### 1.2 非目的（初期スコープ外）

- リアルタイム GPS 追跡
- Twitter / X 共有済みのみのフィルタ（API で判定不可）
- マルチユーザー / SNS
- アプリ内 OAuth ログイン UI
- Postgres などの本格 DB
- 相対時刻表示（「2時間前」）（必要なら後続）

### 1.3 方針サマリー

| 項目 | 決定 |
|---|---|
| リポジトリ | SwarmTracker |
| ホスティング | **Vercel** |
| データ源 | Foursquare / Swarm API（チェックイン履歴） |
| 認証（Swarm） | 事前取得した **access token を Env に保存**（アプリに OAuth UI なし） |
| 永続化 | **DB なし**。On/Off のみ **KV（Vercel KV / Upstash）** |
| 公開 API | サーバ側 `/api/presence`（ブラウザは Swarm を直接叩かない） |
| 表示対象 | アプリが On のとき、`visibility !== "private"` の**最新1件** |
| 時刻 | `checkedInAt` + `timeZoneOffset` のローカル絶対時刻（`M/D HH:mm`） |
| 管理 | `/admin` で On/Off（共有シークレット認証） |
| UI | 単独ページは **Stack**、埋め込みは **Compact**（[WIDGET.md](./WIDGET.md)） |

### 1.4 システム構成

```text
[Swarm / Foursquare API]
        ↑ Bearer token（Env）
[Vercel]
  ├─ GET  /api/presence     … 公開
  ├─ POST /api/visibility   … 管理用
  ├─ GET  /admin            … On/Off UI
  ├─ GET  /                 … 表示ページ（Stack）
  ├─ GET  /embed            … 埋め込み（Compact、任意）
  └─ KV                     … { visibility: "on" | "off" }

[閲覧者ブラウザ] → / または /api/presence のみ
[管理者]         → /admin（ADMIN_TOKEN）
```

### 1.5 プライバシーモデル（二重ガード）

1. **アプリ On/Off**  
   Off のとき公開 API は場所情報を返さない（CSS 非表示にしない）
2. **Swarm `visibility`**  
   `private` はスキップ。`closeFriends` / `public` 等は表示対象

### 1.6 表示状態（UI）と API の対応

| UI 状態 | 条件 | Stack の骨格 |
|---|---|---|
| Here | `visible: true` | `● NOW` / 会場名 / 地域 / `7/11 22:51にチェックイン` |
| **Away** | `visible: false`, `reason: "disabled"` | `● OFF` / `非公開` / `現在公開されていません` |
| **Unknown** | `visible: false`, `reason: "no_public_checkin"` | `● PRIVATE` / `共有されていません` / `公開記録がありません` |
| Loading / Error | 取得中・失敗 | 場所は出さない |

### 1.7 主要ユースケース

| 誰 | 操作 | 結果 |
|---|---|---|
| 閲覧者 | `/` を開く | Here / Away / Unknown のいずれか |
| 管理者 | `/admin` で Off | Away（場所フィールドなし） |
| 管理者 | On に戻す | Here または Unknown |
| 自分 | Swarm で private チェックイン | それより前の non-private を表示。無ければ Unknown |

### 1.8 なぜ Vercel か

| | GitHub Pages + Actions | Vercel（採用） |
|---|---|---|
| トークン | Actions Secrets + 事前生成 JSON | Env + リクエスト時取得 |
| On/Off | 相性が弱い | KV + API で自然 |
| 新鮮さ | cron 間隔に依存 | アクセス時取得 + 短いキャッシュ |

ブラウザから Swarm API を直接叩く方式は、access token が公開されるため採用しない。

---

## 2. 詳細設計

### 2.1 外部 API（Swarm）

- **Endpoint:** `GET https://api.foursquare.com/v2/users/self/checkins`
- **Auth:** `Authorization: Bearer ${FOURSQUARE_OAUTH_TOKEN}`
- **Query:** `v=YYYYMMDD`, `limit`（例: 20〜50）
- **取得方針:** 新しい順に走査し、最初の `visibility !== "private"` を採用

#### 利用フィールド

| 元パス | 用途 |
|---|---|
| `items[].id` | チェックイン ID |
| `items[].createdAt` | 時刻（UNIX 秒）→ ISO へ変換 |
| `items[].timeZoneOffset` | 現地ローカル時刻の換算（分） |
| `items[].visibility` | private 除外判定 |
| `items[].shout` | 任意（初期 UI では未使用可） |
| `items[].venue.name` | 場所名 |
| `items[].venue.location.city/state/country` | サブ行 |
| `items[].venue.location.lat/lng` | 地図（初期は任意） |

**使わない / 取れない:** Twitter 共有フラグ

### 2.2 環境変数

| 名前 | 用途 |
|---|---|
| `FOURSQUARE_OAUTH_TOKEN` | Swarm API（サーバのみ） |
| `ADMIN_TOKEN` | `/admin` と visibility API |
| KV 接続情報 | URL / TOKEN 等（製品依存） |

Client ID / Secret はランタイム不要（トークン発行時のみ）。

### 2.3 KV データモデル

```ts
// key: "presence:settings"
type Settings = {
  visibility: "on" | "off";
  updatedAt: string; // ISO8601
};
```

未設定時は **`off`（安全側）**。

### 2.4 公開 API: `GET /api/presence`

**処理順**

1. KV からアプリ `visibility` を読む
2. `off` → `{ visible: false, reason: "disabled" }`
3. `on` → Swarm checkins 取得
4. `visibility !== "private"` の先頭を正規化
5. 該当なし → `{ visible: false, reason: "no_public_checkin" }`

**レスポンス**

```json
// Away
{ "visible": false, "reason": "disabled" }

// Unknown
{ "visible": false, "reason": "no_public_checkin" }

// Here
{
  "visible": true,
  "checkinId": "…",
  "venueName": "朝霞駅 (TJ12)",
  "city": "朝霞市",
  "state": "埼玉県",
  "country": "日本",
  "lat": 35.797,
  "lng": 139.600,
  "checkedInAt": "2026-07-11T13:51:04.000Z",
  "timeZoneOffset": 540,
  "shout": null
}
```

**表示用の整形（クライアントまたはサーバ）**

| 項目 | 規則 |
|---|---|
| 地域行 | `{state}{city}・{country}`（例: `埼玉県朝霞市・日本`） |
| 時刻 | `timeZoneOffset` で換算したローカル時刻を `M/D HH:mm`（例: `7/11 22:51`） |
| Stack フッタ | `{M/D HH:mm}にチェックイン` |
| Compact 右端 | `{M/D HH:mm}` |
| TZ | 閲覧者ブラウザの TZ には依存しない |

**キャッシュ:** On 時 `Cache-Control: public, max-age=60` 程度。Off 時は `no-store` 推奨。  
**セキュリティ:** token・Swarm 生 JSON 全体は返さない。`visible: false` のとき場所フィールドを含めない。

### 2.5 管理 API: `POST /api/visibility`

```json
{ "visibility": "on" }
```

- 認証: `Authorization: Bearer ${ADMIN_TOKEN}`
- 成功: `{ ok: true, visibility }`
- 失敗: 401 / 400

### 2.6 画面

#### `/`（公開・Stack）

| 状態 | 表示 |
|---|---|
| Here | `NOW` / `venueName` / `state+city・country` / `7/11 22:51にチェックイン` |
| Away | `OFF` / `非公開` / `現在公開されていません` |
| Unknown | `PRIVATE` / `共有されていません` / `公開記録がありません` |

詳細・Compact・色は [WIDGET.md](./WIDGET.md)。モックは [widget-mockup.html](./widget-mockup.html)。

#### `/admin`

- `ADMIN_TOKEN` 入力（sessionStorage 可）
- On/Off トグル
- （任意）presence プレビュー（Stack または Compact）
- 一般ナビからはリンクしない想定で可

### 2.7 シーケンス

**閲覧**

```text
Browser → GET /api/presence
App    → KV.get(settings)
       → (on なら) Foursquare checkins → filter private
Browser ← JSON → Stack/Compact 描画
```

**切替**

```text
Admin → POST /api/visibility + ADMIN_TOKEN
App   → KV.set(settings)
Admin ← { ok: true }
```

### 2.8 技術スタック（実装想定）

- Next.js（App Router）on Vercel
- Route Handlers: `/api/presence`, `/api/visibility`
- KV: Vercel KV または Upstash Redis
- フロント: `/`（Stack）+ `/admin`（+ 任意で `/embed` Compact）

### 2.9 セキュリティチェックリスト

- [ ] Swarm / Admin token は Env のみ
- [ ] Off / Unknown 時は場所フィールドをレスポンスに含めない
- [ ] `/admin` はトークンなしで変更不可
- [ ] 本番ログに token・詳細位置を出さない
- [ ] 露出した secret は再発行

### 2.10 今後の拡張（初期は作らない）

- 相対時刻の併記
- 表示粒度（市区町村のみ等）
- 自動 Off（N 時間後）
- 地図埋め込み
- GitHub Pages 静的同期
- Twitter / X 共有連携

---

## 3. 実測で確認済みの前提

- `users/self/checkins` は access token で取得可能
- `visibility` に `closeFriends` / `private` 等がある
- Twitter 共有フラグは API に無い
- 最新が `private` のときは、それ以前の non-private を選ぶ必要がある

---

## 4. 関連ドキュメント

- [ウィジェット詳細（文言・バリアント）](./WIDGET.md)
- [見た目モック](./widget-mockup.html)
