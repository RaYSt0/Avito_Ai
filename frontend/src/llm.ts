import type { Item } from "./types";
import { categoryLabel } from "./labels";

function fallbackDescription(item: Item): string {
  return `Продается ${item.title}. Состояние: хорошее. Отличный вариант для тех, кто ищет качественный товар по разумной цене. Возможен торг при быстрой сделке.`;
}

export async function generateDescription(item: Item): Promise<string> {
  try {
    const prompt = `Ты помощник продавца Авито. Пиши только на русском языке.
Улучши описание объявления так, чтобы оно стало понятным и продающим.
Категория: ${categoryLabel[item.category]}
Название: ${item.title}
Цена: ${item.price} рублей
Текущее описание: ${item.description ?? ""}
Верни только итоговый текст описания на русском, без кавычек и без пояснений.`;
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3", prompt, stream: false }),
    });
    if (!response.ok) throw new Error("LLM error");
    const json = (await response.json()) as { response?: string };
    return json.response?.trim() || fallbackDescription(item);
  } catch {
    return fallbackDescription(item);
  }
}

export async function suggestPrice(item: Item): Promise<number> {
  try {
    const prompt = `Ты помощник продавца Авито. Пиши только на русском языке.
Оцени рыночную цену объявления в рублях.
Категория: ${categoryLabel[item.category]}
Название: ${item.title}
Текущая цена: ${item.price}
Верни только одно целое число в рублях, без символов и текста.`;
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3", prompt, stream: false }),
    });
    if (!response.ok) throw new Error("LLM error");
    const json = (await response.json()) as { response?: string };
    const parsed = Number((json.response || "").replace(/[^\d]/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Bad price");
    return parsed;
  } catch {
    return Math.round(item.price * 1.05);
  }
}
