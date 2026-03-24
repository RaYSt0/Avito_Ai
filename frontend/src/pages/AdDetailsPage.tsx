import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchItemById } from "../api";
import type { Item } from "../types";
import { formatParamValue, paramLabel } from "../labels";

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === "";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ImagePlaceholder() {
  return (
    <svg width="210" height="146" viewBox="0 0 210 146" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2.5" y="2.5" width="205" height="141" stroke="#9EA0A6" strokeWidth="5" />
      <circle cx="31" cy="31" r="11" fill="#9EA0A6" />
      <path d="M15 125L59 76L78 99L116 52L188 125H15Z" fill="#9EA0A6" />
    </svg>
  );
}

export function AdDetailsPage() {
  const { id = "" } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchItemById(id, controller.signal)
      .then((res) => {
        setItem(res.items[0]);
        setError("");
      })
      .catch((e) => {
        const err = e as unknown as { name?: string; message?: string };
        if (err?.name === "AbortError" || (err?.message || "").toLowerCase().includes("aborted")) return;
        setError(err?.message || "Ошибка загрузки");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const missingParams = useMemo(() => {
    if (!item) return [];
    const missing = Object.entries(item.params)
      .filter(([, value]) => isEmpty(value))
      .map(([key]) => paramLabel[key] ?? key);
    if (isEmpty(item.description)) {
      missing.unshift(paramLabel.description ?? "Описание");
    }
    return missing;
  }, [item]);

  const filledParams = useMemo(() => {
    if (!item) return [];
    return Object.entries(item.params).filter(([, value]) => !isEmpty(value));
  }, [item]);

  if (loading) return <main className="container">Загрузка...</main>;
  if (error) return <main className="container error">{error}</main>;
  if (!item) return <main className="container">Объявление не найдено</main>;
  const showUpdatedAt = Boolean(
    item.updatedAt && new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 60_000,
  );

  return (
    <main className="container detailsV2">
      <section className="detailsV2Top">
        <div>
          <h1>{item.title}</h1>
          <Link to={`/ads/${item.id}/edit`} className="editBtn">
            Редактировать <span aria-hidden="true">✎</span>
          </Link>
        </div>

        <div className="priceMeta">
          <p className="price">{item.price.toLocaleString("ru-RU")} ₽</p>
          <p>Опубликовано: {formatDateTime(item.createdAt)}</p>
          {showUpdatedAt && <p>Отредактировано: {formatDateTime(item.updatedAt!)}</p>}
        </div>
      </section>

      <div className="detailsDivider" />

      <section className="detailsV2Main">
        <div className="imageWrap">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="mainImage" /> : <ImagePlaceholder />}</div>

        <div>
          {missingParams.length > 0 && (
            <div className="revisionBanner">
              <p className="bannerTitle">Требуются доработки</p>
              <p className="bannerText">У объявления не заполнены поля:</p>
              <ul>
                {missingParams.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          <h2>Характеристики</h2>
          <dl className="specList">
            {filledParams.map(([key, value]) => (
              <div key={key} className="specRow">
                <dt>{paramLabel[key] ?? key}</dt>
                <dd>{formatParamValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="descriptionBlock">
        <h2>Описание</h2>
        <p>{item.description || "Отсутствует"}</p>
      </section>
    </main>
  );
}
