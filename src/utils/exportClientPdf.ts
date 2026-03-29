// src/utils/exportClientPdf.ts
import { jsPDF } from "jspdf";
import { Client } from "../types";

const formatDateFR = (iso?: string) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

function asText(value: any, fallback = "-") {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return fallback;
}

export function exportClientPdf(client: Client) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;

  let y = 16;

  const ensureSpace = (needed = 10) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 16;
    }
  };

  const addTitle = (text: string) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(text, margin, y);
    y += 8;
  };

  const addSection = (title: string) => {
    ensureSpace(12);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 6;
  };

  const addLine = (label: string, value: any) => {
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${label} :`, margin, y);

    doc.setFont("helvetica", "normal");
    const text = asText(value);
    const lines = doc.splitTextToSize(text, maxWidth - 35);
    doc.text(lines, margin + 35, y);
    y += Math.max(6, lines.length * 5);
  };

  const addParagraph = (label: string, value: any) => {
    const text = asText(value, "");
    if (!text) return;

    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${label} :`, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  const addDivider = () => {
    ensureSpace(4);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // Titre
  addTitle(`Dossier client - ${client.prenom} ${client.nom}`);

  addLine("Nom", client.nom);
  addLine("Prénom", client.prenom);
  addLine("Date", formatDateFR(client.date));
  addLine("Genre", client.genre);
  addLine("Cadre", client.cadre);
  addLine("Âge", client.age);
  addLine("Téléphone", client.telephone);
  addLine("Email", client.email);
  addLine("Adresse", client.adresse);

  addDivider();

  // Enjeux
  addSection("Enjeux");
  addLine("Attachement", (client as any).attachement);
  addLine("Estime de soi", (client as any).estime);
  addLine("Ethos / Eros", (client as any).ethosEros);
  addParagraph("Motif de consultation", (client as any).motifConsultation);
  addParagraph("Demande initiale", (client as any).demandeInitiale);

  addDivider();

  // Contact
  addSection("Contact / premières données");
  addParagraph("Prise de contact - notes", (client as any).priseContact?.notes);
  addLine(
    "Recommandation",
    (client as any).priseContact?.recommandation ? "Oui" : "Non"
  );
  addLine(
    "Nom recommandation",
    (client as any).priseContact?.recommandationNom
  );
  addLine(
    "Urgence",
    (client as any).urgenceConscience?.urgence?.niveau
  );
  addParagraph(
    "Pourquoi urgence",
    (client as any).urgenceConscience?.urgence?.pourquoi
  );
  addLine(
    "Conscience",
    (client as any).urgenceConscience?.conscience?.niveau
  );
  addParagraph(
    "Pourquoi conscience",
    (client as any).urgenceConscience?.conscience?.pourquoi
  );

  addDivider();

  // Champ 3 rapide
  addSection("Champ 3");
  addLine("Travail", (client as any).travail?.type);
  addLine("Profession", (client as any).travail?.profession);
  addParagraph("Vécu travail", (client as any).travail?.vecu);

  addLine("Couple", (client as any).couple?.statut);
  addLine("Précisions couple", (client as any).couple?.precisions);
  addParagraph("Vécu couple", (client as any).couple?.vecu);

  addParagraph("Divers", client.divers);
  addParagraph("Stresseurs", client.stresseurs);

  addDivider();

  // Relations
  const relations = Array.isArray((client as any).relations)
    ? (client as any).relations
    : [];

  addSection("Relations");
  if (relations.length === 0) {
    addLine("Relations", "Aucune relation renseignée");
  } else {
    relations.forEach((rel: any, index: number) => {
      ensureSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `${index + 1}. ${rel.prenom ?? "-"}${rel.nature ? ` (${rel.nature})` : ""}`,
        margin,
        y
      );
      y += 5;

      doc.setFont("helvetica", "normal");
      const meta = [
        rel.categorie ? `Catégorie : ${rel.categorie}` : "",
        rel.proximite ? `Proximité : ${rel.proximite}` : "",
        rel.impact ? `Impact : ${rel.impact}/10` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      if (meta) {
        const metaLines = doc.splitTextToSize(meta, maxWidth);
        doc.text(metaLines, margin, y);
        y += metaLines.length * 5;
      }

      if (rel.vecu) {
        const lines = doc.splitTextToSize(`Vécu : ${rel.vecu}`, maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5;
      }

      y += 2;
    });
  }

  addDivider();

  // Séances
  const seances = Array.isArray(client.seances) ? client.seances : [];

  addSection(`Séances (${seances.length})`);
  if (seances.length === 0) {
    addLine("Séances", "Aucune séance");
  } else {
    seances.forEach((s: any, index: number) => {
      ensureSpace(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Séance ${index + 1} - ${formatDateFR(s.date)}`, margin, y);
      y += 6;

      addParagraph("Résumé", s.resume);
      addParagraph("Transcription", s.transcription);
      addParagraph("Ce qui s'est passé", s.debriefSeance);
      addParagraph("Ressenti praticien", s.ressentiPraticien);
      addParagraph("Hypothèses cliniques", s.hypothesesCliniques);
      addParagraph("Pistes thérapeutiques", s.pistesTherapeutiques);

      if (Array.isArray(s.relationsEvoquees) && s.relationsEvoquees.length) {
        addLine("Relations évoquées", s.relationsEvoquees);
      }

      if (
        Array.isArray(s.emotionsDominantes) &&
        s.emotionsDominantes.length
      ) {
        addLine("Émotions dominantes", s.emotionsDominantes);
      }

      if (s.contreTransfert?.positif) {
        addParagraph("Contre-transfert positif", s.contreTransfert?.positifTexte);
      }

      if (s.contreTransfert?.negatif) {
        addParagraph("Contre-transfert négatif", s.contreTransfert?.negatifTexte);
      }

      addDivider();
    });
  }

  // Supervision
  const supervision = Array.isArray((client as any).supervision)
    ? (client as any).supervision
    : [];

  addSection(`Supervision (${supervision.length})`);
  if (supervision.length === 0) {
    addLine("Supervision", "Aucune supervision");
  } else {
    supervision.forEach((s: any, index: number) => {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Supervision ${index + 1} - ${formatDateFR(s.date)}`, margin, y);
      y += 5;
      addParagraph("Résumé", s.resume);
    });
  }

  const fileName = `${client.prenom ?? "client"}-${client.nom ?? "dossier"}.pdf`
    .toLowerCase()
    .replace(/\s+/g, "-");

  doc.save(fileName);
}
