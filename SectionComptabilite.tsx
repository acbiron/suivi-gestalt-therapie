// src/components/SectionCadre.tsx
import { Client } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

type CadreFields =
  | "absentPassageActe"
  | "annulation48h"
  | "tarif"
  | "dureeSeance"
  | "precisionsCadre"
  | "vecuCadre"
  | "autresCadre"
  | "cadreTeste";

export default function SectionCadre({ client, onSave }: Props) {
  if (!client) return <div>Client non trouvé</div>;

  const handleChange = (key: CadreFields, value: boolean | string) => {
    onSave({ ...client, [key]: value });
  };

  const checkboxFields: { key: CadreFields; label: string }[] = [
    { key: "absentPassageActe", label: "Absent / Passage à l'acte" },
    { key: "annulation48h", label: "Annulation 48h" },
    { key: "tarif", label: "Tarif" },
    { key: "dureeSeance", label: "Durée séance" },
  ];

  return (
    <div className="space-y-6">
      {/* Cadre - Première séance */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-2">
        <h2 className="font-bold text-lg">🪑 Cadre - Première séance</h2>

        {checkboxFields.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean((client as any)[key])}
              onChange={(e) => handleChange(key, e.target.checked)}
            />
            {label}
          </label>
        ))}

        <textarea
          placeholder="Précisions cadre"
          className="w-full border rounded p-2"
          value={client.precisionsCadre ?? ""}
          onChange={(e) => handleChange("precisionsCadre", e.target.value)}
        />
      </div>

      {/* Vécu du cadre */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-2">
        <h2 className="font-bold text-lg">📝 Vécu du cadre</h2>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={client.vecuCadre ?? ""}
          onChange={(e) => handleChange("vecuCadre", e.target.value)}
        />
      </div>

      {/* Autres éléments */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-2">
        <h2 className="font-bold text-lg">🔧 Autres éléments du cadre</h2>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={client.autresCadre ?? ""}
          onChange={(e) => handleChange("autresCadre", e.target.value)}
        />
      </div>

      {/* Cadre testé */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-2">
        <h2 className="font-bold text-lg">✅ Cadre testé ?</h2>
        <textarea
          className="w-full border rounded p-2"
          rows={2}
          value={client.cadreTeste ?? ""}
          onChange={(e) => handleChange("cadreTeste", e.target.value)}
        />
      </div>
    </div>
  );
}