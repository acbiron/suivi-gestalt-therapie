// src/components/SectionSupervision.tsx
import { useEffect, useMemo, useState } from "react";
import { Client, Seance } from "../types";
import { formatDateFR } from "../utils/date";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

export default function SectionSupervision({ client, onSave }: Props) {
  if (!client) return <div>Client non trouvé</div>;

  const [dateSup, setDateSup] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // On s'assure que supervision existe (sans muter)
  const supervision: Seance[] = useMemo(() => {
    return (client.supervision ?? []) as Seance[];
  }, [client.supervision]);

  // Initialisation sécurisée si absent dans Firestore
  useEffect(() => {
    if (client.supervision === undefined) {
      onSave({ ...client, supervision: [] } as any, { immediate: true });
    }
  }, [client, onSave]);

  const addSupervision = () => {
    if (!dateSup) return;

    const newSeance: Seance = {
      date: dateSup,
      resume: "",
      transcription: "",
    };

    // Ajout en haut
    const next = [newSeance, ...supervision];

    // Action ponctuelle → immediate
    onSave({ ...client, supervision: next } as any, { immediate: true });
    setDateSup("");
  };

  const updateSupervisionResume = (supIndex: number, value: string) => {
    const next = supervision.map((s, i) =>
      i === supIndex ? ({ ...s, resume: value } as Seance) : s
    );

    onSave({ ...client, supervision: next } as any);
  };

  return (
    <div className="space-y-6">
      {/* Ajouter supervision */}
      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={dateSup}
          onChange={(e) => setDateSup(e.target.value)}
          className="border rounded p-2"
        />
        <button
          onClick={addSupervision}
          className="px-4 py-2 rounded bg-gradient-to-r from-pink-200 to-blue-200"
        >
          ➕ Ajouter supervision
        </button>
      </div>

      {/* Liste des supervisions */}
      {supervision.map((s, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="bg-white p-4 rounded-2xl shadow space-y-2">
            <button
              className="w-full flex justify-between items-center mb-2"
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <span>🗓 Supervision du {formatDateFR(s.date)}</span>
              <span>{isOpen ? "🔽" : "▶️"}</span>
            </button>

            {isOpen && (
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                placeholder="Résumé / notes"
                value={s.resume ?? ""}
                onChange={(e) => updateSupervisionResume(i, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
