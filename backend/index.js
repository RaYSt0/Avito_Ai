const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const categories = ["auto", "real_estate", "electronics"];

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function needsRevision(item) {
  const params = item.params || {};
  return isEmpty(item.description) || Object.values(params).some(isEmpty);
}

const catalog = [
  {
    category: "electronics",
    title: "Наушники",
    description: "Полноразмерные, отличное состояние.",
    price: 2990,
    imageUrl: "",
    params: { type: "misc", brand: "Sony", model: "WH-1000", condition: "used", color: "Black" },
  },
  {
    category: "auto",
    title: "Volkswagen Polo",
    description: "ПТС оригинал, один владелец.",
    price: 1100000,
    imageUrl: "",
    params: { brand: "Volkswagen", model: "Polo", yearOfManufacture: 2018, transmission: "automatic", mileage: 87000, enginePower: undefined },
  },
  {
    category: "real_estate",
    title: "Студия, 25м²",
    description: "Новый ремонт, рядом МЦД.",
    price: 15000000,
    imageUrl: "",
    params: { type: "flat", address: "Москва, ул. Складочная, 6", area: 25, floor: 9 },
  },
  {
    category: "real_estate",
    title: "1-комнатная квартира, 44м²",
    description: "Дом бизнес-класса.",
    price: 19000000,
    imageUrl: "",
    params: { type: "flat", address: "Москва, ул. Архитектора Щусева, 5", area: 44, floor: undefined },
  },
  {
    category: "electronics",
    title: "MacBook Pro 16”",
    description: "2021, M1 Pro, 16 ГБ RAM.",
    price: 64000,
    imageUrl: "",
    params: { type: "laptop", brand: "Apple", model: "MacBook Pro 16", condition: "used", color: "" },
  },
  {
    category: "auto",
    title: "Omoda C5",
    description: "На гарантии до 2028 года.",
    price: 2900000,
    imageUrl: "",
    params: { brand: "Omoda", model: "C5", yearOfManufacture: 2024, transmission: "automatic", mileage: 12000, enginePower: 147 },
  },
  {
    category: "electronics",
    title: "iPad Air 11, 2024 г.",
    description: "Память 256 ГБ, почти не использовался.",
    price: 37000,
    imageUrl: "",
    params: { type: "tablet", brand: "Apple", model: "iPad Air 11", condition: "used", color: "Blue" },
  },
  {
    category: "electronics",
    title: "MAJOR VI",
    description: "Накладные наушники Marshall.",
    price: 20000,
    imageUrl: "",
    params: { type: "misc", brand: "Marshall", model: "Major VI", condition: "new", color: "Brown" },
  },
  {
    category: "auto",
    title: "Toyota Camry",
    description: "",
    price: 3900000,
    imageUrl: "",
    params: { brand: "Toyota", model: "Camry", yearOfManufacture: 2023, transmission: "automatic", mileage: 18000, enginePower: 249 },
  },
  {
    category: "electronics",
    title: "iPhone 17 Pro Max",
    description: "Новый, не активирован.",
    price: 107000,
    imageUrl: "",
    params: { type: "phone", brand: "Apple", model: "iPhone 17 Pro Max", condition: "new", color: "Titanium" },
  },
  {
    category: "electronics",
    title: "Samsung Galaxy S25",
    description: "В идеальном состоянии, 512 ГБ.",
    price: 88000,
    imageUrl: "",
    params: { type: "phone", brand: "Samsung", model: "Galaxy S25", condition: "used", color: "Gray" },
  },
  {
    category: "auto",
    title: "LADA Vesta",
    description: "После ТО, без ДТП.",
    price: 1230000,
    imageUrl: "",
    params: { brand: "LADA", model: "Vesta", yearOfManufacture: 2022, transmission: "manual", mileage: 32000, enginePower: 106 },
  },
  {
    category: "real_estate",
    title: "2-к квартира, 62м²",
    description: "Квартира с мебелью.",
    price: 12900000,
    imageUrl: "",
    params: { type: "flat", address: "Санкт-Петербург, Московский пр., 28", area: 62, floor: 5 },
  },
  {
    category: "electronics",
    title: "PlayStation 5",
    description: "Два геймпада в комплекте.",
    price: 43000,
    imageUrl: "",
    params: { type: "misc", brand: "Sony", model: "PS5", condition: "used", color: "White" },
  },
  {
    category: "real_estate",
    title: "Дом, 120м²",
    description: "",
    price: 17900000,
    imageUrl: "",
    params: { type: "house", address: "Казань, ул. Озерная, 14", area: 120, floor: 2 },
  },
  {
    category: "auto",
    title: "Hyundai Solaris",
    description: "Экономичный городской авто.",
    price: 980000,
    imageUrl: "",
    params: { brand: "Hyundai", model: "Solaris", yearOfManufacture: 2017, transmission: "automatic", mileage: 99000, enginePower: 123 },
  },
  {
    category: "electronics",
    title: "Dyson V15",
    description: "Беспроводной пылесос, насадки в комплекте.",
    price: 52000,
    imageUrl: "",
    params: { type: "misc", brand: "Dyson", model: "V15", condition: "used", color: "Gold" },
  },
  {
    category: "real_estate",
    title: "Комната, 14м²",
    description: "Центр города, 5 минут до метро.",
    price: 3900000,
    imageUrl: "",
    params: { type: "room", address: "Екатеринбург, ул. Ленина, 77", area: 14, floor: 3 },
  },
  {
    category: "auto",
    title: "BMW X5",
    description: "Пробег по трассе, дилерское обслуживание.",
    price: 5650000,
    imageUrl: "",
    params: { brand: "BMW", model: "X5", yearOfManufacture: 2021, transmission: "automatic", mileage: 42000, enginePower: 249 },
  },
  {
    category: "electronics",
    title: "Xiaomi TV 55",
    description: "4K, Android TV.",
    price: 35000,
    imageUrl: "",
    params: { type: "misc", brand: "Xiaomi", model: "TV A 55", condition: "new", color: "Black" },
  },
  {
    category: "real_estate",
    title: "Студия, 19м²",
    description: "",
    price: 7400000,
    imageUrl: "",
    params: { type: "flat", address: "Краснодар, ул. Кубанская, 10", area: 19, floor: 12 },
  },
  {
    category: "auto",
    title: "Kia Rio",
    description: "Надежный и недорогой в обслуживании.",
    price: 910000,
    imageUrl: "",
    params: { brand: "Kia", model: "Rio", yearOfManufacture: 2016, transmission: "automatic", mileage: 118000, enginePower: 123 },
  },
  {
    category: "electronics",
    title: "Apple Watch Series 10",
    description: "",
    price: 29000,
    imageUrl: "",
    params: { type: "misc", brand: "Apple", model: "Watch Series 10", condition: "new", color: "Silver" },
  },
  {
    category: "real_estate",
    title: "3-к квартира, 85м²",
    description: "Рядом школа и парк.",
    price: 21500000,
    imageUrl: "",
    params: { type: "flat", address: "Москва, Ленинский пр., 103", area: 85, floor: 14 },
  },
  {
    category: "auto",
    title: "Skoda Octavia",
    description: "Без окрасов, честный пробег.",
    price: 2100000,
    imageUrl: "",
    params: { brand: "Skoda", model: "Octavia", yearOfManufacture: 2020, transmission: "automatic", mileage: 51000, enginePower: 150 },
  },
  {
    category: "electronics",
    title: "Canon EOS R8",
    description: "Фотоаппарат + объектив 24-105.",
    price: 142000,
    imageUrl: "",
    params: { type: "misc", brand: "Canon", model: "EOS R8", condition: "used", color: "Black" },
  },
  {
    category: "real_estate",
    title: "Дом, 180м²",
    description: "Участок 8 соток.",
    price: 26400000,
    imageUrl: "",
    params: { type: "house", address: "Тюмень, ул. Рябиновая, 2", area: 180, floor: 2 },
  },
  {
    category: "auto",
    title: "Haval Jolion",
    description: "",
    price: 2260000,
    imageUrl: "",
    params: { brand: "Haval", model: "Jolion", yearOfManufacture: 2024, transmission: "automatic", mileage: 9000, enginePower: 143 },
  },
  {
    category: "electronics",
    title: "Steam Deck OLED",
    description: "Почти новый, память 1 ТБ.",
    price: 69000,
    imageUrl: "",
    params: { type: "misc", brand: "Valve", model: "Steam Deck OLED", condition: "used", color: "Black" },
  },
  {
    category: "real_estate",
    title: "Комната, 18м²",
    description: "Тихие соседи.",
    price: 2800000,
    imageUrl: "",
    params: { type: "room", address: "Новосибирск, ул. Советская, 58", area: 18, floor: 4 },
  },
  {
    category: "auto",
    title: "Mercedes C200",
    description: "Комплектация AMG Line.",
    price: 4350000,
    imageUrl: "",
    params: { brand: "Mercedes", model: "C200", yearOfManufacture: 2021, transmission: "automatic", mileage: 39000, enginePower: 204 },
  },
  {
    category: "electronics",
    title: "JBL PartyBox 310",
    description: "Мощный звук, аккумулятор держит долго.",
    price: 41000,
    imageUrl: "",
    params: { type: "misc", brand: "JBL", model: "PartyBox 310", condition: "used", color: "Black" },
  },
  {
    category: "real_estate",
    title: "2-к квартира, 49м²",
    description: "",
    price: 9700000,
    imageUrl: "",
    params: { type: "flat", address: "Самара, ул. Молодогвардейская, 112", area: 49, floor: 7 },
  },
  {
    category: "auto",
    title: "Renault Duster",
    description: "Полный привод.",
    price: 1750000,
    imageUrl: "",
    params: { brand: "Renault", model: "Duster", yearOfManufacture: 2019, transmission: "manual", mileage: 83000, enginePower: 143 },
  },
  {
    category: "electronics",
    title: "Asus ROG Zephyrus",
    description: "Игровой ноутбук RTX 4070.",
    price: 164000,
    imageUrl: "",
    params: { type: "laptop", brand: "Asus", model: "ROG Zephyrus", condition: "new", color: "Black" },
  },
  {
    category: "real_estate",
    title: "Студия, 31м²",
    description: "Просторная лоджия.",
    price: 8600000,
    imageUrl: "",
    params: { type: "flat", address: "Воронеж, ул. Пушкинская, 21", area: 31, floor: 10 },
  },
  {
    category: "auto",
    title: "Geely Monjaro",
    description: "Максимальная комплектация.",
    price: 3950000,
    imageUrl: "",
    params: { brand: "Geely", model: "Monjaro", yearOfManufacture: 2024, transmission: "automatic", mileage: 7000, enginePower: 238 },
  },
  {
    category: "electronics",
    title: "Kindle Paperwhite",
    description: "Электронная книга, 16 ГБ.",
    price: 14900,
    imageUrl: "",
    params: { type: "misc", brand: "Amazon", model: "Kindle Paperwhite", condition: "used", color: "Black" },
  },
  {
    category: "real_estate",
    title: "Дом, 96м²",
    description: "Рядом лес и река.",
    price: 11200000,
    imageUrl: "",
    params: { type: "house", address: "Пермь, ул. Южная, 8", area: 96, floor: 2 },
  },
  {
    category: "auto",
    title: "Chery Tiggo 7 Pro",
    description: "",
    price: 2480000,
    imageUrl: "",
    params: { brand: "Chery", model: "Tiggo 7 Pro", yearOfManufacture: 2023, transmission: "automatic", mileage: 14000, enginePower: 147 },
  },
  {
    category: "electronics",
    title: "GoPro Hero 13",
    description: "Комплект с креплениями.",
    price: 57000,
    imageUrl: "",
    params: { type: "misc", brand: "GoPro", model: "Hero 13", condition: "new", color: "Black" },
  },
  {
    category: "real_estate",
    title: "1-к квартира, 36м²",
    description: "Теплый дом, закрытый двор.",
    price: 6900000,
    imageUrl: "",
    params: { type: "flat", address: "Уфа, ул. Коммунистическая, 33", area: 36, floor: 6 },
  },
];

const items = catalog.map((item, index) => ({
  ...item,
  id: String(index + 1),
  createdAt: addDays("2026-02-10T12:00:00.000Z", 42 - index),
  updatedAt: undefined,
}));

app.get("/items", (req, res) => {
  let result = [...items];
  const { q, limit, skip, needsRevision: nr, categories: cats, sortColumn, sortDirection } = req.query;

  if (q) {
    const needle = String(q).toLowerCase();
    result = result.filter((item) => item.title.toLowerCase().includes(needle));
  }

  if (nr === "true") {
    result = result.filter(needsRevision);
  }

  if (cats) {
    const allowed = String(cats).split(",").filter((c) => categories.includes(c));
    if (allowed.length > 0) {
      result = result.filter((item) => allowed.includes(item.category));
    }
  }

  if (sortColumn) {
    const direction = sortDirection === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortColumn === "title") return a.title.localeCompare(b.title, "ru") * direction;
      if (sortColumn === "createdAt") return (new Date(a.createdAt) - new Date(b.createdAt)) * direction;
      if (sortColumn === "price") return (a.price - b.price) * direction;
      return 0;
    });
  }

  const total = result.length;
  const safeSkip = Number(skip || 0);
  const safeLimit = Number(limit || 10);
  result = result.slice(safeSkip, safeSkip + safeLimit);

  res.json({
    items: result.map((item) => ({ ...item, needsRevision: needsRevision(item) })),
    total,
  });
});

app.get("/items/:id", (req, res) => {
  const item = items.find((value) => value.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  return res.json({ items: [{ ...item, needsRevision: needsRevision(item) }], total: 1 });
});

app.put("/items/:id", (req, res) => {
  const index = items.findIndex((value) => value.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Item not found" });
  }

  const payload = req.body;
  if (!payload || !payload.category || !payload.title || typeof payload.price !== "number" || !payload.params) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  items[index] = {
    ...items[index],
    category: payload.category,
    title: payload.title,
    description: payload.description ?? "",
    price: payload.price,
    params: payload.params,
    updatedAt: new Date().toISOString(),
  };

  return res.json({ item: { ...items[index], needsRevision: needsRevision(items[index]) } });
});

app.listen(PORT, () => {
  console.log(`Backend started on port ${PORT}`);
});
