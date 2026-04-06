// src/components/SectionClientResources.tsx
import { useMemo, useState } from "react";
import { Client, ResourceCategory, ResourceItem } from "../types";

type Props = {
  client: Client;
  resources: ResourceItem[];
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

export default function SectionClientResources({
  client,
  resources,
  onSave,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    ResourceCategory | "Toutes"
  >("Toutes");

  const resourceIds = client.resourceIds ?? [];

  const categories = useMemo(() => {
    return Array.from(new Set(resources.map((r) => r.categorie))).sort();
  }, [resources]);

  const linkedResources = useMemo(() => {
    return resources
      .filter((r) => resourceIds.includes(r.id ?? ""))
      .sort((a, b) => {
        const af = a.favori ? 1 : 0;
        const bf = b.favori ? 1 : 0;
        if (bf !== af) return bf - af;
        return a.titre.localeCompare(b.titre);
      });
  }, [resources, resourceIds]);

  const availableResources = useMemo(() => {
    const term = search.trim().toLowerCase();

    return resources
      .filter((r) => {
        if (categoryFilter !== "Toutes" && r.categorie !== categoryFilter) {
          return false;
        }

        if (!term) return true;

        const haystack = [
          r.titre,
          r.categorie,
          r.description ?? "",
          ...(r.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(term);
      })
      .sort((a, b) => {
        const af = a.favori ? 1 : 0;
        const bf = b.favori ? 1 : 0;
        if (bf !== af) return bf - af;
        return a.titre.localeCompare(b.titre);
      });
  }, [resources, search, categoryFilter]);

  const toggleResource = (resourceId: string) => {
    const currentIds = client.resourceIds ?? [];

    const updatedIds = currentIds.includes(resourceId)
      ? currentIds.filter((id) => id !== resourceId)
      : [...currentIds, resourceId];

    onSave(
      {
        ...client,
        resourceIds: updatedIds,
      },
      { immediate: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Ressources déjà liées */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="font-bold text-lg">📎 Outils liés au client</h2>
          <p className="text-sm text-gray-600">
            Retrouve ici les PDF déjà associés à ce client.
          </p>
        </div>

        {linkedResources.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucun outil lié à ce client pour l’instant.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {linkedResources.map((r) => (
              <div
                key={r.id}
                className="border rounded-xl p-3 flex justify-between items-start gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold">{r.titre}</div>
                    {r.favori && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        ⭐ Favori
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">{r.categorie}</div>

                  {r.description && (
                    <div className="text-sm text-gray-600 mt-2">
                      {r.description}
                    </div>
                  )}

                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <a
                    href={r.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-center"
                  >
                    📄 Ouvrir
                  </a>

                  <button
                    onClick={() => toggleResource(r.id!)}
                    className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ajouter des ressources */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div>
          <h3 className="font-semibold text-lg">➕ Ajouter un outil</h3>
          <p className="text-sm text-gray-600">
            Recherche dans ta bibliothèque et associe un PDF à ce client.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="border rounded p-2 w-72"
            placeholder="🔍 Rechercher un outil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded p-2"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as ResourceCategory | "Toutes")
            }
          >
            <option value="Toutes">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {availableResources.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aucune ressource trouvée.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableResources.map((r) => {
              const isLinked = resourceIds.includes(r.id ?? "");

              return (
                <div
                  key={r.id}
                  className={`border rounded-xl p-3 flex justify-between items-start gap-3 ${
                    isLinked ? "bg-green-50 border-green-200" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold">{r.titre}</div>
                      {r.favori && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          ⭐ Favori
                        </span>
                      )}
                      {isLinked && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Déjà lié
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">{r.categorie}</div>

                    {r.description && (
                      <div className="text-sm text-gray-600 mt-2">
                        {r.description}
                      </div>
                    )}

                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {r.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-center"
                    >
                      📄 Ouvrir
                    </a>

                    <button
                      onClick={() => toggleResource(r.id!)}
                      className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      {isLinked ? "Retirer" : "Ajouter"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
