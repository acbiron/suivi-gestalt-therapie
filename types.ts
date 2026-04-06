// src/components/SectionTimeline.tsx
import { useMemo, useState } from "react";
import { Client, TimelineCategory, TimelineEvent } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

const CATEGORIES: TimelineCategory[] = [
  "Champ 3",
  "Champ 4",
  "Séance",
  "Vie",
  "Thérapie",
  "Autre",
];

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function badgeClass(cat: TimelineCategory) {
  switch (cat) {
    case "Champ 3":
      return "bg-blue-100 text-blue-800";
    case "Champ 4":
      return "bg-violet-100 text-violet-800";
    case "Séance":
      return "bg-green-100 text-green-800";
    case "Vie":
      return "bg-pink-100 text-pink-800";
    case "Thérapie":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function dotClass(cat: TimelineCategory) {
  switch (cat) {
    case "Champ 3":
      return "bg-blue-500";
    case "Champ 4":
      return "bg-violet-500";
    case "Séance":
      return "bg-green-500";
    case "Vie":
      return "bg-pink-500";
    case "Thérapie":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}

function sortTimeline(events: TimelineEvent[]) {
  return [...events].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;

    if (aDate !== bDate) return bDate - aDate;

    const aSeance = a.seanceNumber ?? 0;
    const bSeance = b.seanceNumber ?? 0;

    return bSeance - aSeance;
  });
}

function displayDate(event: TimelineEvent) {
  if (event.date) {
    const d = new Date(event.date);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("fr-FR");
    }
  }

  if (event.seanceNumber) {
    return `Séance ${event.seanceNumber}`;
  }

  return "Sans date";
}

const emptyDraft: Partial<TimelineEvent> = {
  categorie: "Autre",
  titre: "",
  description: "",
  date: "",
  seanceNumber: undefined,
  firstFiveSessions: false,
  important: false,
};

export default function SectionTimeline({ client, onSave }: Props) {
  const timeline = Array.isArray(client.timeline) ? client.timeline : [];

  const [draft, setDraft] = useState<Partial<TimelineEvent>>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filter, setFilter] = useState<TimelineCategory | "Toutes">("Toutes");
  const [onlyFirstFive, setOnlyFirstFive] = useState(false);
  const [onlyImportant, setOnlyImportant] = useState(false);

  const sortedTimeline = useMemo(() => sortTimeline(timeline), [timeline]);

  const filteredTimeline = useMemo(() => {
    return sortedTimeline.filter((event) => {
      if (filter !== "Toutes" && event.categorie !== filter) return false;
      if (onlyFirstFive && !event.firstFiveSessions) return false;
      if (onlyImportant && !event.important) return false;
      return true;
    });
  }, [sortedTimeline, filter, onlyFirstFive, onlyImportant]);

  const saveTimeline = (next: TimelineEvent[], immediate = false) => {
    onSave(
      {
        ...client,
        timeline: next,
      },
      { immediate }
    );
  };

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const submitEvent = () => {
    const titre = (draft.titre ?? "").trim();
    if (!titre) return;

    const payload: TimelineEvent = {
      id: editingId ?? uid(),
      titre,
      description: (draft.description ?? "").trim(),
      categorie: (draft.categorie as TimelineCategory) ?? "Autre",
      date: draft.date || undefined,
      seanceNumber: draft.seanceNumber ? Number(draft.seanceNumber) : undefined,
      firstFiveSessions: Boolean(draft.firstFiveSessions),
      important: Boolean(draft.important),
    };

    if (editingId) {
      saveTimeline(
        timeline.map((e) => (e.id === editingId ? payload : e)),
        true
      );
    } else {
      saveTimeline([payload, ...timeline], true);
    }

    resetForm();
  };

  const removeEvent = (id: string) => {
    saveTimeline(
      timeline.filter((e) => e.id !== id),
      true
    );
  };

  const toggleImportant = (id: string) => {
    saveTimeline(
      timeline.map((e) =>
        e.id === id ? { ...e, important: !e.important } : e
      ),
      true
    );
  };

  const startEdit = (event: TimelineEvent) => {
    setEditingId(event.id);
    setDraft({
      categorie: event.categorie,
      titre: event.titre,
      description: event.description ?? "",
      date: event.date ?? "",
      seanceNumber: event.seanceNumber,
      firstFiveSessions: Boolean(event.firstFiveSessions),
      important: Boolean(event.important),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="text-xl font-bold">🕰️ Timeline du client</h2>
          <p className="text-sm text-gray-600">
            Repère ici les événements de vie, éléments de Champ 3 / Champ 4,
            moments thérapeutiques clés et émergences des 5 premières séances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="text-sm font-semibold text-gray-700">Titre</label>
            <input
              className="w-full border rounded p-2"
              value={draft.titre ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, titre: e.target.value }))
              }
              placeholder="Ex : Séparation des parents"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Catégorie
            </label>
            <select
              className="w-full border rounded p-2"
              value={(draft.categorie as TimelineCategory) ?? "Autre"}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  categorie: e.target.value as TimelineCategory,
                }))
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Date de l’événement
            </label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={draft.date ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, date: e.target.value }))
              }
            />
            <div className="text-xs text-gray-500 mt-1">
              Renseigne la date à laquelle l’événement a eu lieu.
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              N° séance
            </label>
            <input
              type="number"
              min={1}
              className="w-full border rounded p-2"
              value={draft.seanceNumber ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  seanceNumber: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              placeholder="Ex : 2"
            />
          </div>

          <div className="md:col-span-12">
            <label className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={draft.description ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Contexte, verbatim, impact, sens clinique..."
            />
          </div>

          <div className="md:col-span-12 flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.firstFiveSessions)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    firstFiveSessions: e.target.checked,
                  }))
                }
              />
              Début de suivi / 5 premières séances
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.important)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    important: e.target.checked,
                  }))
                }
              />
              Événement important
            </label>
          </div>

          <div className="md:col-span-12 flex justify-end">
            <div className="flex gap-2">
              <button
                onClick={submitEvent}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-200 to-blue-200 shadow"
              >
                {editingId ? "💾 Enregistrer" : "➕ Ajouter à la timeline"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 shadow"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="border rounded p-2"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as TimelineCategory | "Toutes")
              }
            >
              <option value="Toutes">Toutes catégories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyFirstFive}
                onChange={(e) => setOnlyFirstFive(e.target.checked)}
              />
              5 premières séances
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyImportant}
                onChange={(e) => setOnlyImportant(e.target.checked)}
              />
              Importants seulement
            </label>
          </div>

          <div className="text-sm text-gray-600">
            {filteredTimeline.length} événement
            {filteredTimeline.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-4">🧭 Frise clinique</h3>

        {timeline.some((e) => e.firstFiveSessions) && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <div className="font-semibold text-amber-900">
              🌱 Repères du début de suivi
            </div>
            <div className="text-sm text-amber-800">
              Les événements marqués “5 premières séances” permettent de repérer
              ce qui a émergé très tôt dans le travail thérapeutique.
            </div>
          </div>
        )}

        {filteredTimeline.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucun événement pour l’instant.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-5">
              {filteredTimeline.map((event) => (
                <div key={event.id} className="relative pl-12">
                  <div
                    className={`absolute left-[7px] top-3 w-4 h-4 rounded-full border-4 border-white shadow ${dotClass(
                      event.categorie
                    )}`}
                  />

                  <div
                    className={`rounded-2xl border p-4 shadow-sm space-y-3 ${
                      event.firstFiveSessions
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">
                          {displayDate(event)}
                        </div>

                        <div className="font-bold text-lg">
                          {event.important ? "⭐ " : ""}
                          {event.titre}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${badgeClass(
                              event.categorie
                            )}`}
                          >
                            {event.categorie}
                          </span>

                          {event.firstFiveSessions && (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                              Début de suivi
                            </span>
                          )}

                          {event.seanceNumber && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              Séance {event.seanceNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(event)}
                          className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                          title="Modifier"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => toggleImportant(event.id)}
                          className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                          title="Marquer important"
                        >
                          {event.important ? "⭐" : "☆"}
                        </button>

                        <button
                          onClick={() => removeEvent(event.id)}
                          className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {event.description && (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
