// src/components/SectionSeances.tsx
import { useEffect, useMemo, useState } from "react";
import { Client, Seance } from "../types";
import { formatDateFR } from "../utils/date";
import { auth, storage } from "../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

type ExtendedSeance = Seance & {
  hypothesesCliniques?: string;
  pistesTherapeutiques?: string;
  relationsEvoquees?: string[];
  emotionsDominantes?: string[];
};

const EMOTIONS_SEANCE = [
  "Peur",
  "Honte",
  "Culpabilité",
  "Impuissance",
  "Rage",
  "Mépris",
  "Dégoût",
  "Colère",
  "Trahison",
  "Abandon",
  "Rejet",
  "Tristesse",
  "Dévalorisation",
  "Jalousie",
  "Critique",
  "Frustration",
  "Déception",
  "Doute",
  "Confusion",
  "Ennui",
  "Espoir",
  "Apaisement",
  "Curiosité",
  "Intérêt",
  "Étonnement",
  "Clarté",
  "Sécurité",
  "Appréciation",
  "Lâcher prise",
  "Acceptation",
  "Pardon",
  "Plaisir",
  "Désir",
  "Fierté",
  "Confiance",
  "Bien-être",
  "Gratitude",
  "Paix",
  "Joie",
  "Amour",
] as const;

type PatternItem = {
  type: "relation" | "emotion";
  label: string;
  count: number;
};

function ensureSeances(seances: any): ExtendedSeance[] {
  return Array.isArray(seances) ? seances : [];
}

function ensureStringArray(v: any): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function highlight(text: string, term: string) {
  if (!term || !text) return text;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = new RegExp(`^${escaped}$`, "i").test(part);

    return isMatch ? (
      <mark key={i} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    );
  });
}

export default function SectionSeances({ client, onSave }: Props) {
  const [newSeanceDate, setNewSeanceDate] = useState<string>("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const seances = useMemo(
    () => ensureSeances((client as any).seances),
    [client]
  );

  const relations = useMemo(
    () =>
      Array.isArray((client as any).relations) ? (client as any).relations : [],
    [client]
  );

  const saveClient = (
    updatedClient: Client,
    opts?: { immediate?: boolean }
  ) => {
    onSave(updatedClient, opts);
  };

  const addSeance = () => {
    if (!newSeanceDate) return;

    const updatedClient: Client = {
      ...client,
      seances: [
        ...seances,
        {
          date: newSeanceDate,
          resume: "",
          transcription: "",
          audio: "",
          hypothesesCliniques: "",
          pistesTherapeutiques: "",
          relationsEvoquees: [],
          emotionsDominantes: [],
        } as ExtendedSeance,
      ],
    };

    saveClient(updatedClient, { immediate: true });
    setNewSeanceDate("");
  };

  const updateSeance = (
    seanceIndex: number,
    patch: Partial<ExtendedSeance>
  ) => {
    const updatedSeances = seances.map((s, i) =>
      i === seanceIndex ? ({ ...s, ...patch } as ExtendedSeance) : s
    );

    saveClient({ ...client, seances: updatedSeances } as Client);
  };

  const updateSeanceField = (
    seanceIndex: number,
    key: keyof ExtendedSeance,
    value: string
  ) => {
    updateSeance(seanceIndex, { [key]: value } as Partial<ExtendedSeance>);
  };

  const updateSeanceAudio = async (seanceIndex: number, file: File) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Utilisateur non connecté.");
      return;
    }

    if (!client.id) {
      alert("Client introuvable.");
      return;
    }

    try {
      setAudioLoadingIndex(seanceIndex);

      const safeFileName = file.name.replace(/\s+/g, "-");
      const storagePath = `seances-audio/${user.uid}/${
        client.id
      }/${Date.now()}-${safeFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const audioUrl = await getDownloadURL(storageRef);

      const updatedSeances = seances.map((s, i) =>
        i === seanceIndex ? ({ ...s, audio: audioUrl } as ExtendedSeance) : s
      );

      saveClient({ ...client, seances: updatedSeances } as Client, {
        immediate: true,
      });
    } catch (error) {
      console.error("Erreur upload audio :", error);
      alert(
        "Erreur upload audio : " +
          ((error as any)?.message ?? "erreur inconnue")
      );
    } finally {
      setAudioLoadingIndex(null);
    }
  };

  const toggleRelationEvoquee = (
    seanceIndex: number,
    relationLabel: string,
    checked: boolean
  ) => {
    const current = ensureStringArray(seances[seanceIndex]?.relationsEvoquees);
    const next = checked
      ? Array.from(new Set([...current, relationLabel]))
      : current.filter((r) => r !== relationLabel);

    updateSeance(seanceIndex, { relationsEvoquees: next });
  };

  const toggleEmotionDominante = (
    seanceIndex: number,
    emotion: string,
    checked: boolean
  ) => {
    const current = ensureStringArray(seances[seanceIndex]?.emotionsDominantes);
    const next = checked
      ? Array.from(new Set([...current, emotion]))
      : current.filter((e) => e !== emotion);

    updateSeance(seanceIndex, { emotionsDominantes: next });
  };

  const seanceMatchesSearch = (seance: ExtendedSeance, term: string) => {
    const q = term.trim().toLowerCase();
    if (!q) return true;

    const searchableText = [
      seance.resume,
      seance.hypothesesCliniques,
      seance.pistesTherapeutiques,
      ...ensureStringArray(seance.relationsEvoquees),
      ...ensureStringArray(seance.emotionsDominantes),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(q);
  };

  const seancesAffichees = useMemo(() => {
    return [...seances]
      .filter((seance) => seanceMatchesSearch(seance, searchTerm))
      .reverse();
  }, [seances, searchTerm]);

  const patterns = useMemo(() => {
    const relationsMap: Record<string, number> = {};
    const emotionsMap: Record<string, number> = {};

    seances.forEach((s) => {
      ensureStringArray(s.relationsEvoquees).forEach((r) => {
        relationsMap[r] = (relationsMap[r] || 0) + 1;
      });

      ensureStringArray(s.emotionsDominantes).forEach((e) => {
        emotionsMap[e] = (emotionsMap[e] || 0) + 1;
      });
    });

    const sortedRelations = Object.entries(relationsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    const sortedEmotions = Object.entries(emotionsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    return {
      relations: sortedRelations,
      emotions: sortedEmotions,
    };
  }, [seances]);

  const patternInsights = useMemo(() => {
    const allItems: PatternItem[] = [
      ...patterns.relations.map(([label, count]) => ({
        type: "relation" as const,
        label,
        count,
      })),
      ...patterns.emotions.map(([label, count]) => ({
        type: "emotion" as const,
        label,
        count,
      })),
    ]
      .filter((item) => item.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

    return allItems.map((item) =>
      item.type === "relation"
        ? `La relation "${item.label}" apparaît dans ${item.count} séances`
        : `L'émotion "${item.label}" apparaît dans ${item.count} séances`
    );
  }, [patterns]);

  useEffect(() => {
    if (!searchTerm.trim()) return;
    if (seancesAffichees.length === 0) return;

    const firstDisplayed = seancesAffichees[0];
    const realIndex = seances.findIndex((s) => s === firstDisplayed);

    if (realIndex !== -1) {
      setOpenIndex(realIndex);
    }
  }, [searchTerm, seancesAffichees, seances]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2">Pistes stratégiques globales</h3>
        <textarea
          className="w-full border rounded p-2"
          placeholder="Saisir vos pistes stratégiques globales ici..."
          value={(client as any).pistesStrategiques || ""}
          onChange={(e) =>
            saveClient({
              ...(client as any),
              pistesStrategiques: e.target.value,
            } as any)
          }
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <h3 className="font-semibold">🧠 Patterns repérés</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold mb-1">👥 Relations évoquées</div>

            {patterns.relations.length === 0 && (
              <div className="text-sm text-gray-500">Aucune pour l’instant</div>
            )}

            {patterns.relations.map(([name, count]) => (
              <div
                key={name}
                className="text-sm flex justify-between border-b py-1"
              >
                <span>{name}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="font-semibold mb-1">🎭 Émotions dominantes</div>

            {patterns.emotions.length === 0 && (
              <div className="text-sm text-gray-500">Aucune pour l’instant</div>
            )}

            {patterns.emotions.map(([name, count]) => (
              <div
                key={name}
                className="text-sm flex justify-between border-b py-1"
              >
                <span>{name}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {patternInsights.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl space-y-2">
          <h3 className="font-semibold">⚠️ Pistes cliniques possibles</h3>

          {patternInsights.map((insight, i) => (
            <div key={i} className="text-sm">
              • {insight}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 items-center">
        <input
          type="date"
          className="border rounded p-2"
          value={newSeanceDate}
          onChange={(e) => setNewSeanceDate(e.target.value)}
        />
        <button onClick={addSeance} className="px-4 py-2 rounded bg-pink-200">
          ➕ Ajouter séance
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="font-semibold">🔎 Rechercher dans les séances</h3>
            <p className="text-sm text-gray-600">
              Retrouve rapidement un mot ou une expression dans les résumés,
              hypothèses, relations ou émotions.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            {seancesAffichees.length} séance
            {seancesAffichees.length > 1 ? "s" : ""} trouvée
            {seancesAffichees.length > 1 ? "s" : ""}
          </div>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ex : mère, honte, patron, abandon..."
          className="w-full border rounded p-2"
        />
      </div>

      {seancesAffichees.map((_s, displayIndex) => {
        const currentSeance = _s;
        const actualIndex = seances.indexOf(_s);
        const isOpen = openIndex === actualIndex;

        const relationsEvoquees = ensureStringArray(
          currentSeance.relationsEvoquees
        );
        const emotionsDominantes = ensureStringArray(
          currentSeance.emotionsDominantes
        );

        return (
          <div
            key={`${currentSeance.date}-${displayIndex}`}
            className="rounded-xl shadow mb-4 border bg-white"
          >
            <div className="p-4">
              <button
                onClick={() => setOpenIndex(isOpen ? null : actualIndex)}
                className="w-full flex justify-between items-center"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <strong>
                    Séance #{actualIndex + 1} –{" "}
                    {formatDateFR(currentSeance.date)}
                  </strong>

                  {relationsEvoquees.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 border border-blue-200">
                      🧩 {relationsEvoquees.length} relation
                      {relationsEvoquees.length > 1 ? "s" : ""}
                    </span>
                  )}

                  {emotionsDominantes.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 border border-purple-200">
                      🎭 {emotionsDominantes.length}
                    </span>
                  )}

                  {currentSeance.audio && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                      🎙️ Audio
                    </span>
                  )}
                </div>

                <span>{isOpen ? "🔽" : "▶️"}</span>
              </button>

              {isOpen && (
                <div className="space-y-5 mt-4">
                  <div className="bg-white rounded-xl border p-4 space-y-3">
                    <label className="font-semibold block">
                      📝 Résumé clinique
                    </label>

                    <div className="text-sm text-gray-600">
                      Colle ici ton résumé synthétique de séance préparé avec
                      ton chat dédié.
                    </div>

                    <textarea
                      className="w-full border rounded p-2"
                      rows={6}
                      placeholder="Résumé clinique synthétique de la séance..."
                      value={currentSeance.resume || ""}
                      onChange={(e) =>
                        updateSeanceField(actualIndex, "resume", e.target.value)
                      }
                    />
                  </div>

                  {searchTerm && currentSeance.resume && (
                    <div className="mt-2 text-sm bg-yellow-50 p-2 rounded border">
                      {highlight(currentSeance.resume, searchTerm)}
                    </div>
                  )}

                  <div className="bg-white rounded-xl border p-4 space-y-3">
                    <label className="font-semibold block">🎙️ Audio</label>

                    <input
                      type="file"
                      accept=".m4a,.mp3,.wav,audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void updateSeanceAudio(actualIndex, file);
                        }
                      }}
                      className="mb-2"
                    />

                    {audioLoadingIndex === actualIndex && (
                      <div className="text-sm text-gray-600">
                        ⏳ Envoi de l’audio...
                      </div>
                    )}

                    {currentSeance.audio && (
                      <audio
                        controls
                        src={currentSeance.audio}
                        className="w-full mt-2"
                      />
                    )}
                  </div>

                  <div className="bg-white rounded-xl border p-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">
                        🧠 Hypothèse clinique
                      </label>
                      <textarea
                        className="w-full border rounded p-2"
                        rows={4}
                        placeholder="Hypothèse ou repère clinique..."
                        value={currentSeance.hypothesesCliniques ?? ""}
                        onChange={(e) =>
                          updateSeanceField(
                            actualIndex,
                            "hypothesesCliniques",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">
                        ⛯ Pistes pour la suite
                      </label>
                      <textarea
                        className="w-full border rounded p-2"
                        rows={4}
                        placeholder="Ce que tu veux reprendre, approfondir ou travailler ensuite..."
                        value={currentSeance.pistesTherapeutiques ?? ""}
                        onChange={(e) =>
                          updateSeanceField(
                            actualIndex,
                            "pistesTherapeutiques",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        🧩 Relations évoquées
                      </label>

                      {relations.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          Aucune relation créée pour ce client pour l’instant.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {relations.map((rel: any) => {
                            const label = rel.nature
                              ? `${rel.prenom} (${rel.nature})`
                              : rel.prenom;

                            return (
                              <label
                                key={rel.id ?? label}
                                className="flex items-center gap-2 text-sm bg-gray-50 border rounded-full px-3 py-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={relationsEvoquees.includes(label)}
                                  onChange={(e) =>
                                    toggleRelationEvoquee(
                                      actualIndex,
                                      label,
                                      e.target.checked
                                    )
                                  }
                                />
                                {label}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        🎭 Émotions dominantes
                      </label>

                      <div className="flex flex-wrap gap-3">
                        {EMOTIONS_SEANCE.map((emotion) => (
                          <label
                            key={emotion}
                            className="flex items-center gap-2 text-sm bg-gray-50 border rounded-full px-3 py-2"
                          >
                            <input
                              type="checkbox"
                              checked={emotionsDominantes.includes(emotion)}
                              onChange={(e) =>
                                toggleEmotionDominante(
                                  actualIndex,
                                  emotion,
                                  e.target.checked
                                )
                              }
                            />
                            {emotion}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {seancesAffichees.length === 0 && (
        <div className="bg-white p-6 rounded-xl shadow text-center text-gray-600">
          Aucune séance ne correspond à cette recherche.
        </div>
      )}
    </div>
  );
}
