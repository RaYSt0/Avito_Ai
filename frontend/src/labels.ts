import type { Category } from "./types";

export const categoryLabel: Record<Category, string> = {
  auto: "Авто",
  electronics: "Электроника",
  real_estate: "Недвижимость",
};

export const paramLabel: Record<string, string> = {
  description: "Описание",
  type: "Тип",
  brand: "Бренд",
  model: "Модель",
  condition: "Состояние",
  color: "Цвет",
  yearOfManufacture: "Год выпуска",
  transmission: "Коробка передач",
  mileage: "Пробег",
  enginePower: "Мощность двигателя",
  address: "Адрес",
  area: "Площадь",
  floor: "Этаж",
};

const valueLabelMap: Record<string, string> = {
  automatic: "Автомат",
  manual: "Механика",
  flat: "Квартира",
  house: "Дом",
  room: "Комната",
  phone: "Телефон",
  laptop: "Ноутбук",
  tablet: "Планшет",
  misc: "Другое",
  new: "Новый",
  used: "Б/у",
};

export function formatParamValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  const raw = String(value);
  return valueLabelMap[raw] ?? raw;
}
