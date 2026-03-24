import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchItems } from "../api";
import type { Category, Item } from "../types";
import { categoryLabel } from "../labels";

const LIMIT = 10;
const TOTAL_ADS = 42;

const sortOptions = [
  { value: "createdAt:desc", label: "По новизне (сначала новые)" },
  { value: "createdAt:asc", label: "По новизне (сначала старые)" },
  { value: "title:asc", label: "По названию (А → Я)" },
  { value: "title:desc", label: "По названию (Я → А)" },
  { value: "price:asc", label: "По цене (сначала дешевле)" },
  { value: "price:desc", label: "По цене (сначала дороже)" },
] as const;

const categoryOrder: Category[] = ["auto", "electronics", "real_estate"];
const requiredParamsByCategory: Record<Category, string[]> = {
  auto: ["brand", "model", "yearOfManufacture", "transmission", "mileage", "enginePower"],
  electronics: ["type", "brand", "model", "condition", "color"],
  real_estate: ["type", "address", "area", "floor"],
};

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === "";
}

function isNeedsRevision(item: Item) {
  if (isEmpty(item.description)) return true;
  const params = item.params as Record<string, unknown>;
  return requiredParamsByCategory[item.category].some((key) => isEmpty(params[key]));
}

function ImagePlaceholder() {
  return (
    <svg width="102" height="68" viewBox="0 0 102 68" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1.5" y="1.5" width="99" height="65" stroke="#A1A2A8" strokeWidth="3" />
      <circle cx="15" cy="15" r="6" fill="#A1A2A8" />
      <path d="M9 57L31 31L43 46L59 23L88 57H9Z" fill="#A1A2A8" />
    </svg>
  );
}

export function AdsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page") || "1");
  const q = searchParams.get("q") || "";
  const categories = (searchParams.get("categories") || "").split(",").filter(Boolean) as Category[];
  const onlyRevision = searchParams.get("needsRevision") === "true";
  const sortColumn = searchParams.get("sortColumn") || "createdAt";
  const sortDirection = searchParams.get("sortDirection") || "desc";
  const view = searchParams.get("view") === "list" ? "list" : "grid";
  const categoriesParam = categories.join(",");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("skip", String((page - 1) * LIMIT));
    if (q) params.set("q", q);
    if (categoriesParam) params.set("categories", categoriesParam);
    if (onlyRevision) params.set("needsRevision", "true");
    params.set("sortColumn", sortColumn);
    params.set("sortDirection", sortDirection);

    fetchItems(params, controller.signal)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setError("");
      })
      .catch((e) => {
        const err = e as unknown as { name?: string; message?: string };
        if (err?.name === "AbortError" || (err?.message || "").toLowerCase().includes("aborted")) return;
        setError(err?.message || "Ошибка загрузки");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [page, q, categoriesParam, onlyRevision, sortColumn, sortDirection]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);
  const pageNumbers = useMemo(() => {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }, [pages]);

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  }

  return (
    <main className="adsShell">
      <div className="adsPage">
        <header className="adsHeading">
          <h1>Мои объявления</h1>
          <p>{TOTAL_ADS} объявления</p>
        </header>

        <section className="toolbar">
            <div className="searchBox">
              <input
                className="searchInput"
                value={q}
                onChange={(e) => updateParam("q", e.target.value)}
                placeholder="Найти объявление...."
              />
              <span className="searchIcon" aria-hidden="true">⌕</span>
            </div>

            <div className="layoutSwitch" role="group" aria-label="Режим отображения">
              <button
                type="button"
                className={`layoutBtn ${view === "grid" ? "active" : ""}`}
                onClick={() => updateParam("view", "grid")}
                aria-label="Сетка"
              >
                ▦
              </button>
              <button
                type="button"
                className={`layoutBtn ${view === "list" ? "active" : ""}`}
                onClick={() => updateParam("view", "list")}
                aria-label="Список"
              >
                ☰
              </button>
            </div>

            <select
              className="sortSelect"
              value={`${sortColumn}:${sortDirection}`}
              onChange={(e) => {
                const [col, dir] = e.target.value.split(":");
                const next = new URLSearchParams(searchParams);
                next.set("page", "1");
                next.set("sortColumn", col);
                next.set("sortDirection", dir);
                setSearchParams(next);
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
        </section>

        <div className="adsLayout">
          <aside className="filtersPanel">
              <h2>Фильтры</h2>

              <div className="filtersBlock">
                <div className="filtersBlockTitle">
                  Категория <span aria-hidden="true">⌃</span>
                </div>
                {categoryOrder.map((cat) => (
                  <label key={cat} className="checkRow">
                    <input
                      type="checkbox"
                      checked={categories.includes(cat)}
                      onChange={(e) => {
                        const next = new Set(categories);
                        if (e.target.checked) next.add(cat);
                        else next.delete(cat);
                        updateParam("categories", Array.from(next).join(","));
                      }}
                    />
                    <span>{categoryLabel[cat]}</span>
                  </label>
                ))}
              </div>

              <div className="filtersBlock splitTop">
                <label className="revisionSwitchRow">
                  <span>Только требующие доработок</span>
                  <input
                    type="checkbox"
                    checked={onlyRevision}
                    onChange={(e) => updateParam("needsRevision", e.target.checked ? "true" : "")}
                  />
                  <span className="switchVisual" aria-hidden="true" />
                </label>
              </div>

              <button className="resetFilters" onClick={() => setSearchParams(new URLSearchParams({ page: "1", view }))}>
                Сбросить фильтры
              </button>
          </aside>

          <section className="resultsArea">
              {loading && <p className="stateText">Загрузка...</p>}
              {error && <p className="stateText error">{error}</p>}

              {!loading && !error && (
                <div className={view === "grid" ? "cardsGrid" : "cardsList"}>
                  {items.map((item) => {
                    const needsRevision = item.needsRevision || isNeedsRevision(item);
                    return (
                      <Link key={item.id} to={`/ads/${item.id}`} className={view === "grid" ? "adCard" : "adCard listMode"}>
                        <div className="thumbWrap">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="thumbImg" /> : <ImagePlaceholder />}
                        </div>

                        <div className="adInfo">
                          <div className="chip">{categoryLabel[item.category]}</div>
                          <h3>{item.title}</h3>
                          <p className="price">{item.price.toLocaleString("ru-RU")} ₽</p>
                          {needsRevision && <span className="warningBadge">• Требует доработок</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="pagination">
                <button className="pageBtn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ‹
                </button>
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    className={`pageBtn ${number === page ? "active" : ""}`}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <button className="pageBtn" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  ›
                </button>
              </div>
          </section>
        </div>
      </div>
    </main>
  );
}
