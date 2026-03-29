// src/components/SectionSelf.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Client } from "../types";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

const positiveEmotions = [
  { n: 40, label: "Amour" },
  { n: 39, label: "Joie" },
  { n: 38, label: "Paix" },
  { n: 37, label: "Gratitude" },
  { n: 36, label: "Bien-être" },
  { n: 35, label: "Confiance" },
  { n: 34, label: "Fierté" },
  { n: 33, label: "Désir" },
  { n: 32, label: "Plaisir" },
  { n: 31, label: "Pardon" },
  { n: 30, label: "Acceptation" },
  { n: 29, label: "Lâcher prise" },
  { n: 28, label: "Appréciation" },
  { n: 27, label: "Sécurité" },
  { n: 26, label: "Clarté" },
  { n: 25, label: "Étonnement" },
  { n: 24, label: "Intérêt" },
  { n: 23, label: "Curiosité" },
  { n: 22, label: "Apaisement" },
  { n: 21, label: "Espoir" },
] as const;

const negativeEmotions = [
  { n: 20, label: "Ennui" },
  { n: 19, label: "Confusion" },
  { n: 18, label: "Doute" },
  { n: 17, label: "Déception" },
  { n: 16, label: "Frustration" },
  { n: 15, label: "Critique" },
  { n: 14, label: "Jalousie" },
  { n: 13, label: "Dévalorisation" },
  { n: 12, label: "Tristesse" },
  { n: 11, label: "Rejet" },
  { n: 10, label: "Abandon" },
  { n: 9, label: "Trahison" },
  { n: 8, label: "Colère" },
  { n: 7, label: "Dégoût" },
  { n: 6, label: "Mépris" },
  { n: 5, label: "Rage" },
  { n: 4, label: "Impuissance" },
  { n: 3, label: "Culpabilité" },
  { n: 2, label: "Honte" },
  { n: 1, label: "Peur" },
] as const;

const emotions = [...positiveEmotions, ...negativeEmotions]
  .sort((a, b) => b.n - a.n)
  .map((e) => e.label);

type TypeCase = "fluidité" | "anesthésie" | "envahissement" | "inhibition";
const typesCases: TypeCase[] = [
  "fluidité",
  "anesthésie",
  "envahissement",
  "inhibition",
];

type PresenceLevel = "Peu présent" | "Présent" | "Très présent" | "";

type ContactRegulationKey =
  | "confluence"
  | "deflexionInterne"
  | "deflexionExterne"
  | "retroflexion"
  | "introjection"
  | "projection"
  | "egotisme";

type ZinkerStatus = "fluide" | "ralenti" | "bloque" | "";
type ZinkerStepKey =
  | "retrait1"
  | "sensation"
  | "priseConscience"
  | "mobilisation"
  | "action"
  | "preContact"
  | "contact"
  | "desengagement"
  | "assimilation"
  | "retrait2";

type SelfData = {
  corps: Record<string, Record<TypeCase, boolean>>;
  croyances: {
    positivesSoi: string;
    negativesSoi: string;
    positivesAutres: string;
    negativesAutres: string;
  };
  je: {
    negatif: { niveau: PresenceLevel; texte: string };
    positif: { niveau: PresenceLevel; texte: string };
    aligne: { niveau: PresenceLevel; texte: string };
  };
  etre: {
    acces: boolean;
    texte: string;
  };
  contactRegulations: Record<
    ContactRegulationKey,
    { checked: boolean; note: string }
  >;
  zinkerCycle: Record<ZinkerStepKey, { status: ZinkerStatus; note: string }>;
};

const CONTACT_REGULATIONS: Array<{
  key: ContactRegulationKey;
  label: string;
  emoji: string;
}> = [
  { key: "confluence", label: "Confluence", emoji: "🔄" },
  { key: "deflexionInterne", label: "Déflexion interne", emoji: "↪️" },
  { key: "deflexionExterne", label: "Déflexion externe", emoji: "↩️" },
  { key: "retroflexion", label: "Rétroflexion", emoji: "🔁" },
  { key: "introjection", label: "Introjection", emoji: "⬇️" },
  { key: "projection", label: "Projection", emoji: "🪞" },
  { key: "egotisme", label: "Égotisme", emoji: "⭐" },
];

const ZINKER_STEPS: Array<{ key: ZinkerStepKey; label: string }> = [
  { key: "retrait1", label: "Retrait" },
  { key: "sensation", label: "Sensation" },
  { key: "priseConscience", label: "Prise de conscience" },
  { key: "mobilisation", label: "Mobilisation de l’énergie" },
  { key: "action", label: "Action" },
  { key: "preContact", label: "Pré-contact" },
  { key: "contact", label: "Contact" },
  { key: "desengagement", label: "Désengagement" },
  { key: "assimilation", label: "Assimilation" },
  { key: "retrait2", label: "Retrait à nouveau" },
];

const positiveSet = new Set<string>(positiveEmotions.map((e) => e.label));
const negativeSet = new Set<string>(negativeEmotions.map((e) => e.label));

const numberByEmotion = new Map<string, number>([
  ...positiveEmotions.map((e) => [e.label, e.n] as const),
  ...negativeEmotions.map((e) => [e.label, e.n] as const),
]);

function buildDefaultSelf(): SelfData {
  const corps: Record<string, Record<TypeCase, boolean>> = {};
  emotions.forEach((emo) => {
    corps[emo] = {
      fluidité: false,
      anesthésie: false,
      envahissement: false,
      inhibition: false,
    };
  });

  return {
    corps,
    croyances: {
      positivesSoi: "",
      negativesSoi: "",
      positivesAutres: "",
      negativesAutres: "",
    },
    je: {
      negatif: { niveau: "", texte: "" },
      positif: { niveau: "", texte: "" },
      aligne: { niveau: "", texte: "" },
    },
    etre: { acces: false, texte: "" },
    contactRegulations: {
      confluence: { checked: false, note: "" },
      deflexionInterne: { checked: false, note: "" },
      deflexionExterne: { checked: false, note: "" },
      retroflexion: { checked: false, note: "" },
      introjection: { checked: false, note: "" },
      projection: { checked: false, note: "" },
      egotisme: { checked: false, note: "" },
    },
    zinkerCycle: {
      retrait1: { status: "", note: "" },
      sensation: { status: "", note: "" },
      priseConscience: { status: "", note: "" },
      mobilisation: { status: "", note: "" },
      action: { status: "", note: "" },
      preContact: { status: "", note: "" },
      contact: { status: "", note: "" },
      desengagement: { status: "", note: "" },
      assimilation: { status: "", note: "" },
      retrait2: { status: "", note: "" },
    },
  };
}

function normalizeSelf(raw: any): { self: SelfData; changed: boolean } {
  const def = buildDefaultSelf();

  if (!raw || typeof raw !== "object") return { self: def, changed: true };

  let changed = false;

  const next: SelfData = {
    ...def,
    ...raw,
    corps: { ...def.corps, ...(raw.corps || {}) },
    croyances: { ...def.croyances, ...(raw.croyances || {}) },
    je: { ...def.je, ...(raw.je || {}) },
    etre: { ...def.etre, ...(raw.etre || {}) },
    contactRegulations: {
      ...def.contactRegulations,
      ...(raw.contactRegulations || {}),
    },
    zinkerCycle: {
      ...def.zinkerCycle,
      ...(raw.zinkerCycle || {}),
    },
  };

  (["negatif", "positif", "aligne"] as const).forEach((k) => {
    const b = (next.je as any)[k] || {};
    (next.je as any)[k] = {
      niveau: (b.niveau as PresenceLevel) ?? "",
      texte: typeof b.texte === "string" ? b.texte : "",
    };
  });

  next.etre = {
    acces: Boolean((next.etre as any).acces),
    texte:
      typeof (next.etre as any).texte === "string"
        ? (next.etre as any).texte
        : "",
  };

  emotions.forEach((emo) => {
    if (!next.corps[emo] || typeof next.corps[emo] !== "object") {
      next.corps[emo] = {
        fluidité: false,
        anesthésie: false,
        envahissement: false,
        inhibition: false,
      };
      changed = true;
      return;
    }
    typesCases.forEach((t) => {
      if (typeof next.corps[emo][t] !== "boolean") {
        next.corps[emo][t] = false;
        changed = true;
      }
    });
  });

  CONTACT_REGULATIONS.forEach(({ key }) => {
    const item = next.contactRegulations[key];
    next.contactRegulations[key] = {
      checked: Boolean(item?.checked),
      note: typeof item?.note === "string" ? item.note : "",
    };
  });

  ZINKER_STEPS.forEach(({ key }) => {
    const item = next.zinkerCycle[key];
    next.zinkerCycle[key] = {
      status: (item?.status as ZinkerStatus) ?? "",
      note: typeof item?.note === "string" ? item.note : "",
    };
  });

  if (
    !raw.croyances ||
    !raw.je ||
    !raw.etre ||
    !raw.corps ||
    !raw.contactRegulations ||
    !raw.zinkerCycle
  ) {
    changed = true;
  }

  return { self: next, changed };
}

function getAssignedTypeForEmotion(
  corps: SelfData["corps"],
  emo: string
): TypeCase | null {
  const entry = corps?.[emo];
  if (!entry) return null;
  for (const t of typesCases) if (entry[t]) return t;
  return null;
}

function setAssignedTypeForEmotion(
  corps: SelfData["corps"],
  emo: string,
  assigned: TypeCase | null
): SelfData["corps"] {
  const next = { ...corps };
  const reset: Record<TypeCase, boolean> = {
    fluidité: false,
    anesthésie: false,
    envahissement: false,
    inhibition: false,
  };
  next[emo] = assigned ? { ...reset, [assigned]: true } : reset;
  return next;
}

function EmotionChip({ emo }: { emo: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: emo });

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  const n = numberByEmotion.get(emo);
  const isPos = positiveSet.has(emo);
  const isNeg = negativeSet.has(emo);

  const toneClass = isPos
    ? "border-green-200 bg-green-50 text-green-900"
    : isNeg
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-gray-200 bg-white text-gray-900";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`select-none cursor-grab active:cursor-grabbing px-3 py-2 rounded-xl border shadow-sm text-sm
        ${toneClass}
        ${isDragging ? "opacity-60" : ""}`}
    >
      <span className="font-semibold">{n ? `${n}. ` : ""}</span>
      {emo}
    </div>
  );
}

function DropColumn({
  id,
  title,
  count,
  children,
  variant,
}: {
  id: TypeCase | "none";
  title: string;
  count: number;
  children: React.ReactNode;
  variant?: "none";
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const styles =
    id === "none"
      ? "bg-amber-100 border-amber-200"
      : id === "fluidité"
      ? "bg-green-100 border-green-200"
      : id === "anesthésie"
      ? "bg-blue-100 border-blue-200"
      : id === "envahissement"
      ? "bg-rose-100 border-rose-200"
      : "bg-violet-100 border-violet-200";

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-3 border shadow space-y-2 min-h-[180px] transition ${
        variant === "none" ? "bg-amber-50 border-amber-200" : styles
      } ${isOver ? "ring-2 ring-blue-300" : ""}`}
    >
      <div className="sticky top-0 bg-white/90 backdrop-blur z-10 rounded-lg px-2 py-1 font-semibold flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs text-gray-600">({count})</span>
      </div>

      <div className="space-y-2">
        {children}
        {count === 0 && <div className="text-sm text-gray-400">—</div>}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  emoji,
  tone,
  children,
  defaultOpen = true,
}: {
  title: string;
  emoji: string;
  tone: "blue" | "green" | "purple" | "amber" | "rose" | "indigo" | "gray";
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toneMap = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
    rose: "bg-rose-50 border-rose-200",
    indigo: "bg-indigo-50 border-indigo-200",
    gray: "bg-gray-50 border-gray-200",
  };

  return (
    <div className={`rounded-2xl border shadow ${toneMap[tone]}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="font-bold text-lg">
          {emoji} {title}
        </div>
        <div className="text-sm">{open ? "🔽" : "▶️"}</div>
      </button>

      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function zinkerStatusClass(status: ZinkerStatus) {
  if (status === "fluide")
    return "bg-green-100 border-green-200 text-green-800";
  if (status === "ralenti")
    return "bg-amber-100 border-amber-200 text-amber-800";
  if (status === "bloque") return "bg-red-100 border-red-200 text-red-800";
  return "bg-gray-100 border-gray-200 text-gray-600";
}

export default function SectionSelf({ client, onSave }: Props) {
  if (!client) return <div>Client non trouvé</div>;

  const { self, changed } = useMemo(
    () => normalizeSelf((client as any).self),
    [client]
  );

  const [selectedZinkerStep, setSelectedZinkerStep] =
    useState<ZinkerStepKey>("retrait1");

  useEffect(() => {
    if (!changed) return;
    onSave({ ...client, self } as any, { immediate: true });
  }, [changed, client, onSave, self]);

  const byColumn: Record<TypeCase, string[]> = {
    fluidité: [],
    anesthésie: [],
    envahissement: [],
    inhibition: [],
  };
  const unassigned: string[] = [];

  emotions.forEach((emo) => {
    const assigned = getAssignedTypeForEmotion(self.corps, emo);
    if (!assigned) unassigned.push(emo);
    else byColumn[assigned].push(emo);
  });

  const saveSelf = (
    patch: Partial<SelfData>,
    opts?: { immediate?: boolean }
  ) => {
    onSave({ ...client, self: { ...self, ...patch } } as any, opts);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const emo = event.active?.id as string | undefined;
    const drop = event.over?.id as TypeCase | "none" | undefined;
    if (!emo || !drop) return;

    const nextCorps =
      drop === "none"
        ? setAssignedTypeForEmotion(self.corps, emo, null)
        : setAssignedTypeForEmotion(self.corps, emo, drop);

    saveSelf({ corps: nextCorps }, { immediate: true });
  };

  const selectedStep = ZINKER_STEPS.find((s) => s.key === selectedZinkerStep)!;
  const selectedZinker = self.zinkerCycle[selectedZinkerStep];

  return (
    <div className="space-y-6">
      <SectionCard title="CORPS-ÇA : Émotions" emoji="🫀" tone="green">
        <div className="space-y-4">
          <DndContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <DropColumn
                id="none"
                title="Non classées"
                count={unassigned.length}
                variant="none"
              >
                {unassigned.map((emo) => (
                  <EmotionChip key={emo} emo={emo} />
                ))}
              </DropColumn>

              <DropColumn
                id="fluidité"
                title="Fluidité"
                count={byColumn.fluidité.length}
              >
                {byColumn.fluidité.map((emo) => (
                  <EmotionChip key={emo} emo={emo} />
                ))}
              </DropColumn>

              <DropColumn
                id="anesthésie"
                title="Anesthésie"
                count={byColumn.anesthésie.length}
              >
                {byColumn.anesthésie.map((emo) => (
                  <EmotionChip key={emo} emo={emo} />
                ))}
              </DropColumn>

              <DropColumn
                id="envahissement"
                title="Envahissement"
                count={byColumn.envahissement.length}
              >
                {byColumn.envahissement.map((emo) => (
                  <EmotionChip key={emo} emo={emo} />
                ))}
              </DropColumn>

              <DropColumn
                id="inhibition"
                title="Inhibition"
                count={byColumn.inhibition.length}
              >
                {byColumn.inhibition.map((emo) => (
                  <EmotionChip key={emo} emo={emo} />
                ))}
              </DropColumn>
            </div>
          </DndContext>

          <div className="text-xs text-gray-500">
            Astuce : pour retirer une émotion d’un bloc, glisse-la dans “Non
            classées”.
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Régulation du contact"
        emoji="🔄"
        tone="amber"
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTACT_REGULATIONS.map((item) => {
            const current = self.contactRegulations[item.key];
            return (
              <div
                key={item.key}
                className="border rounded-2xl p-4 space-y-3 bg-white"
              >
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={current.checked}
                    onChange={(e) =>
                      saveSelf({
                        contactRegulations: {
                          ...self.contactRegulations,
                          [item.key]: {
                            ...current,
                            checked: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  <span>
                    {item.emoji} {item.label}
                  </span>
                </label>

                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  placeholder="Comment ça se manifeste ? Exemple / verbatim / indice clinique..."
                  value={current.note}
                  onChange={(e) =>
                    saveSelf({
                      contactRegulations: {
                        ...self.contactRegulations,
                        [item.key]: {
                          ...current,
                          note: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Cycle de Zinker"
        emoji="🌀"
        tone="rose"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {ZINKER_STEPS.map((step, index) => {
              const current = self.zinkerCycle[step.key];
              const isSelected = selectedZinkerStep === step.key;

              return (
                <React.Fragment key={step.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedZinkerStep(step.key)}
                    className={`px-3 py-2 rounded-full border text-sm font-medium transition ${zinkerStatusClass(
                      current.status
                    )} ${isSelected ? "ring-2 ring-slate-400" : ""}`}
                    title={current.note || step.label}
                  >
                    {step.label}
                  </button>

                  {index < ZINKER_STEPS.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="text-xs text-gray-500">
            Clique sur une étape, puis indique si elle est fluide, ralentie ou
            bloquée.
          </div>

          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <div className="font-semibold">{selectedStep.label}</div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "fluide" as ZinkerStatus,
                  label: "Fluide",
                  cls: "bg-green-100 border-green-200",
                },
                {
                  value: "ralenti" as ZinkerStatus,
                  label: "Ralenti",
                  cls: "bg-amber-100 border-amber-200",
                },
                {
                  value: "bloque" as ZinkerStatus,
                  label: "Bloqué",
                  cls: "bg-red-100 border-red-200",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    saveSelf({
                      zinkerCycle: {
                        ...self.zinkerCycle,
                        [selectedZinkerStep]: {
                          ...selectedZinker,
                          status:
                            selectedZinker.status === opt.value
                              ? ""
                              : opt.value,
                        },
                      },
                    })
                  }
                  className={`px-3 py-1 rounded-full border text-sm ${
                    selectedZinker.status === opt.value
                      ? opt.cls
                      : "bg-white border-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Note clinique / exemple d’arrêt, de ralentissement ou de fluidité..."
              value={selectedZinker.note}
              onChange={(e) =>
                saveSelf({
                  zinkerCycle: {
                    ...self.zinkerCycle,
                    [selectedZinkerStep]: {
                      ...selectedZinker,
                      note: e.target.value,
                    },
                  },
                })
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personnalité : Croyances" emoji="🧠" tone="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Croyances positives sur soi
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={self.croyances.positivesSoi}
              onChange={(e) =>
                saveSelf({
                  croyances: {
                    ...self.croyances,
                    positivesSoi: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Croyances négatives sur soi
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={self.croyances.negativesSoi}
              onChange={(e) =>
                saveSelf({
                  croyances: {
                    ...self.croyances,
                    negativesSoi: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Croyances positives sur les autres
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={self.croyances.positivesAutres}
              onChange={(e) =>
                saveSelf({
                  croyances: {
                    ...self.croyances,
                    positivesAutres: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Croyances négatives sur les autres
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={self.croyances.negativesAutres}
              onChange={(e) =>
                saveSelf({
                  croyances: {
                    ...self.croyances,
                    negativesAutres: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="JE" emoji="🪞" tone="purple" defaultOpen={false}>
        <div className="space-y-4">
          {(
            [
              ["negatif", "Je négatif"],
              ["positif", "Je positif"],
              ["aligne", "Je aligné"],
            ] as const
          ).map(([key, label]) => {
            const block = (self.je as any)[key] as {
              niveau: PresenceLevel;
              texte: string;
            };

            return (
              <div
                key={key}
                className="border rounded-2xl p-3 space-y-2 bg-white"
              >
                <div className="font-semibold">{label}</div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Présence
                  </label>
                  <select
                    className="w-full border rounded p-2"
                    value={block.niveau}
                    onChange={(e) =>
                      saveSelf({
                        je: {
                          ...self.je,
                          [key]: {
                            ...block,
                            niveau: e.target.value as PresenceLevel,
                          },
                        } as any,
                      })
                    }
                  >
                    <option value="">-- Choisir --</option>
                    <option value="Peu présent">Peu présent</option>
                    <option value="Présent">Présent</option>
                    <option value="Très présent">Très présent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Notes
                  </label>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    placeholder="Observations / verbatim / analyse..."
                    value={block.texte}
                    onChange={(e) =>
                      saveSelf({
                        je: {
                          ...self.je,
                          [key]: {
                            ...block,
                            texte: e.target.value,
                          },
                        } as any,
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Être" emoji="✨" tone="indigo" defaultOpen={false}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={self.etre.acces}
              onChange={(e) =>
                saveSelf({ etre: { ...self.etre, acces: e.target.checked } })
              }
            />
            Le client y a-t-il accès ?
          </label>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Verbatim + analyse..."
              value={self.etre.texte}
              onChange={(e) =>
                saveSelf({ etre: { ...self.etre, texte: e.target.value } })
              }
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
