// src/components/SectionAttachementGrid.tsx
import SectionClinicalGrid from "./SectionClinicalGrid";
import { attachementItems } from "../data/clinicalGrid";
import { Client, ClinicalSelection } from "../types";

type Props = {
  client: Client;
  onSave: (updated: Client, opts?: { immediate?: boolean }) => void;
};

export default function SectionAttachementGrid({ client, onSave }: Props) {
  const value: ClinicalSelection = client.attachementGrid ?? {
    selectedItemIds: [],
    notes: "",
  };

  return (
    <SectionClinicalGrid
      title="Attachement"
      family="attachement"
      items={attachementItems}
      value={value}
      onChange={(next) =>
        onSave(
          {
            ...client,
            attachementGrid: next,
          },
          { immediate: true }
        )
      }
    />
  );
}
