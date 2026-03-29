// src/components/SectionDivers.tsx
import { Client } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

export default function SectionDivers({ client, onSave }: Props) {
  if (!client) return <div>Client non trouvé</div>;

  const handleChange = (value: string) => {
    onSave({ ...client, divers: value });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold mb-2">Notes diverses</h3>
      <textarea
        placeholder="Saisir vos notes ici..."
        value={client.divers ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full border rounded p-2 h-40 resize-none"
      />
    </div>
  );
}