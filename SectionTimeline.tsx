// src/components/SectionRelations.tsx
import { useMemo, useState } from "react";
import {
  Client,
  Relation,
  RelationCategory,
  RelationProximite,
} from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

const CATEGORIES: RelationCategory[] = [
  "Famille",
  "Couple",
  "Travail",
  "Amis",
  "Santé",
  "Autre",
];

const PROXIMITES: RelationProximite[] = ["Proche", "Moyen", "Distant", "Coupé"];

type ViewMode = "carte" | "liste";
type TagLaneKey =
  | "pinned"
  | "ressource"
  | "declencheur"
  | "ambivalent"
  | "none";

function uid() {
  // compat Codesandbox + navigateurs
  // @ts-ignore
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? // @ts-ignore
      crypto.randomUUID()
    : `rel_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function nowISO() {
  return new Date().toISOString();
}

function clampImpact(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 5;
  return Math.max(1, Math.min(10, Math.round(v)));
}

function badgeClass(cat: RelationCategory) {
  switch (cat) {
    case "Famille":
      return "bg-purple-100 text-purple-800";
    case "Couple":
      return "bg-pink-100 text-pink-800";
    case "Travail":
      return "bg-blue-100 text-blue-800";
    case "Amis":
      return "bg-green-100 text-green-800";
    case "Santé":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function impactDotClass(impact: number) {
  if (impact >= 8) return "bg-red-500";
  if (impact >= 5) return "bg-amber-500";
  return "bg-green-500";
}

function laneMeta(key: TagLaneKey) {
  switch (key) {
    case "pinned":
      return {
        title: "⭐ Épinglées",
        hint: "Toujours visibles en haut",
        wrap: "bg-yellow-50/80 border-yellow-200",
      };
    case "ressource":
      return {
        title: "🧡 Ressources",
        hint: "Ce qui soutient / sécurise",
        wrap: "bg-green-50/80 border-green-200",
      };
    case "declencheur":
      return {
        title: "⚠️ Déclencheurs",
        hint: "Ce qui active / met en tension",
        wrap: "bg-red-50/70 border-red-200",
      };
    case "ambivalent":
      return {
        title: "🌀 Ambivalentes",
        hint: "À double polarité",
        wrap: "bg-indigo-50/70 border-indigo-200",
      };
    default:
      return {
        title: "🩶 Non classées",
        hint: "À taguer plus tard",
        wrap: "bg-gray-50 border-gray-200",
      };
  }
}

function getLane(r: Relation): TagLaneKey {
  if (r.pinned) return "pinned";
  if (r.tags?.declencheur) return "declencheur";
  if (r.tags?.ressource) return "ressource";
  if (r.tags?.ambivalent) return "ambivalent";
  return "none";
}

function cardBgByLane(lane: TagLaneKey) {
  switch (lane) {
    case "pinned":
      return "bg-yellow-50/70";
    case "ressource":
      return "bg-green-50/70";
    case "declencheur":
      return "bg-red-50/60";
    case "ambivalent":
      return "bg-indigo-50/60";
    default:
      return "bg-white";
  }
}

const emptyDraft: Partial<Relation> = {
  categorie: "Famille",
  proximite: "Moyen",
  impact: 5,
  tags: { ressource: false, declencheur: false, ambivalent: false },
  prenom: "",
  age: undefined,
  nature: "",
  vecu: "",
};

export default function SectionRelations({ client, onSave }: Props) {
  const relations: Relation[] = Array.isArray((client as any).relations)
    ? ((client as any).relations as Relation[])
    : [];
  const seances = Array.isArray((client as any).seances)
    ? (client as any).seances
    : [];

  const relationsStats = useMemo(() => {
    const mentionCount: Record<string, number> = {};
    const emotionCount: Record<string, number> = {};

    for (const seance of seances) {
      const rels = Array.isArray(seance?.relationsEvoquees)
        ? seance.relationsEvoquees
        : [];
      const emos = Array.isArray(seance?.emotionsDominantes)
        ? seance.emotionsDominantes
        : [];

      rels.forEach((r: string) => {
        mentionCount[r] = (mentionCount[r] ?? 0) + 1;
      });

      emos.forEach((e: string) => {
        emotionCount[e] = (emotionCount[e] ?? 0) + 1;
      });
    }

    const mostMentionedRelation =
      Object.entries(mentionCount).sort((a, b) => b[1] - a[1])[0] ?? null;

    const mostFrequentEmotion =
      Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0] ?? null;

    const declencheurs = relations.filter((r) => r.tags?.declencheur);
    const ressources = relations.filter((r) => r.tags?.ressource);

    const topDeclencheur =
      [...declencheurs].sort((a, b) => b.impact - a.impact)[0] ?? null;

    const topRessource =
      [...ressources].sort((a, b) => b.impact - a.impact)[0] ?? null;

    return {
      mostMentionedRelation,
      mostFrequentEmotion,
      topDeclencheur,
      topRessource,
    };
  }, [relations, seances]);

  const [view, setView] = useState<ViewMode>("carte");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<RelationCategory | "Toutes">(
    "Toutes"
  );
  const [showOnlyRessources, setShowOnlyRessources] = useState(false);
  const [showOnlyDeclencheurs, setShowOnlyDeclencheurs] = useState(false);

  const [draft, setDraft] = useState<Partial<Relation>>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...relations]
      .filter((r) => {
        if (catFilter !== "Toutes" && r.categorie !== catFilter) return false;

        if (showOnlyRessources && !r.tags?.ressource) return false;
        if (showOnlyDeclencheurs && !r.tags?.declencheur) return false;

        if (!term) return true;
        const hay = `${r.prenom ?? ""} ${r.nature ?? ""} ${r.vecu ?? ""}`
          .toLowerCase()
          .trim();
        return hay.includes(term);
      })
      .sort((a, b) => {
        const pa = a.pinned ? 1 : 0;
        const pb = b.pinned ? 1 : 0;
        if (pb !== pa) return pb - pa;

        const da = a.lastMentionedAt
          ? new Date(a.lastMentionedAt).getTime()
          : 0;
        const db = b.lastMentionedAt
          ? new Date(b.lastMentionedAt).getTime()
          : 0;
        return db - da;
      });
  }, [relations, search, catFilter, showOnlyRessources, showOnlyDeclencheurs]);

  const stats = useMemo(() => {
    const base = relations;
    const pinned = base.filter((r) => Boolean(r.pinned)).length;
    const ressource = base.filter((r) => Boolean(r.tags?.ressource)).length;
    const declencheur = base.filter((r) => Boolean(r.tags?.declencheur)).length;
    const ambivalent = base.filter((r) => Boolean(r.tags?.ambivalent)).length;
    const none = base.filter(
      (r) =>
        !r.pinned &&
        !r.tags?.ressource &&
        !r.tags?.declencheur &&
        !r.tags?.ambivalent
    ).length;

    return {
      pinned,
      ressource,
      declencheur,
      ambivalent,
      none,
      total: base.length,
    };
  }, [relations]);

  const saveRelations = (next: Relation[]) => {
    onSave({ ...client, relations: next } as any);
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const addOrUpdateRelation = () => {
    const prenom = (draft.prenom ?? "").trim();
    const nature = (draft.nature ?? "").trim();
    if (!prenom || !nature) return;

    if (editingId) {
      const next = relations.map((r) =>
        r.id === editingId
          ? {
              ...r,
              prenom,
              age: draft.age ? Number(draft.age) : undefined,
              categorie: (draft.categorie as RelationCategory) ?? "Famille",
              nature,
              proximite: (draft.proximite as RelationProximite) ?? "Moyen",
              impact: clampImpact(draft.impact ?? 5),
              tags: {
                ressource: Boolean(draft.tags?.ressource),
                declencheur: Boolean(draft.tags?.declencheur),
                ambivalent: Boolean(draft.tags?.ambivalent),
              },
              vecu: (draft.vecu ?? "").trim(),
              lastMentionedAt: nowISO(),
            }
          : r
      );

      saveRelations(next);
      resetDraft();
      return;
    }

    const rel: Relation = {
      id: uid(),
      prenom,
      age: draft.age ? Number(draft.age) : undefined,
      categorie: (draft.categorie as RelationCategory) ?? "Famille",
      nature,
      proximite: (draft.proximite as RelationProximite) ?? "Moyen",
      impact: clampImpact(draft.impact ?? 5),
      tags: {
        ressource: Boolean(draft.tags?.ressource),
        declencheur: Boolean(draft.tags?.declencheur),
        ambivalent: Boolean(draft.tags?.ambivalent),
      },
      vecu: (draft.vecu ?? "").trim(),
      lastMentionedAt: nowISO(),
      pinned: false,
    };

    saveRelations([rel, ...relations]);
    resetDraft();
  };

  const startEdit = (r: Relation) => {
    setEditingId(r.id);
    setDraft({
      prenom: r.prenom,
      age: r.age,
      categorie: r.categorie,
      nature: r.nature,
      proximite: r.proximite,
      impact: r.impact,
      tags: {
        ressource: Boolean(r.tags?.ressource),
        declencheur: Boolean(r.tags?.declencheur),
        ambivalent: Boolean(r.tags?.ambivalent),
      },
      vecu: r.vecu ?? "",
    });
  };

  const updateRelation = (id: string, patch: Partial<Relation>) => {
    const next = relations.map((r) =>
      r.id === id ? { ...r, ...patch, lastMentionedAt: nowISO() } : r
    );
    saveRelations(next);
  };

  const removeRelation = (id: string) => {
    const next = relations.filter((r) => r.id !== id);
    saveRelations(next);
    if (editingId === id) resetDraft();
  };

  const lanes: { key: TagLaneKey; items: Relation[] }[] = useMemo(() => {
    const groups: Record<TagLaneKey, Relation[]> = {
      pinned: [],
      ressource: [],
      declencheur: [],
      ambivalent: [],
      none: [],
    };

    for (const r of filtered) {
      groups[getLane(r)].push(r);
    }

    return [
      { key: "pinned", items: groups.pinned },
      { key: "ressource", items: groups.ressource },
      { key: "declencheur", items: groups.declencheur },
      { key: "ambivalent", items: groups.ambivalent },
      { key: "none", items: groups.none },
    ];
  }, [filtered]);

  const RelationCard = ({ r }: { r: Relation }) => {
    const lane = getLane(r);

    return (
      <div
        className={`rounded-2xl border shadow-sm p-3 space-y-2 ${cardBgByLane(
          lane
        )}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-1 rounded-full ${badgeClass(
                  r.categorie
                )}`}
              >
                {r.categorie}
              </span>

              <span className="font-bold truncate">
                {r.pinned ? "⭐ " : ""}
                {r.prenom}
                {typeof r.age === "number" ? ` • ${r.age} ans` : ""}
              </span>

              <span className="text-sm text-gray-600">— {r.nature}</span>
            </div>

            <div className="mt-1 flex items-center gap-3 text-sm text-gray-700 flex-wrap">
              <span className="inline-flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${impactDotClass(
                    r.impact
                  )}`}
                />
                Impact {r.impact}/10
              </span>
              <span>📍 {r.proximite}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(r)}
              className="text-sm px-3 py-1 rounded-lg bg-white/70 hover:bg-white border border-gray-200"
              title="Modifier"
            >
              ✏️
            </button>

            <button
              onClick={() => updateRelation(r.id, { pinned: !r.pinned })}
              className={`text-sm px-3 py-1 rounded-lg border transition ${
                r.pinned
                  ? "bg-yellow-100 border-yellow-200"
                  : "bg-white/70 hover:bg-white border-gray-200"
              }`}
              title={r.pinned ? "Désépingler" : "Épingler"}
            >
              {r.pinned ? "⭐" : "☆"}
            </button>

            <button
              onClick={() => removeRelation(r.id)}
              className="text-sm px-3 py-1 rounded-lg bg-white/70 hover:bg-white border border-gray-200"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(r.tags?.ressource)}
              onChange={(e) =>
                updateRelation(r.id, {
                  tags: { ...(r.tags ?? {}), ressource: e.target.checked },
                })
              }
            />
            🧡
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(r.tags?.declencheur)}
              onChange={(e) =>
                updateRelation(r.id, {
                  tags: { ...(r.tags ?? {}), declencheur: e.target.checked },
                })
              }
            />
            ⚠️
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(r.tags?.ambivalent)}
              onChange={(e) =>
                updateRelation(r.id, {
                  tags: { ...(r.tags ?? {}), ambivalent: e.target.checked },
                })
              }
            />
            🌀
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Proximité
            </label>
            <select
              className="w-full border rounded p-2"
              value={r.proximite}
              onChange={(e) =>
                updateRelation(r.id, {
                  proximite: e.target.value as RelationProximite,
                })
              }
            >
              {PROXIMITES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Impact : {r.impact}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={r.impact}
              onChange={(e) =>
                updateRelation(r.id, { impact: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Vécu</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={r.vecu ?? ""}
            onChange={(e) => updateRelation(r.id, { vecu: e.target.value })}
            placeholder="Verbatim + notes praticien…"
          />
        </div>

        <div className="text-xs text-gray-500">
          Dernière mention :{" "}
          {r.lastMentionedAt
            ? new Date(r.lastMentionedAt).toLocaleString()
            : "—"}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-lg">🧩 Relations</h2>
            <p className="text-sm text-gray-600">
              Ajoute les personnes importantes (famille, travail, amis…). Tu
              peux noter la nature du lien, la proximité, l’impact émotionnel et
              le vécu.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow space-y-3">
            <h3 className="font-bold text-lg">📊 Tableau de bord</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl border bg-blue-50 p-3">
                <div className="text-sm text-gray-600">
                  🧩 Relation la plus évoquée
                </div>
                <div className="font-semibold mt-1">
                  {relationsStats.mostMentionedRelation
                    ? relationsStats.mostMentionedRelation[0]
                    : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {relationsStats.mostMentionedRelation
                    ? `${relationsStats.mostMentionedRelation[1]} séance(s)`
                    : "Pas encore de données"}
                </div>
              </div>

              <div className="rounded-2xl border bg-purple-50 p-3">
                <div className="text-sm text-gray-600">
                  🎭 Émotion la plus fréquente
                </div>
                <div className="font-semibold mt-1">
                  {relationsStats.mostFrequentEmotion
                    ? relationsStats.mostFrequentEmotion[0]
                    : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {relationsStats.mostFrequentEmotion
                    ? `${relationsStats.mostFrequentEmotion[1]} séance(s)`
                    : "Pas encore de données"}
                </div>
              </div>

              <div className="rounded-2xl border bg-red-50 p-3">
                <div className="text-sm text-gray-600">
                  ⚠️ Déclencheur principal
                </div>
                <div className="font-semibold mt-1">
                  {relationsStats.topDeclencheur
                    ? `${relationsStats.topDeclencheur.prenom} (${relationsStats.topDeclencheur.nature})`
                    : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {relationsStats.topDeclencheur
                    ? `Impact ${relationsStats.topDeclencheur.impact}/10`
                    : "Aucun déclencheur tagué"}
                </div>
              </div>

              <div className="rounded-2xl border bg-green-50 p-3">
                <div className="text-sm text-gray-600">
                  🧡 Ressource principale
                </div>
                <div className="font-semibold mt-1">
                  {relationsStats.topRessource
                    ? `${relationsStats.topRessource.prenom} (${relationsStats.topRessource.nature})`
                    : "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {relationsStats.topRessource
                    ? `Impact ${relationsStats.topRessource.impact}/10`
                    : "Aucune ressource taguée"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("carte")}
              className={`px-4 py-2 rounded-full text-sm border shadow-sm ${
                view === "carte" ? "bg-white font-semibold" : "bg-gray-50"
              }`}
            >
              🗺️ Carte
            </button>
            <button
              onClick={() => setView("liste")}
              className={`px-4 py-2 rounded-full text-sm border shadow-sm ${
                view === "liste" ? "bg-white font-semibold" : "bg-gray-50"
              }`}
            >
              📋 Liste
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Prénom
            </label>
            <input
              className="w-full border rounded p-2"
              value={draft.prenom ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, prenom: e.target.value }))
              }
              placeholder="Ex: Paul"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Âge</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded p-2"
              value={draft.age ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  age: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Optionnel"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Nature de la relation
            </label>
            <input
              className="w-full border rounded p-2"
              value={draft.nature ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, nature: e.target.value }))
              }
              placeholder="Ex: frère, mère, collègue…"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Catégorie
            </label>
            <select
              className="w-full border rounded p-2"
              value={(draft.categorie as any) ?? "Famille"}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  categorie: e.target.value as RelationCategory,
                }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Proximité
            </label>
            <select
              className="w-full border rounded p-2"
              value={(draft.proximite as any) ?? "Moyen"}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  proximite: e.target.value as RelationProximite,
                }))
              }
            >
              {PROXIMITES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12">
            <label className="text-sm font-semibold text-gray-700">
              Vécu (verbatim + notes praticien)
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={2}
              value={draft.vecu ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, vecu: e.target.value }))
              }
              placeholder="Ex: “Il me juge”, “Je me sens en sécurité avec elle”…"
            />
          </div>

          <div className="md:col-span-7">
            <label className="text-sm font-semibold text-gray-700">
              🎚️ Impact émotionnel : {clampImpact(draft.impact ?? 5)}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={clampImpact(draft.impact ?? 5)}
              onChange={(e) =>
                setDraft((d) => ({ ...d, impact: Number(e.target.value) }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="text-sm font-semibold text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-3 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(draft.tags?.ressource)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      tags: { ...(d.tags ?? {}), ressource: e.target.checked },
                    }))
                  }
                />
                🧡 Ressource
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(draft.tags?.declencheur)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      tags: {
                        ...(d.tags ?? {}),
                        declencheur: e.target.checked,
                      },
                    }))
                  }
                />
                ⚠️ Déclencheur
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(draft.tags?.ambivalent)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      tags: { ...(d.tags ?? {}), ambivalent: e.target.checked },
                    }))
                  }
                />
                🌀 Ambivalent
              </label>
            </div>
          </div>

          <div className="md:col-span-12 flex justify-end gap-2">
            {editingId && (
              <button
                onClick={resetDraft}
                className="px-5 py-2 rounded-xl bg-gray-100 shadow"
              >
                Annuler
              </button>
            )}

            <button
              onClick={addOrUpdateRelation}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-200 to-blue-200 shadow"
            >
              {editingId
                ? "💾 Enregistrer la relation"
                : "➕ Ajouter la relation"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm px-3 py-2 rounded-xl border bg-yellow-50">
              ⭐ {stats.pinned}
            </span>
            <span className="text-sm px-3 py-2 rounded-xl border bg-green-50">
              🧡 {stats.ressource}
            </span>
            <span className="text-sm px-3 py-2 rounded-xl border bg-red-50">
              ⚠️ {stats.declencheur}
            </span>
            <span className="text-sm px-3 py-2 rounded-xl border bg-indigo-50">
              🌀 {stats.ambivalent}
            </span>
            <span className="text-sm px-3 py-2 rounded-xl border bg-gray-50">
              🩶 {stats.none}
            </span>
            <span className="text-sm px-3 py-2 rounded-xl border bg-white">
              Total {stats.total}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} (avec
            filtres)
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              className="border rounded p-2 w-72"
              placeholder="🔍 Rechercher (prénom, nature, vécu)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border rounded p-2"
              value={catFilter}
              onChange={(e) =>
                setCatFilter(e.target.value as RelationCategory | "Toutes")
              }
            >
              <option value="Toutes">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyRessources}
                onChange={(e) => setShowOnlyRessources(e.target.checked)}
              />
              🧡 Ressources
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyDeclencheurs}
                onChange={(e) => setShowOnlyDeclencheurs(e.target.checked)}
              />
              ⚠️ Déclencheurs
            </label>
          </div>
        </div>
      </div>

      {view === "carte" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lanes
              .filter((l) => l.key !== "none")
              .map((lane) => {
                const meta = laneMeta(lane.key);
                return (
                  <div
                    key={lane.key}
                    className={`rounded-2xl border p-4 space-y-3 ${meta.wrap}`}
                  >
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="font-bold">{meta.title}</div>
                        <div className="text-sm text-gray-600">{meta.hint}</div>
                      </div>
                      <div className="text-sm font-semibold">
                        {lane.items.length}
                      </div>
                    </div>

                    {lane.items.length === 0 ? (
                      <div className="text-sm text-gray-600">
                        Rien ici pour l’instant.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lane.items.map((r) => (
                          <RelationCard key={r.id} r={r} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div
            className={`rounded-2xl border p-4 space-y-3 ${
              laneMeta("none").wrap
            }`}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="font-bold">{laneMeta("none").title}</div>
                <div className="text-sm text-gray-600">
                  {laneMeta("none").hint}
                </div>
              </div>
              <div className="text-sm font-semibold">
                {lanes.find((l) => l.key === "none")?.items.length ?? 0}
              </div>
            </div>

            {(lanes.find((l) => l.key === "none")?.items.length ?? 0) === 0 ? (
              <div className="text-sm text-gray-600">
                Nickel : tout est tagué 👌
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lanes
                  .find((l) => l.key === "none")
                  ?.items.map((r) => (
                    <RelationCard key={r.id} r={r} />
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <RelationCard key={r.id} r={r} />
          ))}

          {filtered.length === 0 && (
            <div className="text-center text-gray-600 md:col-span-2">
              Rien à afficher pour l’instant. Ajoute une première relation 👆
            </div>
          )}
        </div>
      )}
    </div>
  );
}
