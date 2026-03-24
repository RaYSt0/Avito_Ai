import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchItemById, updateItem } from "../api";
import { generateDescription, suggestPrice } from "../llm";
import type { Category, Item } from "../types";
import { categoryLabel, formatParamValue, paramLabel } from "../labels";

type Draft = Omit<Item, "needsRevision">;
type TouchMap = Record<string, boolean>;

type AiState = {
  loading: boolean;
  done: boolean;
  text: string;
  error: string;
  value?: number;
};

function emptyParamsByCategory(category: Category) {
  if (category === "auto") {
    return {
      brand: "",
      model: "",
      yearOfManufacture: undefined,
      transmission: undefined,
      mileage: undefined,
      enginePower: undefined,
    };
  }

  if (category === "real_estate") {
    return {
      type: undefined,
      address: "",
      area: undefined,
      floor: undefined,
    };
  }

  return {
    type: undefined,
    brand: "",
    model: "",
    condition: undefined,
    color: "",
  };
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === "";
}

function toRuPrice(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function getTypeOptions(category: Category) {
  if (category === "real_estate") return ["flat", "house", "room"];
  if (category === "electronics") return ["phone", "laptop", "misc"];
  return [];
}

const numericParamKeys = new Set(["yearOfManufacture", "mileage", "enginePower", "area", "floor"]);

const emptyAiState: AiState = {
  loading: false,
  done: false,
  text: "",
  error: "",
};

export function AdEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const draftKey = useMemo(() => `ad_draft_${id}`, [id]);

  const [form, setForm] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState<TouchMap>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [priceAi, setPriceAi] = useState<AiState>(emptyAiState);
  const [descriptionAi, setDescriptionAi] = useState<AiState>(emptyAiState);

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);

    if (saved) {
      setForm(JSON.parse(saved));
      setLoading(false);
      return;
    }

    fetchItemById(id)
      .then((res) => {
        const item = res.items[0];
        setForm({
          id: item.id,
          category: item.category,
          title: item.title,
          description: item.description,
          price: item.price,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          imageUrl: item.imageUrl,
          params: item.params,
        });
        setPageError("");
      })
      .catch((e) => setPageError((e as Error).message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id, draftKey]);

  useEffect(() => {
    if (form) {
      localStorage.setItem(draftKey, JSON.stringify(form));
    }
  }, [form, draftKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  if (loading) return <main className="container">Загрузка...</main>;
  if (pageError) return <main className="container error">{pageError}</main>;
  if (!form) return <main className="container">Объявление не найдено</main>;
  const formState = form;

  const hasTypeField = Object.prototype.hasOwnProperty.call(formState.params, "type");

  const requiredChecks = {
    title: formState.title.trim().length > 0,
    price: Number.isFinite(formState.price) && formState.price > 0,
    type: !hasTypeField || !isEmpty((formState.params as Record<string, unknown>).type),
  };

  const requiredFieldKeys = ["title", "price", ...(hasTypeField ? ["param:type"] : [])];
  const hasRequiredErrors = !requiredChecks.title || !requiredChecks.price || !requiredChecks.type;

  const optionalMissingParamKeys = Object.entries(formState.params)
    .filter(([key, value]) => key !== "type" && isEmpty(value))
    .map(([key]) => key);

  function markTouched(key: string) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function isFieldInvalid(key: "title" | "price" | "type") {
    const touchedKey = key === "type" ? "param:type" : key;
    const shouldShow = submitAttempted || touched[touchedKey];
    if (!shouldShow) return false;
    if (key === "title") return !requiredChecks.title;
    if (key === "price") return !requiredChecks.price;
    return !requiredChecks.type;
  }

  function setParamValue(key: string, rawValue: string) {
    const nextValue = rawValue === "" ? undefined : numericParamKeys.has(key) ? Number(rawValue) : rawValue;
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        params: {
          ...(prev.params as Record<string, unknown>),
          [key]: nextValue,
        } as Draft["params"],
      };
    });
  }

  function clearParamValue(key: string) {
    setParamValue(key, "");
  }

  async function onSave() {
    setSubmitAttempted(true);
    if (hasRequiredErrors) {
      requiredFieldKeys.forEach((key) => markTouched(key));
      return;
    }

    setSaving(true);
    setPageError("");
    try {
      await updateItem(id, {
        category: formState.category,
        title: formState.title.trim(),
        description: (formState.description || "").trim(),
        price: Number(formState.price),
        params: formState.params,
      });

      setToast({ type: "success", text: "Изменения сохранены" });
      localStorage.removeItem(draftKey);
      setTimeout(() => navigate(`/ads/${id}`), 900);
    } catch (e) {
      setToast({ type: "error", text: "Ошибка сохранения" });
      setPageError((e as Error).message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handlePriceAi() {
    setPriceAi({ loading: true, done: priceAi.done, text: "", error: "" });
    try {
      const suggested = await suggestPrice({ ...formState, needsRevision: false });
      const min = Math.round(suggested * 0.9);
      const max = Math.round(suggested * 1.1);
      const text = `Средняя цена для ${formState.title}:\n• ${toRuPrice(min)} — можно продать быстрее\n• ${toRuPrice(suggested)} — рыночная цена\n• ${toRuPrice(max)} — при идеальном состоянии`;
      setPriceAi({ loading: false, done: true, text, error: "", value: suggested });
    } catch {
      setPriceAi({ loading: false, done: true, text: "", error: "Произошла ошибка при запросе к AI" });
    }
  }

  async function handleDescriptionAi() {
    setDescriptionAi({ loading: true, done: descriptionAi.done, text: "", error: "" });
    try {
      const generated = await generateDescription({ ...formState, needsRevision: false });
      setDescriptionAi({ loading: false, done: true, text: generated, error: "" });
    } catch {
      setDescriptionAi({ loading: false, done: true, text: "", error: "Произошла ошибка при запросе к AI" });
    }
  }

  function renderInputWithClear(props: {
    value: string;
    onChange: (next: string) => void;
    onBlur: () => void;
    placeholder?: string;
    invalid?: boolean;
    warning?: boolean;
    type?: string;
    onClear: () => void;
  }) {
    const { value, onChange, onBlur, placeholder, invalid, warning, type = "text", onClear } = props;
    return (
      <div className={`fieldWrap ${invalid ? "invalid" : ""} ${warning ? "warning" : ""}`}>
        <input
          value={value}
          type={type}
          placeholder={placeholder}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className="fieldInput"
        />
        {value && (
          <button type="button" className="clearBtn" onClick={onClear} aria-label="Очистить поле">
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <main className="container editV2">
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}

      <h1>Редактирование объявления</h1>

      <section className="editSection">
        <label className="fieldLabel">Категория</label>
        <select
          className="fieldSelect"
          value={formState.category}
          onChange={(e) => {
            const nextCategory = e.target.value as Category;
            setForm({ ...formState, category: nextCategory, params: emptyParamsByCategory(nextCategory) });
            setTouched({});
          }}
        >
          <option value="electronics">{categoryLabel.electronics}</option>
          <option value="auto">{categoryLabel.auto}</option>
          <option value="real_estate">{categoryLabel.real_estate}</option>
        </select>
      </section>

      <div className="sectionDivider" />

      <section className="editSection">
        <label className="fieldLabel required">Название</label>
        {renderInputWithClear({
          value: formState.title,
          onChange: (next) => setForm({ ...formState, title: next }),
          onBlur: () => markTouched("title"),
          placeholder: "Название",
          invalid: isFieldInvalid("title"),
          onClear: () => setForm({ ...formState, title: "" }),
        })}
        {isFieldInvalid("title") && <p className="fieldError">Название должно быть заполнено</p>}
      </section>

      <div className="sectionDivider" />

      <section className="editSection priceSection">
        <div>
          <label className="fieldLabel required">Цена</label>
          {renderInputWithClear({
            value: String(formState.price || ""),
            type: "number",
            onChange: (next) => setForm({ ...formState, price: Number(next) || 0 }),
            onBlur: () => markTouched("price"),
            placeholder: "Цена",
            invalid: isFieldInvalid("price"),
            onClear: () => setForm({ ...formState, price: 0 }),
          })}
          {isFieldInvalid("price") && <p className="fieldError">Цена должна быть больше 0</p>}
        </div>

        <div className="aiBlock">
          <button type="button" className="aiBtn" onClick={handlePriceAi} disabled={priceAi.loading}>
            {priceAi.loading ? "Выполняется запрос" : priceAi.done ? "Повторить запрос" : "Узнать рыночную цену"}
          </button>

          {(priceAi.text || priceAi.error) && (
            <div className={`aiTooltip ${priceAi.error ? "error" : ""}`}>
              <h4>{priceAi.error ? "Произошла ошибка при запросе к AI" : "Ответ AI:"}</h4>
              <p>{priceAi.error || priceAi.text}</p>
              <div className="aiTooltipActions">
                {!priceAi.error && (
                  <button type="button" className="btnPrimary" onClick={() => setForm({ ...formState, price: priceAi.value || formState.price })}>
                    Применить
                  </button>
                )}
                <button type="button" className="btnGhost" onClick={() => setPriceAi({ ...emptyAiState, done: true })}>
                  Закрыть
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="sectionDivider" />

      <section className="editSection">
        <h2>Характеристики</h2>

        {Object.entries(formState.params).map(([key, value]) => {
          const current = value === undefined || value === null ? "" : String(value);
          const optionalWarning = optionalMissingParamKeys.includes(key);
          const isTypeRequired = key === "type" && hasTypeField;
          const typeInvalid = key === "type" && isFieldInvalid("type");

          if (key === "type") {
            const options = getTypeOptions(formState.category);
            return (
              <div key={key} className="paramField">
                <label className={`fieldLabel ${isTypeRequired ? "required" : ""}`}>{paramLabel[key] ?? key}</label>
                <select
                  className={`fieldSelect ${typeInvalid ? "invalid" : ""} ${optionalWarning ? "warning" : ""}`}
                  value={current}
                  onBlur={() => markTouched("param:type")}
                  onChange={(e) => setParamValue(key, e.target.value)}
                >
                  <option value="">{paramLabel[key] ?? key}</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {formatParamValue(option)}
                    </option>
                  ))}
                </select>
                {typeInvalid && <p className="fieldError">Поле должно быть заполнено</p>}
              </div>
            );
          }

          if (key === "transmission") {
            return (
              <div key={key} className="paramField">
                <label className="fieldLabel">{paramLabel[key] ?? key}</label>
                <select
                  className={`fieldSelect ${optionalWarning ? "warning" : ""}`}
                  value={current}
                  onChange={(e) => setParamValue(key, e.target.value)}
                >
                  <option value="">{paramLabel[key] ?? key}</option>
                  <option value="automatic">{formatParamValue("automatic")}</option>
                  <option value="manual">{formatParamValue("manual")}</option>
                </select>
              </div>
            );
          }

          if (key === "condition") {
            return (
              <div key={key} className="paramField">
                <label className="fieldLabel">{paramLabel[key] ?? key}</label>
                <select
                  className={`fieldSelect ${optionalWarning ? "warning" : ""}`}
                  value={current}
                  onChange={(e) => setParamValue(key, e.target.value)}
                >
                  <option value="">{paramLabel[key] ?? key}</option>
                  <option value="new">{formatParamValue("new")}</option>
                  <option value="used">{formatParamValue("used")}</option>
                </select>
              </div>
            );
          }

          return (
            <div key={key} className="paramField">
              <label className="fieldLabel">{paramLabel[key] ?? key}</label>
              {renderInputWithClear({
                value: current,
                type: numericParamKeys.has(key) ? "number" : "text",
                onChange: (next) => setParamValue(key, next),
                onBlur: () => undefined,
                placeholder: paramLabel[key] ?? key,
                warning: optionalWarning,
                onClear: () => clearParamValue(key),
              })}
            </div>
          );
        })}
      </section>

      <div className="sectionDivider" />

      <section className="editSection">
        <label className="fieldLabel">Описание</label>
        <textarea
          className="descriptionArea"
          maxLength={1000}
          value={formState.description || ""}
          onChange={(e) => setForm({ ...formState, description: e.target.value })}
          placeholder="Описание"
        />
        <p className="charCount">{(formState.description || "").length} / 1000</p>

        <div className="aiBlock descriptionAi">
          <button type="button" className="aiBtn" onClick={handleDescriptionAi} disabled={descriptionAi.loading}>
            {descriptionAi.loading
              ? "Выполняется запрос"
              : descriptionAi.done
                ? "Повторить запрос"
                : formState.description
                  ? "Улучшить описание"
                  : "Придумать описание"}
          </button>

          {(descriptionAi.text || descriptionAi.error) && (
            <div className={`aiTooltip ${descriptionAi.error ? "error" : ""}`}>
              <h4>{descriptionAi.error ? "Произошла ошибка при запросе к AI" : "Ответ AI:"}</h4>
              <p>{descriptionAi.error || descriptionAi.text}</p>
              <div className="aiTooltipActions">
                {!descriptionAi.error && (
                  <button type="button" className="btnPrimary" onClick={() => setForm({ ...formState, description: descriptionAi.text })}>
                    Применить
                  </button>
                )}
                <button type="button" className="btnGhost" onClick={() => setDescriptionAi({ ...emptyAiState, done: true })}>
                  Закрыть
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="actions editActions">
        <button className="btnPrimary" onClick={onSave} disabled={saving || hasRequiredErrors}>
          Сохранить
        </button>
        <button className="btnGhost" onClick={() => navigate(`/ads/${id}`)} disabled={saving}>
          Отменить
        </button>
      </div>
    </main>
  );
}
