// src/components/SectionChamp4EtEnjeux.tsx
import { Client } from "../types";

type Tab = "champ4" | "enjeux" | "communication" | "strategie";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
  tab: Tab;
};

type EnjeuFields = "attachement" | "estime" | "ethosEros";

const MERE_OPTIONS = [
  "Mère Suffisamment Bonne",
  "Mère Pas Assez",
  "Mère Trop",
  "Mère d'abus",
] as const;

const PERE_OPTIONS = [
  "Père Suffisamment Juste",
  "Père Effacé/Démissionnaire",
  "Père Autoritaire/Tyrannique",
  "Père Narcissique",
] as const;

function asString(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export default function SectionChamp4EtEnjeux({ client, onSave, tab }: Props) {
  if (!client) return <div>Client non trouvé</div>;

  const champ4 = (client as any).champ4 ?? {};
  const communication = (client as any).communication ?? {};
  const strategie = (client as any).strategieTherapeutique ?? {};

  const setField = (key: string, value: any) => {
    onSave({ ...client, [key]: value } as any);
  };

  const setChamp4 = (patch: any) => setField("champ4", { ...champ4, ...patch });
  const setStrategie = (patch: any) =>
    setField("strategieTherapeutique", { ...strategie, ...patch });
  const setCommunication = (patch: any) =>
    setField("communication", { ...communication, ...patch });

  if (tab === "champ4") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-bold">🧩 Champ 4</h2>

          {/* Mère vécue */}
          <div className="border rounded-2xl p-3 space-y-2">
            <div className="font-semibold">👩 Mère vécue</div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Type de Mère
              </label>
              <select
                className="w-full border rounded p-2"
                value={asString(champ4.mereType)}
                onChange={(e) => setChamp4({ mereType: e.target.value })}
              >
                <option value="">-- Choisir --</option>
                {MERE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Vécu (verbatim + analyse)
              </label>
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                value={asString(champ4.mereVecu)}
                onChange={(e) => setChamp4({ mereVecu: e.target.value })}
                placeholder="Décrire la mère vécue..."
              />
            </div>
          </div>

          {/* Père vécu */}
          <div className="border rounded-2xl p-3 space-y-2">
            <div className="font-semibold">👨 Père vécu</div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Type de Père
              </label>
              <select
                className="w-full border rounded p-2"
                value={asString(champ4.pereType)}
                onChange={(e) => setChamp4({ pereType: e.target.value })}
              >
                <option value="">-- Choisir --</option>
                {PERE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Vécu (verbatim + analyse)
              </label>
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                value={asString(champ4.pereVecu)}
                onChange={(e) => setChamp4({ pereVecu: e.target.value })}
                placeholder="Décrire le père vécu..."
              />
            </div>
          </div>

          {/* Climat environnement */}
          <div className="border rounded-2xl p-3 space-y-1">
            <div className="font-semibold">🌳 Climat environnement</div>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={asString(champ4.climatEnvironnement)}
              onChange={(e) =>
                setChamp4({ climatEnvironnement: e.target.value })
              }
              placeholder="Climat familial, environnement, ambiance..."
            />
          </div>
        </div>
      </div>
    );
  }

  if (tab === "enjeux") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-bold">⚡ Enjeux</h2>

          <EnjeuCheckbox
            client={client}
            onSave={onSave}
            field="attachement"
            options={[
              "Sécure",
              "Sécure-Anxieux",
              "Anxieux–Sécure Dépendant",
              "Anxieux Ambivalent",
              "Anxieux Evitant",
              "Anxieux Schizoïde",
              "Anxieux Désorganisé",
            ]}
            reflexionField="attachementReflexion"
            valideField="attachementValide"
          />

          <EnjeuCheckbox
            client={client}
            onSave={onSave}
            field="estime"
            options={[
              "Confiant créateur",
              "Confiant",
              "Hypo",
              "Hypo effacé–Utilisé",
              "Hypo doutant–Septique",
              "Hyper",
              "Hyper flamboyant–Méprisant",
              "Hyper de souhait–Grandiose",
              "Hyper de combat–PN",
            ]}
            reflexionField="estimeReflexion"
            valideField="estimeValide"
          />

          <EnjeuCheckbox
            client={client}
            onSave={onSave}
            field="ethosEros"
            options={[
              "épanoui",
              "conventionnel",
              "hypo sexuel",
              "hyper sexuel",
              "vierge",
              "renoncé",
              "sublimé",
              "oedipien",
              "paraphile",
              "abuseur",
              "sensible",
            ]}
            reflexionField="ethosReflexion"
          />
        </div>
      </div>
    );
  }

  if (tab === "communication") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-bold">🗣️ Communication</h2>

          {(["surSoi", "surSecteur", "surIdees"] as const).map((field) => (
            <div key={field} className="space-y-1 border rounded-2xl p-3">
              <label className="text-sm font-semibold">
                {field === "surSoi"
                  ? "Sur soi"
                  : field === "surSecteur"
                  ? "Sur secteur de vie"
                  : "Sur idées"}
              </label>

              <select
                className="w-full border rounded p-2"
                value={asString(communication[field])}
                onChange={(e) =>
                  setCommunication({ [field]: e.target.value } as any)
                }
              >
                <option value="">-- Choisir --</option>
                <option>Libre et authentique</option>
                <option>Superficielle</option>
                <option>Partielle</option>
              </select>

              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={2}
                placeholder="Réflexions / exemples..."
                value={asString(communication[field + "Reflexion"])}
                onChange={(e) =>
                  setCommunication({
                    [field + "Reflexion"]: e.target.value,
                  } as any)
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // tab === "strategie"
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-bold">🧭 Stratégie thérapeutique</h2>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Description (gestaltiste) de la problématique
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            value={asString(strategie.descriptionGestalt)}
            onChange={(e) =>
              setStrategie({ descriptionGestalt: e.target.value })
            }
            placeholder="Décrire en termes gestaltistes ce que vous observez..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Stratégie thérapeutique (schémas de reproduction)
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            value={asString(strategie.strategie)}
            onChange={(e) => setStrategie({ strategie: e.target.value })}
            placeholder="Stratégie en lien avec les schémas de reproduction..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Relation thérapeutique (positionnement)
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            value={asString(strategie.relationTherapeutique)}
            onChange={(e) =>
              setStrategie({ relationTherapeutique: e.target.value })
            }
            placeholder="Comment vous vous êtes positionné pour aider la métabolisation..."
          />
        </div>
      </div>
    </div>
  );
}

/* ===== Enjeux checkbox réutilisable ===== */
type EnjeuCheckboxProps = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
  field: EnjeuFields;
  options: string[];
  reflexionField?: string;
  valideField?: string;
};

function EnjeuCheckbox({
  client,
  onSave,
  field,
  options,
  reflexionField,
  valideField,
}: EnjeuCheckboxProps) {
  const selected: string[] = Array.isArray((client as any)[field])
    ? ((client as any)[field] as string[])
    : [];

  const toggle = (option: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selected, option]))
      : selected.filter((o) => o !== option);

    onSave({ ...client, [field]: next } as any);
  };

  return (
    <div className="border rounded-2xl p-3 space-y-2">
      <div className="font-semibold">Enjeu : {field}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => toggle(opt, e.target.checked)}
            />
            {opt}
          </label>
        ))}
      </div>

      {reflexionField && (
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Réflexions
          </label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            value={asString((client as any)[reflexionField])}
            onChange={(e) =>
              onSave({ ...client, [reflexionField]: e.target.value } as any)
            }
            placeholder="Vos réflexions..."
          />
        </div>
      )}

      {valideField && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean((client as any)[valideField])}
            onChange={(e) =>
              onSave({ ...client, [valideField]: e.target.checked } as any)
            }
          />
          Validé par mon superviseur
        </label>
      )}
    </div>
  );
}
