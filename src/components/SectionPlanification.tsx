import { useEffect, useMemo, useState } from "react";
import {
  Appointment,
  AppointmentKind,
  AppointmentLocation,
  AppointmentStatus,
  Client,
  PlanningData,
} from "../types";

type Props = {
  data?: PlanningData;
  clients: Client[];
  onSave: (next: PlanningData) => void;
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  "prévu",
  "confirmé",
  "annulé",
  "reporté",
  "réalisé",
];

const LOCATION_OPTIONS: AppointmentLocation[] = [
  "cabinet",
  "visio",
  "téléphone",
  "perso",
  "autre",
];

const APPOINTMENT_KIND_OPTIONS: AppointmentKind[] = [
  "séance",
  "thérapie perso",
  "supervision",
  "perso",
  "autre",
];

function uid() {
  // @ts-ignore
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? // @ts-ignore
      crypto.randomUUID()
    : `rdv_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function normalizePlanningData(raw?: PlanningData): PlanningData {
  return {
    appointments: Array.isArray(raw?.appointments) ? raw.appointments : [],
  };
}

function normalizeDateOnly(value?: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return value;
}

function formatDateFR(iso?: string) {
  if (!iso) return "—";
  const normalized = normalizeDateOnly(iso);
  const [y, m, d] = normalized.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function formatStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "prévu":
      return "🕓 Prévu";
    case "confirmé":
      return "✅ Confirmé";
    case "annulé":
      return "❌ Annulé";
    case "reporté":
      return "🔁 Reporté";
    case "réalisé":
      return "✨ Réalisé";
    default:
      return status;
  }
}

function statusBadge(status: AppointmentStatus) {
  switch (status) {
    case "prévu":
      return "bg-gray-100 text-gray-700";
    case "confirmé":
      return "bg-green-100 text-green-800";
    case "annulé":
      return "bg-red-100 text-red-800";
    case "reporté":
      return "bg-blue-100 text-blue-800";
    case "réalisé":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatLocationLabel(location: AppointmentLocation) {
  switch (location) {
    case "cabinet":
      return "🏠 Cabinet";
    case "visio":
      return "💻 Visio";
    case "téléphone":
      return "📞 Téléphone";
    case "perso":
      return "🚗 Perso";
    case "autre":
    default:
      return "📍 Autre";
  }
}

function locationBadge(location: AppointmentLocation) {
  switch (location) {
    case "cabinet":
      return "bg-pink-100 text-pink-800 border-pink-200";
    case "visio":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "téléphone":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "perso":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "autre":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatKindLabel(kind: AppointmentKind) {
  switch (kind) {
    case "séance":
      return "🛋️ Séance";
    case "thérapie perso":
      return "🤍 Thérapie perso";
    case "supervision":
      return "📚 Supervision";
    case "perso":
      return "🌿 Perso";
    case "autre":
    default:
      return "🗂️ Autre";
  }
}

function kindBadge(kind: AppointmentKind) {
  switch (kind) {
    case "séance":
      return "bg-emerald-100 text-emerald-800";
    case "thérapie perso":
      return "bg-pink-100 text-pink-800";
    case "supervision":
      return "bg-violet-100 text-violet-800";
    case "perso":
      return "bg-amber-100 text-amber-800";
    case "autre":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function isTomorrow(dateStr?: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const iso = tomorrow.toISOString().slice(0, 10);
  return normalizeDateOnly(dateStr) === iso;
}

function isPast(dateStr?: string) {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return normalizeDateOnly(dateStr) < today;
}

function isInCurrentWeek(dateStr?: string) {
  if (!dateStr) return false;

  const target = new Date(`${normalizeDateOnly(dateStr)}T12:00:00`);
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return target >= monday && target <= sunday;
}

function getWeekStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + mondayOffset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatWeekRangeLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  return `Semaine du ${formatDateFR(toIsoDate(weekStart))} au ${formatDateFR(
    toIsoDate(weekEnd)
  )}`;
}

function getAppointmentSessionNumber(
  appointment: Appointment,
  appointments: Appointment[]
) {
  if (!appointment.clientId) return null;

  const countedStatuses: AppointmentStatus[] = ["confirmé", "réalisé"];

  if (!countedStatuses.includes(appointment.statut)) {
    return null;
  }

  const sameClientAppointments = appointments
    .filter(
      (a) =>
        a.clientId === appointment.clientId &&
        countedStatuses.includes(a.statut) &&
        a.typeRdv === "séance"
    )
    .sort((a, b) => {
      const dateA = normalizeDateOnly(a.date);
      const dateB = normalizeDateOnly(b.date);

      if (dateA !== dateB) return dateA.localeCompare(dateB);
      if (a.heure !== b.heure) return a.heure.localeCompare(b.heure);
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });

  const index = sameClientAppointments.findIndex(
    (a) => a.id === appointment.id
  );

  return index >= 0 ? index + 1 : null;
}

function AppointmentForm({
  clients,
  onAdd,
  prefilledDate,
}: {
  clients: Client[];
  onAdd: (
    payload: Omit<Appointment, "id" | "createdAt" | "clientLabel">
  ) => void;
  prefilledDate?: string;
}) {
  const activeClients = clients
    .filter((c) => !c.archived)
    .sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );

  const [draft, setDraft] = useState({
    typeRdv: "séance" as AppointmentKind,
    clientId: "",
    date: prefilledDate || new Date().toISOString().slice(0, 10),

    heure: "09:00",
    dureeMinutes: 60,
    statut: "prévu" as AppointmentStatus,
    lieu: "cabinet" as AppointmentLocation,
    notes: "",
  });
  useEffect(() => {
    if (!prefilledDate) return;

    setDraft((current) => ({
      ...current,
      date: prefilledDate,
    }));
  }, [prefilledDate]);

  const submit = () => {
    if (!draft.date || !draft.heure || !draft.dureeMinutes) {
      alert("Merci de renseigner la date, l’heure et la durée.");
      return;
    }

    if (draft.typeRdv === "séance" && !draft.clientId) {
      alert("Merci de choisir un client pour une séance.");
      return;
    }

    onAdd({
      typeRdv: draft.typeRdv,
      clientId: draft.clientId || undefined,
      date: normalizeDateOnly(draft.date),
      heure: draft.heure,
      dureeMinutes: Number(draft.dureeMinutes) || 60,
      statut: draft.statut,
      lieu: draft.lieu,
      notes: draft.notes.trim(),
    });

    setDraft({
      typeRdv: "séance",
      clientId: "",
      date: prefilledDate || new Date().toISOString().slice(0, 10),
      heure: "09:00",
      dureeMinutes: 60,
      statut: "prévu",
      lieu: "cabinet",
      notes: "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">
          Type de rendez-vous
        </label>
        <select
          className="w-full border rounded p-2"
          value={draft.typeRdv}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              typeRdv: e.target.value as AppointmentKind,
              clientId: e.target.value === "séance" ? d.clientId : "",
            }))
          }
        >
          {APPOINTMENT_KIND_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {formatKindLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <label className="text-sm font-semibold text-gray-700">Client</label>
        <select
          className="w-full border rounded p-2"
          value={draft.clientId}
          disabled={draft.typeRdv !== "séance"}
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

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Date</label>
        <input
          type="date"
          className="w-full border rounded p-2"
          value={draft.date}
          onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Heure</label>
        <input
          type="time"
          className="w-full border rounded p-2"
          value={draft.heure}
          onChange={(e) => setDraft((d) => ({ ...d, heure: e.target.value }))}
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Durée</label>
        <input
          type="number"
          min={15}
          step={15}
          className="w-full border rounded p-2"
          value={draft.dureeMinutes}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              dureeMinutes: Number(e.target.value) || 60,
            }))
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Statut</label>
        <select
          className="w-full border rounded p-2"
          value={draft.statut}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              statut: e.target.value as AppointmentStatus,
            }))
          }
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {formatStatusLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-gray-700">Lieu</label>
        <select
          className="w-full border rounded p-2"
          value={draft.lieu}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              lieu: e.target.value as AppointmentLocation,
            }))
          }
        >
          {LOCATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {formatLocationLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-8">
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
          ✅ Ajouter le rendez-vous
        </button>
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  appointments,
  clients,
  onUpdate,
  onDelete,
}: {
  appointment: Appointment;
  appointments: Appointment[];
  clients: Client[];
  onUpdate: (id: string, patch: Partial<Appointment>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const activeClients = clients
    .filter((c) => !c.archived)
    .sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );

  const sessionNumber = getAppointmentSessionNumber(appointment, appointments);

  const [draft, setDraft] = useState({
    typeRdv: appointment.typeRdv,
    clientId: appointment.clientId ?? "",
    date: normalizeDateOnly(appointment.date),
    heure: appointment.heure,
    dureeMinutes: appointment.dureeMinutes,
    statut: appointment.statut,
    lieu: appointment.lieu,
    notes: appointment.notes ?? "",
  });

  const resetDraft = () => {
    setDraft({
      typeRdv: appointment.typeRdv,
      clientId: appointment.clientId ?? "",
      date: normalizeDateOnly(appointment.date),
      heure: appointment.heure,
      dureeMinutes: appointment.dureeMinutes,
      statut: appointment.statut,
      lieu: appointment.lieu,
      notes: appointment.notes ?? "",
    });
  };

  const saveEdit = () => {
    if (!draft.date || !draft.heure || !draft.dureeMinutes) {
      alert("Merci de renseigner la date, l’heure et la durée.");
      return;
    }

    if (draft.typeRdv === "séance" && !draft.clientId) {
      alert("Merci de choisir un client pour une séance.");
      return;
    }

    onUpdate(appointment.id, {
      typeRdv: draft.typeRdv as AppointmentKind,
      clientId:
        draft.typeRdv === "séance" ? draft.clientId || undefined : undefined,
      date: normalizeDateOnly(draft.date),
      heure: draft.heure,
      dureeMinutes: Number(draft.dureeMinutes) || 60,
      statut: draft.statut as AppointmentStatus,
      lieu: draft.lieu as AppointmentLocation,
      notes: draft.notes.trim(),
    });

    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-2xl border p-4 bg-white shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Type de rendez-vous
            </label>
            <select
              className="w-full border rounded p-2"
              value={draft.typeRdv}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  typeRdv: e.target.value as AppointmentKind,
                  clientId: e.target.value === "séance" ? d.clientId : "",
                }))
              }
            >
              {APPOINTMENT_KIND_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {formatKindLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Client
            </label>
            <select
              className="w-full border rounded p-2"
              value={draft.clientId}
              disabled={draft.typeRdv !== "séance"}
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

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Heure</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={draft.heure}
              onChange={(e) =>
                setDraft((d) => ({ ...d, heure: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Durée</label>
            <input
              type="number"
              min={15}
              step={15}
              className="w-full border rounded p-2"
              value={draft.dureeMinutes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dureeMinutes: Number(e.target.value) || 60,
                }))
              }
            />
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
                  statut: e.target.value as AppointmentStatus,
                }))
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {formatStatusLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Lieu</label>
            <select
              className="w-full border rounded p-2"
              value={draft.lieu}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  lieu: e.target.value as AppointmentLocation,
                }))
              }
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {formatLocationLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-8">
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

        <div className="flex justify-end gap-2 flex-wrap">
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
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {appointment.heure} ·{" "}
              {appointment.clientLabel || "Client non renseigné"}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${statusBadge(
                appointment.statut
              )}`}
            >
              {formatStatusLabel(appointment.statut)}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${kindBadge(
                appointment.typeRdv
              )}`}
            >
              {formatKindLabel(appointment.typeRdv)}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full border ${locationBadge(
                appointment.lieu
              )}`}
            >
              {formatLocationLabel(appointment.lieu)}
            </span>

            {sessionNumber && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                Séance {sessionNumber}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 flex flex-wrap gap-3">
            <span>📅 {formatDateFR(appointment.date)}</span>
            <span>⏱️ {appointment.dureeMinutes} min</span>
          </div>

          {appointment.notes && (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {appointment.notes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onUpdate(appointment.id, { statut: "confirmé" })}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            Confirmer
          </button>

          <button
            onClick={() => onUpdate(appointment.id, { statut: "reporté" })}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            Reporter
          </button>

          <button
            onClick={() => onUpdate(appointment.id, { statut: "annulé" })}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            Annuler
          </button>

          <button
            onClick={() => onUpdate(appointment.id, { statut: "réalisé" })}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            Réalisée
          </button>

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
            onClick={() => onDelete(appointment.id)}
            className="px-3 py-1 rounded-lg bg-white border"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklyCalendar({
  weekStart,
  appointments,
  onSelectDate,
}: {
  weekStart: Date;
  appointments: Appointment[];
  onSelectDate?: (isoDate: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const byDay = days.map((day) => {
    const iso = toIsoDate(day);
    return {
      day,
      iso,
      appointments: appointments
        .filter((a) => normalizeDateOnly(a.date) === iso)
        .sort((a, b) => a.heure.localeCompare(b.heure)),
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {byDay.map(({ day, iso, appointments: items }) => (
        <div key={iso} className="rounded-2xl border bg-white overflow-hidden">
          <div className="px-3 py-3 bg-gray-50 border-b">
            <div className="font-semibold capitalize">
              {formatShortDay(day)}
            </div>
            {onSelectDate && (
              <button
                type="button"
                onClick={() => onSelectDate(iso)}
                className="mt-2 text-xs px-2 py-1 rounded-full bg-white border"
              >
                ➕ Ajouter ici
              </button>
            )}
          </div>

          <div className="p-3 space-y-2 min-h-[180px]">
            {items.length === 0 ? (
              <div className="text-sm text-gray-400">Aucun rendez-vous</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-2 text-sm ${
                    item.lieu === "cabinet"
                      ? "bg-pink-50 border-pink-200"
                      : item.lieu === "visio"
                      ? "bg-sky-50 border-sky-200"
                      : item.lieu === "perso"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="font-semibold">{item.heure}</div>
                  <div className="truncate">{item.clientLabel}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatKindLabel(item.typeRdv)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatLocationLabel(item.lieu)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SectionPlanification({ data, clients, onSave }: Props) {
  const normalized = useMemo(() => normalizePlanningData(data), [data]);
  const appointments = normalized.appointments;

  const [viewMode, setViewMode] = useState<"liste" | "semaine">("liste");
  const [weekAnchorDate, setWeekAnchorDate] = useState(new Date());
  const [prefilledDate, setPrefilledDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const saveAll = (next: PlanningData) => {
    onSave(next);
  };

  const addAppointment = (
    payload: Omit<Appointment, "id" | "createdAt" | "clientLabel">
  ) => {
    const selectedClient = clients.find((c) => c.id === payload.clientId);

    const clientLabel =
      payload.typeRdv === "séance"
        ? selectedClient
          ? `${selectedClient.prenom} ${selectedClient.nom}`
          : "Client non renseigné"
        : formatKindLabel(payload.typeRdv);

    const nextAppointment: Appointment = {
      id: uid(),
      clientId: payload.typeRdv === "séance" ? payload.clientId : undefined,
      clientLabel,
      date: normalizeDateOnly(payload.date),
      heure: payload.heure,
      dureeMinutes: payload.dureeMinutes,
      statut: payload.statut,
      lieu: payload.lieu,
      typeRdv: payload.typeRdv,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    saveAll({
      appointments: [nextAppointment, ...appointments],
    });
  };

  const updateAppointment = (id: string, patch: Partial<Appointment>) => {
    const nextAppointments = appointments.map((appointment) => {
      if (appointment.id !== id) return appointment;

      const nextType = (patch.typeRdv ??
        appointment.typeRdv) as AppointmentKind;

      const nextClient =
        patch.clientId !== undefined
          ? clients.find((c) => c.id === patch.clientId)
          : clients.find((c) => c.id === appointment.clientId);

      const nextClientLabel =
        nextType === "séance"
          ? patch.clientId === ""
            ? "Client non renseigné"
            : nextClient
            ? `${nextClient.prenom} ${nextClient.nom}`
            : patch.clientId !== undefined
            ? "Client non renseigné"
            : appointment.clientLabel
          : formatKindLabel(nextType);

      return {
        ...appointment,
        ...patch,
        typeRdv: nextType,
        date: patch.date ? normalizeDateOnly(patch.date) : appointment.date,
        clientId:
          nextType === "séance"
            ? patch.clientId === ""
              ? undefined
              : patch.clientId !== undefined
              ? patch.clientId
              : appointment.clientId
            : undefined,
        clientLabel: nextClientLabel,
      };
    });

    saveAll({
      appointments: nextAppointments,
    });
  };

  const removeAppointment = (id: string) => {
    saveAll({
      appointments: appointments.filter((a) => a.id !== id),
    });
  };

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = normalizeDateOnly(a.date);
      const dateB = normalizeDateOnly(b.date);

      if (dateA !== dateB) return dateA.localeCompare(dateB);
      if (a.heure !== b.heure) return a.heure.localeCompare(b.heure);
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sortedAppointments.filter(
      (a) => normalizeDateOnly(a.date) === today
    );
  }, [sortedAppointments]);

  const weekAppointments = useMemo(() => {
    return sortedAppointments.filter((a) => isInCurrentWeek(a.date));
  }, [sortedAppointments]);

  const toConfirm = useMemo(() => {
    return sortedAppointments.filter((a) => a.statut === "prévu");
  }, [sortedAppointments]);

  const toRemind = useMemo(() => {
    return sortedAppointments.filter(
      (a) =>
        isTomorrow(a.date) && a.statut !== "confirmé" && a.statut !== "annulé"
    );
  }, [sortedAppointments]);

  const pastNotDone = useMemo(() => {
    return sortedAppointments.filter(
      (a) => isPast(a.date) && a.statut !== "réalisé" && a.statut !== "annulé"
    );
  }, [sortedAppointments]);

  const toReschedule = useMemo(() => {
    return sortedAppointments.filter(
      (a) => a.statut === "annulé" || a.statut === "reporté"
    );
  }, [sortedAppointments]);

  const weekStart = useMemo(
    () => getWeekStart(weekAnchorDate),
    [weekAnchorDate]
  );

  const displayedWeekAppointments = useMemo(() => {
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(addDays(weekStart, 6));

    return sortedAppointments.filter((a) => {
      const d = normalizeDateOnly(a.date);
      return d >= startIso && d <= endIso;
    });
  }, [sortedAppointments, weekStart]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">🗓️ Planification</h2>
            <p className="text-sm text-gray-600">
              Gestion simple des rendez-vous, confirmations et suivis.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            {appointments.length} rendez-vous enregistrés
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Aujourd’hui</div>
          <div className="text-2xl font-bold mt-1">
            {todayAppointments.length}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">Cette semaine</div>
          <div className="text-2xl font-bold mt-1">
            {weekAppointments.length}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">À confirmer</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">
            {toConfirm.length}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-600">À relancer</div>
          <div className="text-2xl font-bold mt-1 text-red-700">
            {toRemind.length}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <h3 className="font-bold text-lg">➕ Nouveau rendez-vous</h3>
        <AppointmentForm
          clients={clients}
          onAdd={addAppointment}
          prefilledDate={prefilledDate}
        />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <h3 className="font-bold text-lg">👀 À traiter</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="font-semibold">Demain non confirmés</div>
            <div className="text-2xl font-bold mt-2">{toRemind.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              Séances de demain à confirmer ou relancer.
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="font-semibold">Passés non réalisés</div>
            <div className="text-2xl font-bold mt-2">{pastNotDone.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              Rendez-vous passés à vérifier.
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="font-semibold">À reprogrammer</div>
            <div className="text-2xl font-bold mt-2">{toReschedule.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              Annulations et reports à replacer.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-lg">🧭 Vue planning</h3>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode("liste")}
              className={`px-3 py-2 rounded-full border ${
                viewMode === "liste"
                  ? "bg-pink-100 border-pink-200"
                  : "bg-white"
              }`}
            >
              Liste
            </button>

            <button
              type="button"
              onClick={() => setViewMode("semaine")}
              className={`px-3 py-2 rounded-full border ${
                viewMode === "semaine"
                  ? "bg-pink-100 border-pink-200"
                  : "bg-white"
              }`}
            >
              Semaine
            </button>
          </div>
        </div>

        {viewMode === "semaine" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setWeekAnchorDate(addDays(weekStart, -7))}
                className="px-3 py-2 rounded-full bg-white border"
              >
                ← Semaine précédente
              </button>

              <div className="font-semibold text-center">
                {formatWeekRangeLabel(weekStart)}
              </div>

              <button
                type="button"
                onClick={() => setWeekAnchorDate(addDays(weekStart, 7))}
                className="px-3 py-2 rounded-full bg-white border"
              >
                Semaine suivante →
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <div className="px-2 py-1 rounded-full border bg-pink-50 border-pink-200">
                🏠 Cabinet
              </div>
              <div className="px-2 py-1 rounded-full border bg-sky-50 border-sky-200">
                💻 Visio
              </div>
              <div className="px-2 py-1 rounded-full border bg-amber-50 border-amber-200">
                🚗 Perso
              </div>
            </div>

            <WeeklyCalendar
              weekStart={weekStart}
              appointments={displayedWeekAppointments}
              onSelectDate={(isoDate) => {
                setPrefilledDate(isoDate);
              }}
            />
          </div>
        )}

        {viewMode === "liste" && (
          <div className="space-y-3">
            {sortedAppointments.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun rendez-vous enregistré pour l’instant.
              </div>
            ) : (
              sortedAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  appointments={sortedAppointments}
                  clients={clients}
                  onUpdate={updateAppointment}
                  onDelete={removeAppointment}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
