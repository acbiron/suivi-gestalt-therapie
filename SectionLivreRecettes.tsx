// src/components/SectionComptabilite.tsx
import { useMemo, useState } from "react";
import {
  AccountingCategory,
  AccountingData,
  AccountingEntry,
  AccountingEntryStatus,
  AccountingEntryType,
  AccountingPaymentMethod,
  Client,
  RecurringCharge,
} from "../types";

type Props = {
  data: AccountingData;
  clients: Client[];
  onSave: (next: AccountingData) => void;
};

const CATEGORIES: AccountingCategory[] = [
  "Assurance",
  "Banque",
  "Compte personnel",
  "Formation",
  "Loyer",
  "Paiement client",
  "Promotion",
  "Supervision",
  "Thérapie personnelle",
  "URSSAF",
  "Épargne",
  "Divers",
];

const PAYMENT_METHODS: AccountingPaymentMethod[] = [
  "virement",
  "cb",
  "espèces",
  "chèque",
  "prélèvement",
  "autre",
];

const ENTRY_TYPES: AccountingEntryType[] = ["entrée", "sortie"];
const ENTRY_STATUS: AccountingEntryStatus[] = ["réel", "à venir"];

function uid() {
  // @ts-ignore
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? // @ts-ignore
      crypto.randomUUID()
    : `acc_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n || 0);
}

function normalizeDateOnly(value?: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [d, m, y] = value.split("/");
    return `${y}-${m}-${d}`;
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
    const [y, m, d] = value.split("/");
    return `${y}-${m}-${d}`;
  }

  return value;
}

function formatDateFR(iso?: string) {
  if (!iso) return "—";
  const normalized = normalizeDateOnly(iso);
  const [y, m, d] = normalized.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function monthInputFromDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function matchesSelectedMonth(date?: string, selectedMonth?: string) {
  const normalized = normalizeDateOnly(date);
  if (!normalized || !selectedMonth) return false;
  return normalized.slice(0, 7) === selectedMonth;
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildMonthDate(year: number, month: number, day: number) {
  const safeDay = Math.max(
    1,
    Math.min(day || 1, getLastDayOfMonth(year, month))
  );
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(
    2,
    "0"
  )}`;
}

function shouldCreateRecurringForMonth(
  charge: RecurringCharge,
  selectedMonth: string
) {
  if (!charge.actif) return false;

  const [, monthStr] = selectedMonth.split("-");
  const selectedMonthNumber = Number(monthStr);

  if (charge.frequence === "mensuel") return true;
  if (charge.frequence === "annuel") {
    return (charge.moisAnnuel || 1) === selectedMonthNumber;
  }

  return false;
}

function entryAlreadyExistsForCharge(
  entries: AccountingEntry[],
  charge: RecurringCharge,
  date: string
) {
  return entries.some(
    (e) =>
      normalizeDateOnly(e.date) === date &&
      e.description === charge.nom &&
      e.categorie === charge.categorie &&
      e.type === "sortie"
  );
}

function getCategoryLabel(cat: AccountingCategory) {
  switch (cat) {
    case "Assurance":
      return "🦺 Assurance";
    case "Banque":
      return "🏦 Banque";
    case "Compte personnel":
      return "💖 Compte personnel";
    case "Formation":
      return "📔 Formation";
    case "Loyer":
      return "🏠 Loyer";
    case "Paiement client":
      return "💚 Paiement client";
    case "Promotion":
      return "🛍️ Promotion";
    case "Supervision":
      return "📚 Supervision";
    case "Thérapie personnelle":
      return "🤍 Thérapie personnelle";
    case "URSSAF":
      return "🧾 URSSAF";
    case "Épargne":
      return "🌱 Épargne";
    case "Divers":
    default:
      return "♾️ Divers";
  }
}

function categoryBadge(cat: AccountingCategory) {
  switch (cat) {
    case "Paiement client":
      return "bg-green-100 text-green-800";
    case "Loyer":
      return "bg-blue-100 text-blue-800";
    case "Formation":
      return "bg-violet-100 text-violet-800";
    case "Assurance":
      return "bg-indigo-100 text-indigo-800";
    case "Banque":
      return "bg-rose-100 text-rose-800";
    case "Promotion":
      return "bg-sky-100 text-sky-800";
    case "Supervision":
      return "bg-amber-100 text-amber-900";
    case "Thérapie personnelle":
      return "bg-pink-100 text-pink-800";
    case "URSSAF":
      return "bg-red-100 text-red-800";
    case "Compte personnel":
      return "bg-gray-100 text-gray-800";
    case "Épargne":
      return "bg-emerald-100 text-emerald-800";
    case "Divers":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function normalizeData(raw?: AccountingData): AccountingData {
  return {
    entries: Array.isArray(raw?.entries) ? raw.entries : [],
    recurringCharges: Array.isArray(raw?.recurringCharges)
      ? raw.recurringCharges
      : [
          {
            id: uid(),
            nom: "Formation",
            categorie: "Formation",
            type: "sortie",
            montant: undefined,
            frequence: "mensuel",
            jour: 5,
            statutParDefaut: "à venir",
            modePaiement: "prélèvement",
            actif: true,
          },
          {
            id: uid(),
            nom: "Assurance RC Pro",
            categorie: "Assurance",
            type: "sortie",
            montant: undefined,
            frequence: "mensuel",
            jour: 10,
            statutParDefaut: "à venir",
            modePaiement: "prélèvement",
            actif: true,
          },
          {
            id: uid(),
            nom: "Frais de tenue de compte",
            categorie: "Banque",
            type: "sortie",
            montant: undefined,
            frequence: "mensuel",
            jour: 15,
            statutParDefaut: "à venir",
            modePaiement: "prélèvement",
            actif: true,
          },
          {
            id: uid(),
            nom: "Supervision",
            categorie: "Supervision",
            type: "sortie",
            montant: undefined,
            frequence: "mensuel",
            jour: 20,
            statutParDefaut: "à venir",
            modePaiement: "virement",
            actif: true,
          },
          {
            id: uid(),
            nom: "Thérapie personnelle",
            categorie: "Thérapie personnelle",
            type: "sortie",
            montant: undefined,
            frequence: "mensuel",
            jour: 25,
            statutParDefaut: "à venir",
            modePaiement: "virement",
            actif: true,
          },
        ],
  };
}

function CollapsibleBlock({
  title,
  subtitle,
  defaultOpen = false,
  children,
  count,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white p-4 rounded-2xl shadow space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="font-bold text-lg">{title}</div>
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {count && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {count}
            </span>
          )}
          <span className="text-xl">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && <div>{children}</div>}
    </div>
  );
}

function EntryForm({
  clients,
  onAdd,
}: {
  clients: Client[];
  onAdd: (payload: {
    date: string;
    description: string;
    categorie: AccountingCategory;
    type: AccountingEntryType;
    statut: AccountingEntryStatus;
    montant: number;
    modePaiement: AccountingPaymentMethod;
    clientId?: string;
    notes?: string;
  }) => void;
}) {
  const activeClients = clients
    .filter((c) => !c.archived)
    .sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );

  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    categorie: "Paiement client" as AccountingCategory,
    type: "entrée" as AccountingEntryType,
    statut: "réel" as AccountingEntryStatus,
    montant: "",
    modePaiement: "virement" as AccountingPaymentMethod,
    clientId: "",
    notes: "",
  });

  const submit = () => {
    const amount = Number(draft.montant);

    if (
      !draft.date ||
      !draft.description.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Merci de renseigner une date, une description et un montant valide."
      );
      return;
    }

    onAdd({
      date: draft.date,
      description: draft.description.trim(),
      categorie: draft.categorie,
      type: draft.type,
      statut: draft.statut,
      montant: amount,
      modePaiement: draft.modePaiement,
      clientId: draft.clientId || undefined,
      notes: draft.notes.trim(),
    });

    setDraft({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      categorie: "Paiement client",
      type: "entrée",
      statut: "réel",
      montant: "",
      modePaiement: "virement",
      clientId: "",
      notes: "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Date</label>
        <input
          type="date"
          className="w-full border rounded p-2"
          value={draft.date}
          onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
        />
      </div>

      <div className="md:col-span-4">
        <label className="text-sm font-semibold text-gray-700">
          Description
        </label>
        <input
          className="w-full border rounded p-2"
          value={draft.description}
          onChange={(e) =>
            setDraft((d) => ({ ...d, description: e.target.value }))
          }
          placeholder="Ex : Paiement séance / Loyer / URSSAF..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Type</label>
        <select
          className="w-full border rounded p-2"
          value={draft.type}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              type: e.target.value as AccountingEntryType,
            }))
          }
        >
          {ENTRY_TYPES.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Statut</label>
        <select
          className="w-full border rounded p-2"
          value={draft.statut}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              statut: e.target.value as AccountingEntryStatus,
            }))
          }
        >
          {ENTRY_STATUS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Montant</label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded p-2"
          value={draft.montant}
          onChange={(e) => setDraft((d) => ({ ...d, montant: e.target.value }))}
        />
      </div>

      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">Catégorie</label>
        <select
          className="w-full border rounded p-2"
          value={draft.categorie}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              categorie: e.target.value as AccountingCategory,
            }))
          }
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">
          Mode de paiement
        </label>
        <select
          className="w-full border rounded p-2"
          value={draft.modePaiement}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              modePaiement: e.target.value as AccountingPaymentMethod,
            }))
          }
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">
          Client lié
        </label>
        <select
          className="w-full border rounded p-2"
          value={draft.clientId}
          onChange={(e) =>
            setDraft((d) => ({ ...d, clientId: e.target.value }))
          }
        >
          <option value="">-- Aucun --</option>
          {activeClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.prenom} {c.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">Notes</label>
        <input
          className="w-full border rounded p-2"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Optionnel"
        />
      </div>

      <div className="md:col-span-12 flex justify-end">
        <button
          onClick={submit}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-200 to-blue-200 shadow"
        >
          💾 Ajouter l’écriture
        </button>
      </div>
    </div>
  );
}

function MonthlyTreasuryChart({
  points,
  lowestPoint,
  highestPoint,
}: {
  points: { day: number; balance: number }[];
  lowestPoint: { day: number; balance: number } | null;
  highestPoint: { day: number; balance: number } | null;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-500">
        Pas de données pour ce mois.
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const paddingLeft = 64;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 32;

  const minBalance = Math.min(...points.map((p) => p.balance), 0);
  const maxBalance = Math.max(...points.map((p) => p.balance), 0);

  const range = maxBalance - minBalance || 1;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (day: number) => {
    if (points.length === 1) return paddingLeft;
    return (
      paddingLeft + ((day - 1) / Math.max(points.length - 1, 1)) * chartWidth
    );
  };

  const getY = (balance: number) => {
    return paddingTop + ((maxBalance - balance) / range) * chartHeight;
  };

  const linePath = points
    .map((point, index) => {
      const x = getX(point.day);
      const y = getY(point.balance);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const zeroY = getY(0);

  const xTicks = [1, 5, 10, 15, 20, 25, points.length].filter(
    (value, index, arr) =>
      arr.indexOf(value) === index && value <= points.length
  );

  const hoveredPoint =
    hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  const hoveredX = hoveredPoint ? getX(hoveredPoint.day) : null;
  const hoveredY = hoveredPoint ? getY(hoveredPoint.balance) : null;

  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[680px] h-auto"
          role="img"
          aria-label="Évolution prévisionnelle du mois"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="18"
            fill="white"
          />

          <line
            x1={paddingLeft}
            y1={getY(maxBalance)}
            x2={width - paddingRight}
            y2={getY(maxBalance)}
            stroke="#f3f4f6"
          />

          <line
            x1={paddingLeft}
            y1={zeroY}
            x2={width - paddingRight}
            y2={zeroY}
            stroke="#d1d5db"
            strokeDasharray="4 4"
          />

          <line
            x1={paddingLeft}
            y1={getY(minBalance)}
            x2={width - paddingRight}
            y2={getY(minBalance)}
            stroke="#f3f4f6"
          />

          <text x={8} y={getY(maxBalance) + 4} fontSize="11" fill="#6b7280">
            {formatEuro(maxBalance)}
          </text>

          <text x={8} y={getY(0) + 4} fontSize="11" fill="#6b7280">
            0 €
          </text>

          <text x={8} y={getY(minBalance) + 4} fontSize="11" fill="#6b7280">
            {formatEuro(minBalance)}
          </text>

          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point, index) => {
            const x = getX(point.day);
            const y = getY(point.balance);

            return (
              <circle
                key={point.day}
                cx={x}
                cy={y}
                r="10"
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
              />
            );
          })}

          {lowestPoint && (
            <circle
              cx={getX(lowestPoint.day)}
              cy={getY(lowestPoint.balance)}
              r="4.5"
              fill="#dc2626"
            />
          )}

          {highestPoint && (
            <circle
              cx={getX(highestPoint.day)}
              cy={getY(highestPoint.balance)}
              r="4.5"
              fill="#16a34a"
            />
          )}

          {hoveredPoint && hoveredX !== null && hoveredY !== null && (
            <>
              <line
                x1={hoveredX}
                y1={paddingTop}
                x2={hoveredX}
                y2={height - paddingBottom}
                stroke="#93c5fd"
                strokeDasharray="4 4"
              />

              <circle cx={hoveredX} cy={hoveredY} r="5" fill="#2563eb" />

              <g
                transform={`translate(${Math.min(
                  hoveredX + 12,
                  width - 150
                )}, ${Math.max(hoveredY - 50, 16)})`}
              >
                <rect
                  x="0"
                  y="0"
                  width="132"
                  height="42"
                  rx="10"
                  fill="#111827"
                  opacity="0.95"
                />
                <text x="10" y="17" fontSize="11" fill="white">
                  Jour {hoveredPoint.day}
                </text>
                <text x="10" y="31" fontSize="12" fill="white" fontWeight="700">
                  {formatEuro(hoveredPoint.balance)}
                </text>
              </g>
            </>
          )}

          {xTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={getX(tick)}
                y1={height - paddingBottom}
                x2={getX(tick)}
                y2={height - paddingBottom + 6}
                stroke="#9ca3af"
              />
              <text
                x={getX(tick)}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {tick}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {lowestPoint && (
          <div>
            Point bas :{" "}
            <strong>
              {formatEuro(lowestPoint.balance)} le {lowestPoint.day}
            </strong>
          </div>
        )}

        {highestPoint && (
          <div>
            Point haut :{" "}
            <strong>
              {formatEuro(highestPoint.balance)} le {highestPoint.day}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

function RecurringChargeForm({
  onAdd,
}: {
  onAdd: (payload: Partial<RecurringCharge>) => void;
}) {
  const [draft, setDraft] = useState<Partial<RecurringCharge>>({
    nom: "",
    categorie: "Divers",
    type: "sortie",
    montant: undefined,
    frequence: "mensuel",
    jour: 5,
    statutParDefaut: "à venir",
    modePaiement: "prélèvement",
    actif: true,
    notes: "",
  });

  return (
    <div className="border rounded-2xl p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">Nom</label>
        <input
          className="w-full border rounded p-2"
          value={draft.nom ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
          placeholder="Ex : Google Ads"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Catégorie</label>
        <select
          className="w-full border rounded p-2"
          value={draft.categorie ?? "Divers"}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              categorie: e.target.value as AccountingCategory,
            }))
          }
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">
          Montant prévu
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded p-2"
          value={draft.montant ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              montant: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
          placeholder="Variable possible"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Fréquence</label>
        <select
          className="w-full border rounded p-2"
          value={draft.frequence ?? "mensuel"}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              frequence: e.target.value as "mensuel" | "annuel",
            }))
          }
        >
          <option value="mensuel">mensuel</option>
          <option value="annuel">annuel</option>
        </select>
      </div>

      <div className="md:col-span-1">
        <label className="text-sm font-semibold text-gray-700">Jour</label>
        <input
          type="number"
          min={1}
          max={31}
          className="w-full border rounded p-2"
          value={draft.jour ?? 5}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              jour: e.target.value ? Number(e.target.value) : 5,
            }))
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">
          Statut par défaut
        </label>
        <select
          className="w-full border rounded p-2"
          value={draft.statutParDefaut ?? "à venir"}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              statutParDefaut: e.target.value as AccountingEntryStatus,
            }))
          }
        >
          <option value="à venir">à venir</option>
          <option value="réel">réel</option>
        </select>
      </div>

      <div className="md:col-span-12 flex justify-end">
        <button
          onClick={() => onAdd(draft)}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-200 to-blue-200 shadow"
        >
          ✅ Enregistrer
        </button>
      </div>
    </div>
  );
}

function RecurringChargeEditor({
  charge,
  onClose,
  onChange,
}: {
  charge: RecurringCharge;
  onClose: () => void;
  onChange: (patch: Partial<RecurringCharge>) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">Nom</label>
        <input
          className="w-full border rounded p-2"
          value={charge.nom}
          onChange={(e) => onChange({ nom: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Catégorie</label>
        <select
          className="w-full border rounded p-2"
          value={charge.categorie}
          onChange={(e) =>
            onChange({ categorie: e.target.value as AccountingCategory })
          }
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">
          Montant prévu
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded p-2"
          value={charge.montant ?? ""}
          onChange={(e) =>
            onChange({
              montant: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Fréquence</label>
        <select
          className="w-full border rounded p-2"
          value={charge.frequence}
          onChange={(e) =>
            onChange({ frequence: e.target.value as "mensuel" | "annuel" })
          }
        >
          <option value="mensuel">mensuel</option>
          <option value="annuel">annuel</option>
        </select>
      </div>

      <div className="md:col-span-1">
        <label className="text-sm font-semibold text-gray-700">Jour</label>
        <input
          type="number"
          min={1}
          max={31}
          className="w-full border rounded p-2"
          value={charge.jour ?? ""}
          onChange={(e) =>
            onChange({ jour: e.target.value ? Number(e.target.value) : 5 })
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">
          Statut défaut
        </label>
        <select
          className="w-full border rounded p-2"
          value={charge.statutParDefaut ?? "à venir"}
          onChange={(e) =>
            onChange({
              statutParDefaut: e.target.value as AccountingEntryStatus,
            })
          }
        >
          <option value="à venir">à venir</option>
          <option value="réel">réel</option>
        </select>
      </div>

      <div className="md:col-span-12 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white border"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function MonthEntryCard({
  entry,
  clients,
  onToggleStatus,
  onDelete,
  onSaveEdit,
}: {
  entry: AccountingEntry;
  clients: Client[];
  onToggleStatus: () => void;
  onDelete: () => void;
  onSaveEdit: (patch: Partial<AccountingEntry>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    date: normalizeDateOnly(entry.date),
    description: entry.description || "",
    categorie: entry.categorie,
    type: entry.type,
    statut: entry.statut,
    montant: String(entry.montant ?? ""),
    modePaiement: entry.modePaiement ?? "autre",
    clientId: entry.clientId ?? "",
    notes: entry.notes ?? "",
  });

  const activeClients = clients
    .filter((c) => !c.archived)
    .sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );

  const resetDraft = () => {
    setDraft({
      date: normalizeDateOnly(entry.date),
      description: entry.description || "",
      categorie: entry.categorie,
      type: entry.type,
      statut: entry.statut,
      montant: String(entry.montant ?? ""),
      modePaiement: entry.modePaiement ?? "autre",
      clientId: entry.clientId ?? "",
      notes: entry.notes ?? "",
    });
  };

  const saveEdit = () => {
    const montant = Number(draft.montant);

    if (
      !draft.date ||
      !draft.description.trim() ||
      !Number.isFinite(montant) ||
      montant <= 0
    ) {
      alert(
        "Merci de renseigner une date, une description et un montant valide."
      );
      return;
    }

    onSaveEdit({
      date: normalizeDateOnly(draft.date),
      description: draft.description.trim(),
      categorie: draft.categorie as AccountingCategory,
      type: draft.type as AccountingEntryType,
      statut: draft.statut as AccountingEntryStatus,
      montant,
      modePaiement: draft.modePaiement as AccountingPaymentMethod,
      clientId: draft.clientId || undefined,
      notes: draft.notes.trim(),
    });

    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-2xl border p-4 shadow-sm bg-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Date</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={draft.date}
              onChange={(e) =>
                setDraft((d) => ({ ...d, date: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <input
              className="w-full border rounded p-2"
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Type</label>
            <select
              className="w-full border rounded p-2"
              value={draft.type}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  type: e.target.value as AccountingEntryType,
                }))
              }
            >
              {ENTRY_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Statut
            </label>
            <select
              className="w-full border rounded p-2"
              value={draft.statut}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  statut: e.target.value as AccountingEntryStatus,
                }))
              }
            >
              {ENTRY_STATUS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Montant
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded p-2"
              value={draft.montant}
              onChange={(e) =>
                setDraft((d) => ({ ...d, montant: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Catégorie
            </label>
            <select
              className="w-full border rounded p-2"
              value={draft.categorie}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  categorie: e.target.value as AccountingCategory,
                }))
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Mode de paiement
            </label>
            <select
              className="w-full border rounded p-2"
              value={draft.modePaiement}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  modePaiement: e.target.value as AccountingPaymentMethod,
                }))
              }
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Client lié
            </label>
            <select
              className="w-full border rounded p-2"
              value={draft.clientId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, clientId: e.target.value }))
              }
            >
              <option value="">-- Aucun --</option>
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">Notes</label>
            <input
              className="w-full border rounded p-2"
              value={draft.notes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            onClick={() => {
              resetDraft();
              setIsEditing(false);
            }}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            Annuler
          </button>

          <button
            onClick={saveEdit}
            className="px-3 py-1 rounded-lg bg-blue-100 border border-blue-200"
          >
            💾 Enregistrer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        entry.statut === "à venir" ? "bg-amber-50 border-amber-200" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{entry.description}</span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${categoryBadge(
                entry.categorie
              )}`}
            >
              {getCategoryLabel(entry.categorie)}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                entry.type === "entrée"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {entry.type}
            </span>

            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {entry.statut}
            </span>
          </div>

          <div className="text-sm text-gray-600 flex flex-wrap gap-3">
            <span>📅 {formatDateFR(entry.date)}</span>
            <span>💶 {formatEuro(entry.montant || 0)}</span>
            {entry.modePaiement && <span>💳 {entry.modePaiement}</span>}
            {entry.clientLabel && <span>👤 {entry.clientLabel}</span>}
          </div>

          {entry.notes && (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {entry.notes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              resetDraft();
              setIsEditing(true);
            }}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            ✏️ Modifier
          </button>

          <button
            onClick={onToggleStatus}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            {entry.statut === "réel" ? "Passer à venir" : "Passer réel"}
          </button>

          <button
            onClick={onDelete}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SectionComptabilite({ data, clients, onSave }: Props) {
  const normalized = useMemo(() => normalizeData(data), [data]);
  const entries = normalized.entries;
  const recurringCharges = normalized.recurringCharges;

  const [selectedMonth, setSelectedMonth] = useState(
    monthInputFromDate(new Date())
  );
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(
    null
  );
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState(3000);
  const [searchTerm, setSearchTerm] = useState("");

  const saveAll = (next: AccountingData) => {
    onSave(next);
  };

  const currentState = useMemo(() => {
    const bankEntries = entries.filter(
      (e) => !(e.modePaiement === "espèces" && e.type === "entrée")
    );

    const soldeActuel = bankEntries
      .filter((e) => e.statut === "réel")
      .reduce(
        (sum, e) =>
          sum + (e.type === "entrée" ? e.montant || 0 : -(e.montant || 0)),
        0
      );

    const variationAVenir = bankEntries
      .filter((e) => e.statut === "à venir")
      .reduce(
        (sum, e) =>
          sum + (e.type === "entrée" ? e.montant || 0 : -(e.montant || 0)),
        0
      );

    return {
      soldeActuel,
      variationAVenir,
      soldePrevisionnel: soldeActuel + variationAVenir,
    };
  }, [entries]);

  const overdraftForecast = useMemo(() => {
    const upcoming = [...entries]
      .filter((e) => e.statut === "à venir")
      .sort((a, b) => {
        const dateA = normalizeDateOnly(a.date);
        const dateB = normalizeDateOnly(b.date);
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });

    let rolling = currentState.soldeActuel;
    let lowestBalance = rolling;
    let lowestDate = "";
    let firstOverdraftDate = "";
    let firstOverdraftBalance = 0;

    for (const entry of upcoming) {
      rolling +=
        entry.type === "entrée" ? entry.montant || 0 : -(entry.montant || 0);

      if (rolling < lowestBalance) {
        lowestBalance = rolling;
        lowestDate = normalizeDateOnly(entry.date);
      }

      if (!firstOverdraftDate && rolling < 0) {
        firstOverdraftDate = normalizeDateOnly(entry.date);
        firstOverdraftBalance = rolling;
      }
    }

    return {
      hasRisk: Boolean(firstOverdraftDate),
      firstOverdraftDate,
      firstOverdraftBalance,
      lowestBalance,
      lowestDate,
    };
  }, [entries, currentState.soldeActuel]);

  const lateClientPayments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return entries
      .filter(
        (e) =>
          e.categorie === "Paiement client" &&
          e.type === "entrée" &&
          e.statut === "à venir" &&
          normalizeDateOnly(e.date) < today
      )
      .sort((a, b) =>
        normalizeDateOnly(a.date).localeCompare(normalizeDateOnly(b.date))
      );
  }, [entries]);

  const savingsStats = useMemo(() => {
    const saved = entries
      .filter((e) => e.categorie === "Épargne" && e.type === "sortie")
      .reduce((sum, e) => sum + (e.montant || 0), 0);

    return {
      saved,
      goal: savingsGoal,
      progress:
        savingsGoal > 0 ? Math.min(100, (saved / savingsGoal) * 100) : 0,
      remaining: Math.max(0, savingsGoal - saved),
    };
  }, [entries, savingsGoal]);

  const cashStats = useMemo(() => {
    const cashEntries = entries.filter((e) => e.modePaiement === "espèces");

    const entrees = cashEntries
      .filter((e) => e.type === "entrée")
      .reduce((sum, e) => sum + (e.montant || 0), 0);

    const sorties = cashEntries
      .filter((e) => e.type === "sortie")
      .reduce((sum, e) => sum + (e.montant || 0), 0);

    return {
      entrees,
      sorties,
      solde: entrees - sorties,
    };
  }, [entries]);

  const clientStats = useMemo(() => {
    const map = new Map<
      string,
      {
        clientId: string;
        clientLabel: string;
        total: number;
        count: number;
        lastDate?: string;
      }
    >();

    entries
      .filter((e) => e.categorie === "Paiement client" && e.type === "entrée")
      .forEach((entry) => {
        const id = entry.clientId || "unknown";
        const label = entry.clientLabel || "Client non lié";

        const current = map.get(id) || {
          clientId: id,
          clientLabel: label,
          total: 0,
          count: 0,
          lastDate: undefined,
        };

        current.total += entry.montant || 0;
        current.count += 1;

        const normalizedDate = normalizeDateOnly(entry.date);

        if (!current.lastDate || normalizedDate > current.lastDate) {
          current.lastDate = normalizedDate;
        }

        map.set(id, current);
      });

    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [entries]);

  const monthEntries = useMemo(() => {
    return [...entries]
      .filter((e) => matchesSelectedMonth(e.date, selectedMonth))
      .sort((a, b) => {
        const dateA = normalizeDateOnly(a.date);
        const dateB = normalizeDateOnly(b.date);

        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });
  }, [entries, selectedMonth]);

  const filteredMonthEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return monthEntries;

    return monthEntries.filter((entry) => {
      const haystack = [
        entry.description,
        entry.categorie,
        entry.type,
        entry.statut,
        entry.modePaiement,
        entry.clientLabel,
        entry.notes,
        normalizeDateOnly(entry.date),
        formatDateFR(entry.date),
        String(entry.montant ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [monthEntries, searchTerm]);

  const monthEntriesAVenir = filteredMonthEntries.filter(
    (e) => e.statut === "à venir"
  );

  const monthEntriesReelles = filteredMonthEntries.filter(
    (e) => e.statut === "réel"
  );

  const monthlyCurveData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    const daysInMonth = getLastDayOfMonth(year, month);

    const monthAllEntries = [...entries]
      .filter((e) => !(e.modePaiement === "espèces" && e.type === "entrée"))
      .filter((e) => matchesSelectedMonth(e.date, selectedMonth))
      .sort((a, b) => {
        const dateA = normalizeDateOnly(a.date);
        const dateB = normalizeDateOnly(b.date);
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });

    const balanceBeforeMonth = entries
      .filter((e) => !(e.modePaiement === "espèces" && e.type === "entrée"))
      .filter((e) => {
        const d = normalizeDateOnly(e.date);
        return d && d.slice(0, 7) < selectedMonth;
      })
      .reduce(
        (sum, e) =>
          sum + (e.type === "entrée" ? e.montant || 0 : -(e.montant || 0)),
        0
      );

    const points: { day: number; balance: number }[] = [];
    let rolling = balanceBeforeMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${selectedMonth}-${String(day).padStart(2, "0")}`;

      const entriesOfDay = monthAllEntries.filter(
        (e) => normalizeDateOnly(e.date) === dayKey
      );

      entriesOfDay.forEach((entry) => {
        rolling +=
          entry.type === "entrée" ? entry.montant || 0 : -(entry.montant || 0);
      });

      points.push({
        day,
        balance: rolling,
      });
    }

    const lowestPoint =
      points.length > 0
        ? points.reduce((lowest, point) =>
            point.balance < lowest.balance ? point : lowest
          )
        : null;

    const highestPoint =
      points.length > 0
        ? points.reduce((highest, point) =>
            point.balance > highest.balance ? point : highest
          )
        : null;

    return {
      points,
      lowestPoint,
      highestPoint,
      balanceBeforeMonth,
      daysInMonth,
    };
  }, [entries, selectedMonth]);

  const dailyTreasuryRows = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (!year || !month) return [];

    const daysInMonth = getLastDayOfMonth(year, month);

    const monthAllEntries = [...entries]
      .filter((e) => matchesSelectedMonth(e.date, selectedMonth))
      .sort((a, b) => {
        const dateA = normalizeDateOnly(a.date);
        const dateB = normalizeDateOnly(b.date);
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });

    const balanceBeforeMonth = entries
      .filter((e) => {
        const d = normalizeDateOnly(e.date);
        return d && d.slice(0, 7) < selectedMonth;
      })
      .reduce(
        (sum, e) =>
          sum + (e.type === "entrée" ? e.montant || 0 : -(e.montant || 0)),
        0
      );

    const rows: {
      date: string;
      soldeDebut: number;
      entrees: number;
      sorties: number;
      soldeFin: number;
      entryCount: number;
    }[] = [];

    let rolling = balanceBeforeMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${selectedMonth}-${String(day).padStart(2, "0")}`;

      const entriesOfDay = monthAllEntries.filter(
        (e) => normalizeDateOnly(e.date) === dayKey
      );

      const soldeDebut = rolling;

      const entrees = entriesOfDay
        .filter((e) => e.type === "entrée")
        .reduce((sum, e) => sum + (e.montant || 0), 0);

      const sorties = entriesOfDay
        .filter((e) => e.type === "sortie")
        .reduce((sum, e) => sum + (e.montant || 0), 0);

      rolling = soldeDebut + entrees - sorties;

      rows.push({
        date: dayKey,
        soldeDebut,
        entrees,
        sorties,
        soldeFin: rolling,
        entryCount: entriesOfDay.length,
      });
    }

    return rows;
  }, [entries, selectedMonth]);

  const addEntry = (payload: {
    date: string;
    description: string;
    categorie: AccountingCategory;
    type: AccountingEntryType;
    statut: AccountingEntryStatus;
    montant: number;
    modePaiement: AccountingPaymentMethod;
    clientId?: string;
    notes?: string;
  }) => {
    const selectedClient = clients.find((c) => c.id === payload.clientId);

    const clientLabel = selectedClient
      ? `${selectedClient.prenom} ${selectedClient.nom}`
      : "";

    const entryId = uid();

    const nextEntry: AccountingEntry = {
      id: entryId,
      date: normalizeDateOnly(payload.date),
      description: payload.description,
      categorie: payload.categorie,
      type: payload.type,
      statut: payload.statut,
      montant: payload.montant,
      modePaiement: payload.modePaiement,
      clientId: selectedClient?.id,
      clientLabel,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    const nextEntries = [nextEntry, ...entries];

    const shouldCreateBankFee =
      nextEntry.type === "entrée" &&
      nextEntry.modePaiement === "cb" &&
      nextEntry.categorie === "Paiement client";

    if (shouldCreateBankFee) {
      nextEntries.unshift({
        id: uid(),
        date: nextEntry.date,
        description: `Frais CB – ${nextEntry.description}`,
        categorie: "Banque",
        type: "sortie",
        statut: nextEntry.statut,
        montant: 1.14,
        modePaiement: "prélèvement",
        clientId: nextEntry.clientId,
        clientLabel: nextEntry.clientLabel,
        createdAt: new Date().toISOString(),
        linkedEntryId: entryId,
      });
    }

    saveAll({
      entries: nextEntries,
      recurringCharges,
    });
  };

  const removeEntry = (id: string) => {
    const nextEntries = entries.filter(
      (e) => e.id !== id && e.linkedEntryId !== id
    );

    saveAll({
      entries: nextEntries,
      recurringCharges,
    });
  };
  const updateEntry = (id: string, patch: Partial<AccountingEntry>) => {
    const nextEntries: AccountingEntry[] = entries.map((entry) => {
      if (entry.id !== id) return entry;

      const nextClient =
        patch.clientId !== undefined
          ? clients.find((c) => c.id === patch.clientId)
          : clients.find((c) => c.id === entry.clientId);

      const nextClientLabel =
        patch.clientId === ""
          ? ""
          : nextClient
          ? `${nextClient.prenom} ${nextClient.nom}`
          : patch.clientId !== undefined
          ? ""
          : entry.clientLabel;

      return {
        ...entry,
        ...patch,
        date: patch.date ? normalizeDateOnly(patch.date) : entry.date,
        clientId:
          patch.clientId === ""
            ? undefined
            : patch.clientId !== undefined
            ? patch.clientId
            : entry.clientId,
        clientLabel: nextClientLabel,
      };
    });

    saveAll({
      entries: nextEntries,
      recurringCharges,
    });
  };

  const toggleEntryStatus = (id: string) => {
    const nextEntries: AccountingEntry[] = entries.map((e) =>
      e.id === id
        ? {
            ...e,
            statut:
              e.statut === "réel"
                ? ("à venir" as AccountingEntryStatus)
                : ("réel" as AccountingEntryStatus),
          }
        : e
    );

    saveAll({
      entries: nextEntries,
      recurringCharges,
    });
  };

  const generateRecurringForSelectedMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    const generatedEntries: AccountingEntry[] = [];

    recurringCharges.forEach((charge) => {
      if (!shouldCreateRecurringForMonth(charge, selectedMonth)) return;

      const date = buildMonthDate(year, month, charge.jour || 5);

      const exists = entryAlreadyExistsForCharge(entries, charge, date);
      if (exists) return;

      generatedEntries.push({
        id: uid(),
        date,
        description: charge.nom,
        categorie: charge.categorie,
        type: "sortie",
        statut: (charge.statutParDefaut ?? "à venir") as AccountingEntryStatus,
        montant: charge.montant ?? 0,
        modePaiement: charge.modePaiement,
        notes: charge.notes,
        createdAt: new Date().toISOString(),
      });
    });

    if (generatedEntries.length === 0) {
      alert("Aucune nouvelle charge fixe à générer pour ce mois.");
      return;
    }

    saveAll({
      entries: [...generatedEntries, ...entries],
      recurringCharges,
    });
  };

  const addRecurringCharge = (payload: Partial<RecurringCharge>) => {
    const nom = (payload.nom || "").trim();

    if (!nom) {
      alert("Merci de renseigner un nom pour la charge récurrente.");
      return;
    }

    const next: RecurringCharge = {
      id: uid(),
      nom,
      categorie: (payload.categorie as AccountingCategory) ?? "Divers",
      type: "sortie",
      montant:
        payload.montant !== undefined &&
        Number.isFinite(Number(payload.montant))
          ? Number(payload.montant)
          : undefined,
      frequence: payload.frequence === "annuel" ? "annuel" : "mensuel",
      jour:
        payload.jour !== undefined
          ? Math.max(1, Math.min(31, Number(payload.jour)))
          : 5,
      moisAnnuel:
        payload.frequence === "annuel" && payload.moisAnnuel
          ? Math.max(1, Math.min(12, Number(payload.moisAnnuel)))
          : undefined,
      statutParDefaut: payload.statutParDefaut === "réel" ? "réel" : "à venir",
      modePaiement: payload.modePaiement as AccountingPaymentMethod | undefined,
      actif: payload.actif !== false,
      notes: (payload.notes || "").trim(),
    };

    saveAll({
      entries,
      recurringCharges: [next, ...recurringCharges],
    });

    setShowRecurringForm(false);
  };

  const updateRecurringCharge = (
    id: string,
    patch: Partial<RecurringCharge>
  ) => {
    saveAll({
      entries,
      recurringCharges: recurringCharges.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });
  };

  const removeRecurringCharge = (id: string) => {
    saveAll({
      entries,
      recurringCharges: recurringCharges.filter((r) => r.id !== id),
    });
  };
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">💰 Compte Bancaire</h2>
            <p className="text-sm text-gray-600">
              Suivi simple du compte, du prévisionnel, de l’épargne et du
              chiffre d’affaires par client.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Mois</label>
            <input
              type="month"
              className="border rounded p-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-lg">➕ Ajouter une écriture</h3>

          <button
            type="button"
            onClick={generateRecurringForSelectedMonth}
            className="px-4 py-2 rounded-full bg-blue-100 border border-blue-200 shadow-sm"
          >
            🔁 Générer les charges fixes du mois
          </button>
        </div>

        <EntryForm clients={clients} onAdd={addEntry} />

        <div className="text-xs text-gray-500">
          Astuce : si tu saisis un paiement client en CB, l’app ajoute
          automatiquement une sortie de 1,14 € en “🏦 Banque”.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-gray-600">Solde actuel</div>
          <div
            className={`text-3xl font-extrabold mt-2 ${
              currentState.soldeActuel >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatEuro(currentState.soldeActuel)}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-gray-600">Variation à venir</div>
          <div
            className={`text-3xl font-extrabold mt-2 ${
              currentState.variationAVenir >= 0
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {formatEuro(currentState.variationAVenir)}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-gray-600">
            Solde après les opérations prévues
          </div>
          <div
            className={`text-3xl font-extrabold mt-2 ${
              currentState.soldePrevisionnel >= 0
                ? "text-blue-700"
                : "text-red-700"
            }`}
          >
            {formatEuro(currentState.soldePrevisionnel)}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-lg">
              📈 Évolution prévisionnelle du mois
            </h3>
            <p className="text-sm text-gray-600">
              Solde jour par jour pour le mois sélectionné.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Départ du mois : {formatEuro(monthlyCurveData.balanceBeforeMonth)}
          </div>
        </div>

        <MonthlyTreasuryChart
          points={monthlyCurveData.points}
          lowestPoint={monthlyCurveData.lowestPoint}
          highestPoint={monthlyCurveData.highestPoint}
        />
      </div>

      <CollapsibleBlock
        title="📅 Trésorerie jour par jour"
        subtitle="Vision détaillée du mois, avec entrées, sorties et solde de fin de journée."
        count={`${dailyTreasuryRows.length} jours`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Début</th>
                <th className="py-2 px-3">Entrées</th>
                <th className="py-2 px-3">Sorties</th>
                <th className="py-2 px-3">Fin</th>
                <th className="py-2 px-3">Nb</th>
              </tr>
            </thead>

            <tbody>
              {dailyTreasuryRows.map((row) => {
                const hasMovement = row.entrees > 0 || row.sorties > 0;

                return (
                  <tr
                    key={row.date}
                    className={`${
                      hasMovement ? "bg-white shadow-sm" : "bg-gray-50/70"
                    }`}
                  >
                    <td className="py-3 px-3 rounded-l-2xl whitespace-nowrap font-medium text-gray-800">
                      {formatDateFR(row.date)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-gray-700">
                      {formatEuro(row.soldeDebut)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.entrees > 0 ? (
                        <span className="inline-flex px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                          + {formatEuro(row.entrees)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.sorties > 0 ? (
                        <span className="inline-flex px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                          - {formatEuro(row.sorties)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td
                      className={`py-3 px-3 whitespace-nowrap font-bold ${
                        row.soldeFin >= 0 ? "text-gray-900" : "text-red-700"
                      }`}
                    >
                      {formatEuro(row.soldeFin)}
                    </td>

                    <td className="py-3 px-3 rounded-r-2xl whitespace-nowrap text-gray-500">
                      {row.entryCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleBlock>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h3 className="font-bold text-lg">⚠️ Risque de découvert</h3>

        {overdraftForecast.hasRisk ? (
          <>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="text-sm text-gray-600">Premier risque</div>

              <div className="text-xl font-bold text-red-700 mt-1">
                {formatDateFR(overdraftForecast.firstOverdraftDate)}
              </div>

              <div className="text-sm text-gray-700 mt-1">
                Solde estimé :{" "}
                {formatEuro(overdraftForecast.firstOverdraftBalance)}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Point le plus bas prévu :{" "}
              <strong>{formatEuro(overdraftForecast.lowestBalance)}</strong>
              {overdraftForecast.lowestDate
                ? ` le ${formatDateFR(overdraftForecast.lowestDate)}`
                : ""}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 font-medium">
            ✅ Aucun découvert prévisionnel détecté.
          </div>
        )}
      </div>

      {lateClientPayments.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow space-y-3">
          <h3 className="font-bold text-lg">⏰ Paiements client en retard</h3>

          <div className="space-y-2">
            {lateClientPayments.map((entry) => (
              <div
                key={entry.id}
                className="border border-amber-200 bg-amber-50 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2"
              >
                <div>
                  <div className="font-semibold">{entry.description}</div>
                  <div className="text-sm text-gray-600">
                    prévu le {formatDateFR(entry.date)}
                    {entry.clientLabel && ` · ${entry.clientLabel}`}
                  </div>
                </div>

                <div className="text-amber-800 font-bold">
                  {formatEuro(entry.montant || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-lg">🌱 Épargne</h3>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Objectif</label>

            <input
              type="number"
              min={0}
              step="50"
              className="border rounded p-2 w-32"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow space-y-3">
          <h3 className="font-bold text-lg">💵 Espèces</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="text-sm text-gray-600">Entrées espèces</div>
              <div className="text-xl font-bold text-green-700 mt-1">
                {formatEuro(cashStats.entrees)}
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="text-sm text-gray-600">Sorties espèces</div>
              <div className="text-xl font-bold text-red-700 mt-1">
                {formatEuro(cashStats.sorties)}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm text-gray-600">Solde espèces</div>
              <div
                className={`text-xl font-bold mt-1 ${
                  cashStats.solde >= 0 ? "text-amber-700" : "text-red-700"
                }`}
              >
                {formatEuro(cashStats.solde)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-gray-600">Épargne actuelle</div>

            <div className="text-2xl font-bold mt-1 text-green-700">
              {formatEuro(savingsStats.saved)}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Reste : <strong>{formatEuro(savingsStats.remaining)}</strong>
          </div>
        </div>

        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border">
          <div
            className="h-full bg-green-400 transition-all"
            style={{ width: `${savingsStats.progress}%` }}
          />
        </div>

        <div className="text-sm text-gray-600">
          {Math.round(savingsStats.progress)}% de l’objectif (
          {formatEuro(savingsStats.goal)})
        </div>
      </div>

      <CollapsibleBlock
        title="👤 Chiffre d’affaires par client"
        subtitle="Repliable pour éviter trop de scroll."
        count={`${clientStats.length}`}
      >
        {clientStats.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucun paiement client enregistré.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {clientStats.map((row) => (
              <div
                key={`${row.clientId}-${row.clientLabel}`}
                className="border rounded-2xl p-4 bg-gray-50"
              >
                <div className="font-semibold">{row.clientLabel}</div>

                <div className="text-sm text-gray-600 mt-1">
                  {row.count} paiement{row.count > 1 ? "s" : ""}
                </div>

                <div className="text-sm text-gray-600">
                  {row.lastDate
                    ? `Dernier : ${formatDateFR(row.lastDate)}`
                    : "—"}
                </div>

                <div className="text-lg font-bold text-green-700 mt-3">
                  {formatEuro(row.total)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleBlock>

      <CollapsibleBlock
        title="🔁 Charges récurrentes"
        subtitle="Tu peux les générer ensuite dans le mois choisi."
        count={`${recurringCharges.length}`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="text-sm text-gray-600">
            Les modèles servent à préparer le mois. Tu peux modifier ensuite le
            montant dans les vraies écritures du mois.
          </div>

          <button
            onClick={() => setShowRecurringForm((v) => !v)}
            className="px-4 py-2 rounded-full bg-white border shadow-sm"
          >
            {showRecurringForm ? "Fermer" : "➕ Ajouter une charge récurrente"}
          </button>
        </div>

        {showRecurringForm && (
          <RecurringChargeForm onAdd={addRecurringCharge} />
        )}

        {recurringCharges.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune charge récurrente.</div>
        ) : (
          <div className="space-y-3">
            {recurringCharges.map((charge) => {
              const isEditing = editingRecurringId === charge.id;

              return (
                <div
                  key={charge.id}
                  className={`border rounded-2xl p-4 ${
                    charge.actif ? "bg-gray-50" : "bg-gray-100/70"
                  }`}
                >
                  {isEditing ? (
                    <RecurringChargeEditor
                      charge={charge}
                      onClose={() => setEditingRecurringId(null)}
                      onChange={(patch) =>
                        updateRecurringCharge(charge.id, patch)
                      }
                    />
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{charge.nom}</span>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${categoryBadge(
                              charge.categorie
                            )}`}
                          >
                            {getCategoryLabel(charge.categorie)}
                          </span>

                          {!charge.actif && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                          <span>💸 {formatEuro(charge.montant ?? 0)}</span>
                          <span>🔁 {charge.frequence}</span>
                          <span>📅 Jour {charge.jour ?? "—"}</span>
                          <span>🕓 {charge.statutParDefaut ?? "à venir"}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditingRecurringId(charge.id)}
                          className="px-3 py-1 rounded-lg bg-white border"
                        >
                          ✏️ Modifier
                        </button>

                        <button
                          onClick={() =>
                            updateRecurringCharge(charge.id, {
                              actif: !charge.actif,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-white border"
                        >
                          {charge.actif ? "Désactiver" : "Activer"}
                        </button>

                        <button
                          onClick={() => removeRecurringCharge(charge.id)}
                          className="px-3 py-1 rounded-lg bg-white border"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleBlock>

      <CollapsibleBlock
        title="📒 Écritures du mois sélectionné"
        subtitle="Tu peux revoir les mois passés, en cours ou à venir."
        defaultOpen
        count={`${filteredMonthEntries.length}`}
      >
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            🔎 Rechercher dans les écritures du mois
          </label>
          <input
            className="w-full border rounded p-2"
            placeholder="Ex : Julie, URSSAF, espèces, 45, séance..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredMonthEntries.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucune écriture pour ce mois.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-amber-700 mb-2">
                🟡 À venir ({monthEntriesAVenir.length})
              </h4>

              {monthEntriesAVenir.length === 0 ? (
                <div className="text-sm text-gray-400">
                  Aucune écriture à venir
                </div>
              ) : (
                <div className="space-y-3">
                  {monthEntriesAVenir.map((entry) => (
                    <MonthEntryCard
                      key={entry.id}
                      entry={entry}
                      clients={clients}
                      onToggleStatus={() => toggleEntryStatus(entry.id)}
                      onDelete={() => removeEntry(entry.id)}
                      onSaveEdit={(patch) => updateEntry(entry.id, patch)}
                    />
                  ))}
                </div>
              )}
            </div>

            <CollapsibleBlock
              title="✔ Réel"
              subtitle="Écritures déjà passées"
              count={`${monthEntriesReelles.length}`}
            >
              {monthEntriesReelles.length === 0 ? (
                <div className="text-sm text-gray-400">
                  Aucune écriture réelle
                </div>
              ) : (
                <div className="space-y-3">
                  {monthEntriesReelles.map((entry) => (
                    <MonthEntryCard
                      key={entry.id}
                      entry={entry}
                      clients={clients}
                      onToggleStatus={() => toggleEntryStatus(entry.id)}
                      onDelete={() => removeEntry(entry.id)}
                      onSaveEdit={(patch) => updateEntry(entry.id, patch)}
                    />
                  ))}
                </div>
              )}
            </CollapsibleBlock>
          </div>
        )}
      </CollapsibleBlock>
    </div>
  );
}
