// src/components/SectionContact.tsx
import { useEffect, useMemo } from "react";
import { Client } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

type PriseContact = {
  calendly?: boolean;
  appel?: boolean;
  sms?: boolean;
  mail?: boolean;
  recommandation?: boolean;
  recommandationNom?: string;
  notes?: string;
};

type Barometre = {
  niveau?: number; // 1..10
  pourquoi?: string; // ✅ 1 seule zone
};

type UrgenceConscience = {
  urgence?: Barometre; // 1 vert -> 10 rouge
  conscience?: Barometre; // 1 rouge -> 10 vert
};

function ensureArrayLen5(value: any): string[] {
  const arr = Array.isArray(value) ? value : [];
  return [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[3] ?? "", arr[4] ?? ""];
}

function clampNiveau(n: any): number | undefined {
  const v = Number(n);
  if (!Number.isFinite(v)) return undefined;
  if (v < 1) return 1;
  if (v > 10) return 10;
  return Math.round(v);
}

function Barometre10({
  title,
  subtitle,
  gradientCss,
  leftLabel,
  rightLabel,
  niveau,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  gradientCss: string;
  leftLabel?: string;
  rightLabel?: string;
  niveau?: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
        </div>

        <div className="text-sm font-semibold">Sélection : {niveau ?? "—"}</div>
      </div>

      <div className="rounded-xl p-3 border" style={{ background: gradientCss }}>
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = niveau === n;
            return (
              <button
                key={n}
                onClick={() => onSelect(n)}
                className={`py-2 rounded-lg text-sm border bg-white/70 hover:bg-white transition ${
                  active ? "ring-2 ring-blue-400 font-bold" : ""
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {(leftLabel || rightLabel) && (
          <div className="flex justify-between text-xs text-gray-600 mt-2 px-1">
            <span>{leftLabel ?? ""}</span>
            <span>{rightLabel ?? ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SectionContact({ client, onSave }: Props) {
  if (!client) return null;

  const priseContact: PriseContact = (client as any).priseContact ?? {
    calendly: false,
    appel: false,
    sms: false,
    mail: false,
    recommandation: false,
    recommandationNom: "",
    notes: "",
  };

  const allureGenerale = useMemo(
    () => ensureArrayLen5((client as any).allureGenerale),
    [client]
  );

  const demandeInitiale: string = (client as any).demandeInitiale ?? "";

  // ✅ NOUVEAU : Motif de consultation
  const motifConsultation: string = (client as any).motifConsultation ?? "";

  const uc: UrgenceConscience = (client as any).urgenceConscience ?? {};
  const urgence: Barometre = {
    niveau: clampNiveau(uc.urgence?.niveau),
    pourquoi: typeof uc.urgence?.pourquoi === "string" ? uc.urgence.pourquoi : "",
  };
  const conscience: Barometre = {
    niveau: clampNiveau(uc.conscience?.niveau),
    pourquoi:
      typeof uc.conscience?.pourquoi === "string" ? uc.conscience.pourquoi : "",
  };

  // Init (une fois) si champs manquants
  useEffect(() => {
    const needsInit =
      (client as any).priseContact === undefined ||
      (client as any).allureGenerale === undefined ||
      (client as any).demandeInitiale === undefined ||
      (client as any).motifConsultation === undefined || // ✅ NEW
      (client as any).urgenceConscience === undefined;

    if (!needsInit) return;

    onSave(
      {
        ...client,
        priseContact,
        allureGenerale,
        demandeInitiale,
        motifConsultation, // ✅ NEW
        urgenceConscience: {
          urgence,
          conscience,
        },
      } as any,
      { immediate: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPriseContact = (patch: Partial<PriseContact>) => {
    const next: PriseContact = { ...priseContact, ...patch };
    if (patch.recommandation === false) next.recommandationNom = "";
    onSave({ ...client, priseContact: next } as any);
  };

  const setAllure = (index: number, value: string) => {
    const next = [...allureGenerale];
    next[index] = value;
    onSave({ ...client, allureGenerale: next } as any);
  };

  const setDemandeInitiale = (value: string) => {
    onSave({ ...client, demandeInitiale: value } as any);
  };

  // ✅ NEW
  const setMotifConsultation = (value: string) => {
    onSave({ ...client, motifConsultation: value } as any);
  };

  const setUrgence = (patch: Partial<Barometre>) => {
    onSave(
      {
        ...client,
        urgenceConscience: {
          urgence: { ...urgence, ...patch },
          conscience,
        },
      } as any
    );
  };

  const setConscience = (patch: Partial<Barometre>) => {
    onSave(
      {
        ...client,
        urgenceConscience: {
          urgence,
          conscience: { ...conscience, ...patch },
        },
      } as any
    );
  };

  return (
    <div className="space-y-6">
      {/* 1) Prise de contact */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="font-bold text-lg">📞 Prise de contact avec le client</h2>
        <p className="text-sm text-gray-600">
          Manière de prendre contact, aller-retour éventuels, premières sensations
          (attachement / estime de soi).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(priseContact.calendly)}
              onChange={(e) => setPriseContact({ calendly: e.target.checked })}
            />
            Calendly
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(priseContact.appel)}
              onChange={(e) => setPriseContact({ appel: e.target.checked })}
            />
            Appel
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(priseContact.sms)}
              onChange={(e) => setPriseContact({ sms: e.target.checked })}
            />
            SMS
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(priseContact.mail)}
              onChange={(e) => setPriseContact({ mail: e.target.checked })}
            />
            Mail
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(priseContact.recommandation)}
              onChange={(e) =>
                setPriseContact({ recommandation: e.target.checked })
              }
            />
            Recommandation ?
          </label>

          {priseContact.recommandation && (
            <input
              type="text"
              placeholder="Nom de la personne qui recommande"
              value={priseContact.recommandationNom ?? ""}
              onChange={(e) =>
                setPriseContact({ recommandationNom: e.target.value })
              }
              className="w-full border rounded p-2"
            />
          )}
        </div>

        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Notes : aller-retours, premières sensations, attachement / estime..."
          value={priseContact.notes ?? ""}
          onChange={(e) => setPriseContact({ notes: e.target.value })}
        />
      </div>

      {/* 1bis) Urgence / Conscience */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-6">
        <h2 className="font-bold text-lg">🚨 Urgence / Conscience</h2>

        {/* Urgence */}
        <Barometre10
          title="Niveau d’urgence"
          subtitle="1 (faible) → 10 (élevée)"
          gradientCss="linear-gradient(90deg, rgba(34,197,94,0.22) 0%, rgba(239,68,68,0.22) 100%)"
          niveau={urgence.niveau}
          onSelect={(n) => setUrgence({ niveau: n })}
        />

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Pourquoi ? (verbatim + analyse)
          </label>
          <textarea
            rows={3}
            className="w-full border rounded p-2"
            placeholder="Pourquoi ce niveau d’urgence ?"
            value={urgence.pourquoi ?? ""}
            onChange={(e) => setUrgence({ pourquoi: e.target.value })}
          />
        </div>

        <div className="h-px bg-gray-200" />

        {/* Conscience */}
        <Barometre10
          title="Niveau de conscience"
          subtitle="1 (Victime) → 10 (Créateur)"
          gradientCss="linear-gradient(90deg, rgba(239,68,68,0.22) 0%, rgba(34,197,94,0.22) 100%)"
          leftLabel="Victime"
          rightLabel="Créateur"
          niveau={conscience.niveau}
          onSelect={(n) => setConscience({ niveau: n })}
        />

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Pourquoi ? (verbatim + analyse)
          </label>
          <textarea
            rows={3}
            className="w-full border rounded p-2"
            placeholder="Pourquoi ce niveau de conscience ?"
            value={conscience.pourquoi ?? ""}
            onChange={(e) => setConscience({ pourquoi: e.target.value })}
          />
        </div>
      </div>

      {/* 2) Allure générale */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <h2 className="font-bold text-lg">👤 Allure générale</h2>
        <p className="text-sm text-gray-600">
          Est-ce que la personne a fait une recherche pour s’habiller / se coiffer ?
          (5 premières séances)
        </p>

        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => i).map((i) => (
            <div key={i} className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Séance {i + 1}
              </label>
              <textarea
                className="w-full border rounded p-2"
                rows={2}
                placeholder={`Notes allure générale - séance ${i + 1}`}
                value={allureGenerale[i] ?? ""}
                onChange={(e) => setAllure(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3) Demande initiale + Motif */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div className="space-y-2">
          <h2 className="font-bold text-lg">🗣️ Demande initiale (verbatim)</h2>
          <textarea
            className="w-full border rounded p-2"
            rows={5}
            placeholder="Noter le verbatim du client..."
            value={demandeInitiale}
            onChange={(e) => setDemandeInitiale(e.target.value)}
          />
        </div>

        {/* ✅ NEW : Motif de consultation */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            📝 Motif de consultation
          </label>
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            placeholder="Motif de consultation..."
            value={motifConsultation}
            onChange={(e) => setMotifConsultation(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}