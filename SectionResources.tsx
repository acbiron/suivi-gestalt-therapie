// src/components/SectionEstimeGrid.tsx
import SectionClinicalGrid from "./SectionClinicalGrid";
import { estimeItems } from "../data/clinicalGrid";
import { Client, ClinicalSelection } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

export default function SectionEstimeGrid({ client, onSave }: Props) {
  const value: ClinicalSelection = client.estimeGrid ?? {
    selectedItemIds: [],
    notes: "",
  };

  return (
    <SectionClinicalGrid
      title="Estime de soi"
      family="estime"
      items={estimeItems}
      value={value}
      onChange={(next) =>
        onSave(
          {
            ...client,
            estimeGrid: next,
          },
          { immediate: true }
        )
      }
    />
  );
}
