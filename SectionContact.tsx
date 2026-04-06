// src/components/SectionChamp3.tsx
import { useEffect, useMemo } from "react";
import { Client } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

const travailOptions = [
  "Salarié",
  "Étudiant",
  "Retraité",
  "Libéral",
  "Sans emploi",
  "Autre",
] as const;

const coupleOptions = [
  "Couple / Marié",
  "Célibataire",
  "Veuf",
  "Divorcé",
  "Autre",
] as const;

type ParentKey = "pere" | "mere";

type ParentRow = {
  prenom?: string;
  age?: number;
  vecu?: string;
  decede?: boolean;
};

type EnfantRow = { prenom?: string; age?: number; vecu?: string };
type FratrieRow = {
  place?: string;
  prenom?: string;
  age?: number;
  vecu?: string;
};

function asString(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: any): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function ensureLen<T>(arr: any, n: number, factory: () => T): T[] {
  const a: T[] = Array.isArray(arr) ? arr : [];
  const out = [...a];
  while (out.length < n) out.push(factory());
  return out.slice(0, n);
}

function normalizeTravail(raw: any) {
  const typeRaw = raw?.type;
  const type = Array.isArray(typeRaw)
    ? asString(typeRaw[0], "")
    : asString(typeRaw, "");

  return {
    type,
    autre: asString(raw?.autre, ""),
    profession: asString(raw?.profession, ""),
    vecu: asString(raw?.vecu, ""),
  };
}

function normalizeCouple(raw: any) {
  const statutRaw = raw?.statut;
  const statut = Array.isArray(statutRaw)
    ? asString(statutRaw[0], "")
    : asString(statutRaw, "");

  return {
    statut,
    autre: asString(raw?.autre, ""),
    conjointPrenom: asString(raw?.conjointPrenom, ""),
    conjointDepuis: asString(raw?.conjointDepuis, ""),
    precisions: asString(raw?.precisions, ""),
    vecu: asString(raw?.vecu, ""),
  };
}

function normalizeParents(raw: any) {
  const p: Record<ParentKey, ParentRow> = {
    pere: raw?.pere ?? {},
    mere: raw?.mere ?? {},
  };

  return {
    pere: {
      prenom: asString(p.pere?.prenom, ""),
      age: asNumber(p.pere?.age),
      vecu: asString(p.pere?.vecu, ""),
      decede: Boolean(p.pere?.decede),
    },
    mere: {
      prenom: asString(p.mere?.prenom, ""),
      age: asNumber(p.mere?.age),
      vecu: asString(p.mere?.vecu, ""),
      decede: Boolean(p.mere?.decede),
    },
  };
}

export default function SectionChamp3({ client, onSave }: Props) {
  if (!client) return <div>Client non trouvé</div>;

  const travail = useMemo(
    () => normalizeTravail((client as any).travail),
    [client]
  );
  const couple = useMemo(
    () => normalizeCouple((client as any).couple),
    [client]
  );
  const parents = useMemo(
    () => normalizeParents((client as any).parents),
    [client]
  );

  const parentsInfosCommunes = asString(
    (client as any).parents?.infosCommunes,
    ""
  );

  const enfantsNombre = asNumber((client as any).enfants?.nombre) ?? 0;
  const enfantsData: EnfantRow[] = useMemo(
    () =>
      ensureLen<EnfantRow>(
        (client as any).enfants?.data,
        enfantsNombre,
        () => ({ prenom: "", age: undefined, vecu: "" })
      ),
    [client, enfantsNombre]
  );

  const fratrieNombre = asNumber((client as any).fratrie?.nombre) ?? 0;
  const fratrieData: FratrieRow[] = useMemo(
    () =>
      ensureLen<FratrieRow>(
        (client as any).fratrie?.data,
        fratrieNombre,
        () => ({ place: "", prenom: "", age: undefined, vecu: "" })
      ),
    [client, fratrieNombre]
  );

  const stresseurs = asString((client as any).stresseurs, "");

  useEffect(() => {
    const needsInit =
      (client as any).travail === undefined ||
      (client as any).couple === undefined ||
      (client as any).parents === undefined ||
      (client as any).enfants === undefined ||
      (client as any).fratrie === undefined;

    if (!needsInit) return;

    onSave(
      {
        ...client,
        travail,
        couple,
        parents: {
          ...parents,
          infosCommunes: parentsInfosCommunes,
        },
        enfants: { nombre: enfantsNombre, data: enfantsData },
        fratrie: { nombre: fratrieNombre, data: fratrieData },
      } as any,
      { immediate: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTravail = (patch: Partial<typeof travail>) => {
    const next = { ...travail, ...patch };

    if (patch.type && patch.type !== "Autre") next.autre = "";

    onSave({ ...client, travail: next } as any);
  };

  const setCouple = (patch: Partial<typeof couple>) => {
    const next = { ...couple, ...patch };

    if (patch.statut && patch.statut !== "Autre") next.autre = "";

    if (patch.statut && patch.statut !== "Couple / Marié") {
      next.conjointPrenom = "";
      next.conjointDepuis = "";
    }

    onSave({ ...client, couple: next } as any);
  };

  const setParent = (which: ParentKey, patch: Partial<ParentRow>) => {
    const nextParents = {
      ...parents,
      [which]: { ...parents[which], ...patch },
      infosCommunes: parentsInfosCommunes,
    };
    onSave({ ...client, parents: nextParents } as any);
  };

  const setParentsInfosCommunes = (value: string) => {
    onSave({
      ...client,
      parents: {
        ...parents,
        infosCommunes: value,
      },
    } as any);
  };

  const setEnfantsNombre = (n: number) => {
    const nextNombre = Math.max(0, n);
    const nextData = ensureLen<EnfantRow>(
      (client as any).enfants?.data,
      nextNombre,
      () => ({ prenom: "", age: undefined, vecu: "" })
    );
    onSave(
      { ...client, enfants: { nombre: nextNombre, data: nextData } } as any,
      { immediate: true }
    );
  };

  const setEnfantRow = (i: number, patch: Partial<EnfantRow>) => {
    const next = [...enfantsData];
    next[i] = { ...next[i], ...patch };
    onSave({
      ...client,
      enfants: { nombre: enfantsNombre, data: next },
    } as any);
  };

  const setFratrieNombre = (n: number) => {
    const nextNombre = Math.max(0, n);
    const nextData = ensureLen<FratrieRow>(
      (client as any).fratrie?.data,
      nextNombre,
      () => ({ place: "", prenom: "", age: undefined, vecu: "" })
    );
    onSave(
      { ...client, fratrie: { nombre: nextNombre, data: nextData } } as any,
      { immediate: true }
    );
  };

  const setFratrieRow = (i: number, patch: Partial<FratrieRow>) => {
    const next = [...fratrieData];
    next[i] = { ...next[i], ...patch };
    onSave({
      ...client,
      fratrie: { nombre: fratrieNombre, data: next },
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="text-xl font-bold">💼 Travail</h2>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Statut</label>
          <select
            value={travail.type}
            onChange={(e) => setTravail({ type: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="">-- Choisir --</option>
            {travailOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {travail.type === "Autre" && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Préciser
            </label>
            <input
              className="w-full border rounded p-2"
              placeholder="Autre (à préciser)"
              value={travail.autre}
              onChange={(e) => setTravail({ autre: e.target.value })}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Profession
          </label>
          <input
            className="w-full border rounded p-2"
            placeholder="Profession"
            value={travail.profession}
            onChange={(e) => setTravail({ profession: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Vécu</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Vécu du travail"
            value={travail.vecu}
            onChange={(e) => setTravail({ vecu: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="text-xl font-bold">💑 Couple</h2>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Statut</label>
          <select
            value={couple.statut}
            onChange={(e) => setCouple({ statut: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="">-- Choisir --</option>
            {coupleOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {couple.statut === "Autre" && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Préciser
            </label>
            <input
              className="w-full border rounded p-2"
              placeholder="Autre (à préciser)"
              value={couple.autre}
              onChange={(e) => setCouple({ autre: e.target.value })}
            />
          </div>
        )}

        {couple.statut === "Couple / Marié" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Prénom du conjoint
              </label>
              <input
                className="w-full border rounded p-2"
                placeholder="Prénom"
                value={couple.conjointPrenom}
                onChange={(e) => setCouple({ conjointPrenom: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Depuis combien de temps
              </label>
              <input
                className="w-full border rounded p-2"
                placeholder="Ex : 3 ans"
                value={couple.conjointDepuis}
                onChange={(e) => setCouple({ conjointDepuis: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Précisions
          </label>
          <input
            className="w-full border rounded p-2"
            placeholder="Précisions"
            value={couple.precisions}
            onChange={(e) => setCouple({ precisions: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Vécu</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Vécu du couple"
            value={couple.vecu}
            onChange={(e) => setCouple({ vecu: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-bold">👪 Parents</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-[110px]">Lien</th>
                <th className="border p-2 w-[180px]">Prénom</th>
                <th className="border p-2 w-[90px]">Âge</th>
                <th className="border p-2">Vécu</th>
                <th className="border p-2 w-[110px]">Décédé</th>
              </tr>
            </thead>
            <tbody>
              {(["pere", "mere"] as ParentKey[]).map((k) => (
                <tr key={k}>
                  <td className="border p-2 font-semibold">
                    {k === "pere" ? "Père" : "Mère"}
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      value={parents[k].prenom ?? ""}
                      onChange={(e) => setParent(k, { prenom: e.target.value })}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded p-1"
                      value={parents[k].age ?? ""}
                      onChange={(e) =>
                        setParent(k, {
                          age: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      value={parents[k].vecu ?? ""}
                      onChange={(e) => setParent(k, { vecu: e.target.value })}
                      placeholder="Vécu..."
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(parents[k].decede)}
                      onChange={(e) =>
                        setParent(k, { decede: e.target.checked })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Informations communes sur les parents / dynamique parentale
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Ex : parents séparés, dynamique du couple parental, climat entre eux, co-parentalité, conflits, alliance..."
            value={parentsInfosCommunes}
            onChange={(e) => setParentsInfosCommunes(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="text-xl font-bold">👶 Enfants</h2>

        <div className="space-y-1 max-w-xs">
          <label className="text-sm font-semibold text-gray-700">
            Nombre d’enfants
          </label>
          <input
            type="number"
            min={0}
            className="w-full border rounded p-2"
            value={enfantsNombre}
            onChange={(e) => setEnfantsNombre(Number(e.target.value) || 0)}
          />
        </div>

        {enfantsNombre > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-[220px]">Prénom</th>
                  <th className="border p-2 w-[90px]">Âge</th>
                  <th className="border p-2">Vécu</th>
                </tr>
              </thead>
              <tbody>
                {enfantsData.map((row, i) => (
                  <tr key={i}>
                    <td className="border p-2">
                      <input
                        className="w-full border rounded p-1"
                        value={row.prenom ?? ""}
                        onChange={(e) =>
                          setEnfantRow(i, { prenom: e.target.value })
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded p-1"
                        value={row.age ?? ""}
                        onChange={(e) =>
                          setEnfantRow(i, {
                            age: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        className="w-full border rounded p-1"
                        value={row.vecu ?? ""}
                        onChange={(e) =>
                          setEnfantRow(i, { vecu: e.target.value })
                        }
                        placeholder="Vécu..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="text-xl font-bold">👦👧 Fratrie</h2>

        <div className="space-y-1 max-w-xs">
          <label className="text-sm font-semibold text-gray-700">
            Nombre de frères / sœurs
          </label>
          <input
            type="number"
            min={0}
            className="w-full border rounded p-2"
            value={fratrieNombre}
            onChange={(e) => setFratrieNombre(Number(e.target.value) || 0)}
          />
        </div>

        {fratrieNombre > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-[170px]">Place</th>
                  <th className="border p-2 w-[220px]">Prénom</th>
                  <th className="border p-2 w-[90px]">Âge</th>
                  <th className="border p-2">Vécu</th>
                </tr>
              </thead>
              <tbody>
                {fratrieData.map((row, i) => {
                  const isClient = row.place === "Client.e";

                  return (
                    <tr
                      key={i}
                      className={isClient ? "bg-blue-50/70" : undefined}
                    >
                      <td className="border p-2">
                        <select
                          className={`w-full border rounded p-1 ${
                            isClient ? "font-semibold border-blue-300" : ""
                          }`}
                          value={row.place ?? ""}
                          onChange={(e) =>
                            setFratrieRow(i, { place: e.target.value })
                          }
                        >
                          <option value="">--</option>
                          <option>Client.e</option>
                          <option>Enfant unique</option>
                          <option>Aîné</option>
                          <option>Cadet</option>
                          <option>Benjamin</option>
                          <option>Autre</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <input
                          className={`w-full border rounded p-1 ${
                            isClient ? "font-semibold border-blue-300" : ""
                          }`}
                          value={row.prenom ?? ""}
                          onChange={(e) =>
                            setFratrieRow(i, { prenom: e.target.value })
                          }
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          min={0}
                          className={`w-full border rounded p-1 ${
                            isClient ? "font-semibold border-blue-300" : ""
                          }`}
                          value={row.age ?? ""}
                          onChange={(e) =>
                            setFratrieRow(i, {
                              age: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          className={`w-full border rounded p-1 ${
                            isClient ? "font-semibold border-blue-300" : ""
                          }`}
                          value={row.vecu ?? ""}
                          onChange={(e) =>
                            setFratrieRow(i, { vecu: e.target.value })
                          }
                          placeholder={
                            isClient ? "Vécu du/de la client.e..." : "Vécu..."
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="text-xl font-bold">⚡ Stresseurs</h2>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Stresseurs..."
          value={stresseurs}
          onChange={(e) =>
            onSave({ ...client, stresseurs: e.target.value } as any)
          }
        />
      </div>
    </div>
  );
}
