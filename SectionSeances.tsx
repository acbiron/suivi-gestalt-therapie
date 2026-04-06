// src/components/SectionInfos.tsx
import { Client } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

export default function SectionInfos({ client, onSave }: Props) {
  const handleChange = (field: keyof Client, value: any) => {
    onSave({ ...client, [field]: value });
  };

  return (
    <div className="space-y-5 max-w-xl">
      
      {/* Âge */}
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-1">
          Âge
        </label>
        <input
          type="number"
          placeholder="Ex : 35"
          value={client.age ?? ""}
          onChange={(e) =>
            handleChange(
              "age",
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Téléphone */}
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-1">
          Numéro de téléphone
        </label>
        <input
          type="tel"
          placeholder="06 12 34 56 78"
          value={client.telephone ?? ""}
          onChange={(e) => handleChange("telephone", e.target.value)}
          className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="nom@email.com"
          value={client.email ?? ""}
          onChange={(e) => handleChange("email", e.target.value)}
          className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Adresse */}
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-1">
          Adresse
        </label>
        <input
          type="text"
          placeholder="Adresse du client"
          value={client.adresse ?? ""}
          onChange={(e) => handleChange("adresse", e.target.value)}
          className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
    </div>
  );
}