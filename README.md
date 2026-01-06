# notion-todo-webhook

Vercel の Serverless Function で動作する Notion 連携 Webhook です。

## 必要環境

- Node.js 18+
- Notion Integration Token
- Notion Database ID

## 環境変数

```
NOTION_TOKEN=your_notion_token
NOTION_DATABASE_ID=20f5a0050d1c48089c57b1edd31e5890
```

## エンドポイント

`POST /api/add-task`

Content-Type: `application/json`

Body:

```json
{
  "title": "タスク名",
  "category": "買い物",
  "execMonth": 4
}
```

## 開発

```
npm install
npm run dev
```

## 検証

```
npm run build
```
