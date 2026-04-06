// src/components/SectionClinicalGrid.tsx
import { useMemo, useState } from "react";
import {
  ClinicalGridFamily,
  ClinicalGridItem,
  ClinicalGridOrigin,
  ClinicalSelection,
} from "../types";
import { computeClinicalScores } from "../utils/clinicalGrid";

type Props = {
  title: string;
  family: ClinicalGridFamily;
  items: ClinicalGridItem[];
  value?: ClinicalSelection;
  onChange: (next: ClinicalSelection) => void;
};

const ORIGINS: Array<ClinicalGridOrigin | "Toutes"> = [
  "Toutes",
  "IL",
  "JE",
  "Observation",
];

export default function SectionClinicalGrid({
  title,
  family,
  items,
  value,
  onChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<
    ClinicalGridOrigin | "Toutes"
  >("Toutes");

  const selectedItemIds = value?.selectedItemIds ?? [];
  const notes = value?.notes ?? "";

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      if (originFilter !== "Toutes" && item.origine !== originFilter) {
        return false;
      }

      if (!term) return true;

      const haystack = [item.texte, item.origine, ...(item.types ?? [])]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [items, search, originFilter]);

  const scores = useMemo(() => {
    return computeClinicalScores(selectedItemIds, items);
  }, [selectedItemIds, items]);
  const topThree = scores.slice(0, 3);

  const toggleItem = (itemId: string, checked: boolean) => {
    const current = value?.selectedItemIds ?? [];
    const nextIds = checked
      ? Array.from(new Set([...current, itemId]))
      : current.filter((id) => id !== itemId);

    onChange({
      selectedItemIds: nextIds,
      notes,
    });
  };

  const updateNotes = (nextNotes: string) => {
    onChange({
      selectedItemIds,
      notes: nextNotes,
    });
  };

  const familyEmoji = family === "attachement" ? "🫶" : "🌱";

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="font-bold text-lg">
            {familyEmoji} {title}
          </h2>
          <p className="text-sm text-gray-600">
            Coche les affirmations présentes chez ce client, puis observe les
            tendances qui se dégagent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded p-2 md:col-span-2"
            placeholder="🔎 Rechercher une affirmation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded p-2"
            value={originFilter}
            onChange={(e) =>
              setOriginFilter(e.target.value as ClinicalGridOrigin | "Toutes")
            }
          >
            {ORIGINS.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {selectedItemIds.length} affirmation
          {selectedItemIds.length > 1 ? "s" : ""} cochée
          {selectedItemIds.length > 1 ? "s" : ""}.
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h3 className="font-semibold">🧭 Lecture rapide</h3>

        {topThree.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucune tendance dominante pour l’instant.
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <span className="font-semibold">Dominant :</span>{" "}
              <span className="font-semibold text-blue-700">
                {topThree[0]?.[0] ?? "—"}
              </span>
            </div>

            <div>
              <span className="font-semibold">Secondaire :</span>{" "}
              {topThree[1]?.[0] ?? "—"}
            </div>

            <div>
              <span className="font-semibold">Tertiaire :</span>{" "}
              {topThree[2]?.[0] ?? "—"}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <h3 className="font-semibold">✅ Affirmations</h3>

        {filteredItems.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucune affirmation ne correspond à la recherche.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const checked = selectedItemIds.includes(item.id);

              return (
                <label
                  key={item.id}
                  className={`block border rounded-xl p-3 transition ${
                    checked
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleItem(item.id, e.target.checked)}
                      className="mt-1"
                    />

                    <div className="min-w-0 space-y-2">
                      <div className="font-medium">{item.texte}</div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {item.origine}
                        </span>

                        {item.intensite === "haute" && (
                          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                            Haute intensité
                          </span>
                        )}

                        {item.types.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 rounded-full bg-green-100 text-green-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-2">
        <h3 className="font-semibold">📝 Notes</h3>
        <textarea
          className="w-full border rounded p-2 min-h-[120px]"
          placeholder="Notes cliniques libres..."
          value={notes}
          onChange={(e) => updateNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
