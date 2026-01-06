import { Client } from "@notionhq/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type RequestBody = {
  title?: unknown;
  category?: unknown;
  execMonth?: unknown;
};

const allowedCategories = new Set(["買い物", "Private", "Works", "処理済(待ち)"]);

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID ?? "";

const errorResponse = (res: VercelResponse, message: string) => {
  res.status(400).json({ ok: false, error: message });
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeCategory = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const raw = value.trim();

  // 表記ゆれ吸収（必要ならここに追加）
  const aliasMap: Record<string, string> = {
    "Private W": "Private",
    "Work": "Works",
    "Works ": "Works",
    "買い物 ": "買い物",
    "処理済(待ち) ": "処理済(待ち)",
    "処理済（待ち）": "処理済(待ち)", // 全角カッコ対策
  };

  return aliasMap[raw] ?? raw;
};

const parseExecMonth = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  if (typeof value === "string") {
    const s = value.trim();

    // 「メニューの終了」を選んだ場合など
    if (s === "" || s === "メニューの終了") return null;

    const n = Number(s);
    return Number.isInteger(n) ? n : null;
  }
  return null;
};


export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  console.log("受け取ったbody:", req.body);

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  if (!req.headers["content-type"]?.includes("application/json")) {
    errorResponse(res, "Content-Type must be application/json");
    return;
  }

  const { title, category, execMonth } = (req.body ?? {}) as RequestBody;

  console.log("category raw:", category);
console.log("allowed:", Array.from(allowedCategories));


  if (!isNonEmptyString(title)) {
    errorResponse(res, "title must be a non-empty string");
    return;
  }

const categoryNormalized = normalizeCategory(category);

console.log("category raw:", category);
console.log("category normalized:", categoryNormalized);
console.log("allowed:", Array.from(allowedCategories));

if (!categoryNormalized || !allowedCategories.has(categoryNormalized)) {
  errorResponse(
    res,
    `category must be one of the allowed values: ${Array.from(allowedCategories).join(", ")}`
  );
  return;
}


const execMonthNum = parseExecMonth(execMonth);

console.log("execMonth raw:", execMonth);
console.log("execMonth parsed:", execMonthNum);

if (execMonthNum === null || execMonthNum < 1 || execMonthNum > 12) {
  errorResponse(res, "execMonth must be an integer between 1 and 12");
  return;
}


  if (!databaseId) {
    res.status(500).json({ ok: false, error: "NOTION_DATABASE_ID is missing" });
    return;
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Todo: {
          title: [{ text: { content: title.trim() } }],
        },
        カテゴリ: {
select: { name: categoryNormalized },
        },
        実行月: {
          number: execMonthNum,
        },
        達成: {
          checkbox: false,
        },
      },
    });

    res.status(200).json({ ok: true, id: response.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Notion API error:", message);
    res.status(500).json({ ok: false, error: message });
  }
}
