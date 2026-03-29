import { useMemo, useState } from "react";
import {
  Client,
  ReceiptBookData,
  ReceiptEntry,
  ReceiptPaymentMethod,
  ReceiptType,
} from "../types";

type Props = {
  data?: ReceiptBookData;
  clients: Client[];
  onSave: (next: ReceiptBookData) => void;
};

const RECEIPT_TYPES: ReceiptType[] = [
  "séance gestalt",
  "autre prestation",
  "formation",
  "atelier",
];

const PAYMENT_METHODS: ReceiptPaymentMethod[] = [
  "espèces",
  "virement",
  "chèque",
  "cb",
  "autre",
];

function uid() {
  // @ts-ignore
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? // @ts-ignore
      crypto.randomUUID()
    : `rec_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function normalizeData(raw?: ReceiptBookData): ReceiptBookData {
  return {
    entries: Array.isArray(raw?.entries) ? raw.entries : [],
  };
}

function formatDateFR(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso || "";
  return `${d}-${m}-${y}`;
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n || 0);
}

function getYearFromDate(date?: string) {
  if (!date) return "";
  return date.slice(0, 4);
}

function getMonthFromDate(date?: string) {
  if (!date) return "";
  return date.slice(5, 7);
}

function getMonthLabel(month: string) {
  const labels: Record<string, string> = {
    "01": "Janvier",
    "02": "Février",
    "03": "Mars",
    "04": "Avril",
    "05": "Mai",
    "06": "Juin",
    "07": "Juillet",
    "08": "Août",
    "09": "Septembre",
    "10": "Octobre",
    "11": "Novembre",
    "12": "Décembre",
  };

  return labels[month] || month;
}

function getReceiptTypeLabel(type: ReceiptType) {
  switch (type) {
    case "séance gestalt":
      return "🛋️ Séance Gestalt";
    case "autre prestation":
      return "🧾 Autre prestation";
    case "formation":
      return "📘 Formation";
    case "atelier":
      return "👥 Atelier";
    default:
      return type;
  }
}

function typeBadge(type: ReceiptType) {
  switch (type) {
    case "séance gestalt":
      return "bg-emerald-100 text-emerald-800";
    case "autre prestation":
      return "bg-blue-100 text-blue-800";
    case "formation":
      return "bg-violet-100 text-violet-800";
    case "atelier":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getEntryMainLabel(entry: ReceiptEntry) {
  if (entry.typeRecette === "séance gestalt") {
    return entry.clientLabel || "Client non renseigné";
  }

  return entry.libelleLibre || entry.clientLabel || "Sans libellé";
}

export default function SectionLivreRecettes({ data, clients, onSave }: Props) {
  const normalized = useMemo(() => normalizeData(data), [data]);
  const entries = normalized.entries;

  const activeClients = clients
    .filter((c) => !c.archived)
    .sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );

  const [form, setForm] = useState({
    typeRecette: "séance gestalt" as ReceiptType,
    clientId: "",
    libelleLibre: "",
    dateEvenement: new Date().toISOString().slice(0, 10),
    datePaiement: new Date().toISOString().slice(0, 10),
    montant: "",
    numeroFacture: "",
    modePaiement: "espèces" as ReceiptPaymentMethod,
    notes: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    typeRecette: "séance gestalt" as ReceiptType,
    clientId: "",
    libelleLibre: "",
    dateEvenement: "",
    datePaiement: "",
    montant: "",
    numeroFacture: "",
    modePaiement: "espèces" as ReceiptPaymentMethod,
    notes: "",
  });

  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const resetForm = () => {
    setForm({
      typeRecette: "séance gestalt",
      clientId: "",
      libelleLibre: "",
      dateEvenement: new Date().toISOString().slice(0, 10),
      datePaiement: new Date().toISOString().slice(0, 10),
      montant: "",
      numeroFacture: "",
      modePaiement: "espèces",
      notes: "",
    });
  };

  const addEntry = () => {
    const montant = Number(form.montant);

    if (
      !form.dateEvenement ||
      !form.datePaiement ||
      !Number.isFinite(montant) ||
      montant <= 0 ||
      !form.numeroFacture.trim()
    ) {
      alert(
        "Merci de renseigner la date d’événement, la date de paiement, un montant valide et un numéro de facture."
      );
      return;
    }

    if (form.typeRecette === "séance gestalt" && !form.clientId) {
      alert("Merci de choisir un client pour une séance Gestalt.");
      return;
    }

    if (form.typeRecette !== "séance gestalt" && !form.libelleLibre.trim()) {
      alert("Merci de préciser le libellé de la prestation.");
      return;
    }

    const client = clients.find((c) => c.id === form.clientId);

    const clientLabel =
      form.typeRecette === "séance gestalt"
        ? client
          ? `${client.prenom} ${client.nom}`
          : "Client non renseigné"
        : form.libelleLibre.trim();

    const entry: ReceiptEntry = {
      id: uid(),
      typeRecette: form.typeRecette,
      clientId:
        form.typeRecette === "séance gestalt"
          ? form.clientId || undefined
          : undefined,
      clientLabel,
      libelleLibre:
        form.typeRecette === "séance gestalt"
          ? undefined
          : form.libelleLibre.trim(),
      dateEvenement: form.dateEvenement,
      datePaiement: form.datePaiement,
      montant,
      numeroFacture: form.numeroFacture.trim(),
      modePaiement: form.modePaiement,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSave({
      entries: [entry, ...entries],
    });

    resetForm();
  };

  const removeEntry = (id: string) => {
    onSave({
      entries: entries.filter((e) => e.id !== id),
    });
  };

  const startEdit = (entry: ReceiptEntry) => {
    setEditingId(entry.id);
    setEditForm({
      typeRecette: entry.typeRecette,
      clientId: entry.clientId || "",
      libelleLibre: entry.libelleLibre || "",
      dateEvenement: entry.dateEvenement,
      datePaiement: entry.datePaiement,
      montant: String(entry.montant || ""),
      numeroFacture: entry.numeroFacture || "",
      modePaiement: entry.modePaiement,
      notes: entry.notes || "",
    });
  };

  const saveEdit = (id: string) => {
    const montant = Number(editForm.montant);

    if (
      !editForm.dateEvenement ||
      !editForm.datePaiement ||
      !Number.isFinite(montant) ||
      montant <= 0 ||
      !editForm.numeroFacture.trim()
    ) {
      alert(
        "Merci de renseigner la date d’événement, la date de paiement, un montant valide et un numéro de facture."
      );
      return;
    }

    if (editForm.typeRecette === "séance gestalt" && !editForm.clientId) {
      alert("Merci de choisir un client pour une séance Gestalt.");
      return;
    }

    if (
      editForm.typeRecette !== "séance gestalt" &&
      !editForm.libelleLibre.trim()
    ) {
      alert("Merci de préciser le libellé de la prestation.");
      return;
    }

    const client = clients.find((c) => c.id === editForm.clientId);

    const clientLabel =
      editForm.typeRecette === "séance gestalt"
        ? client
          ? `${client.prenom} ${client.nom}`
          : "Client non renseigné"
        : editForm.libelleLibre.trim();

    onSave({
      entries: entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              typeRecette: editForm.typeRecette,
              clientId:
                editForm.typeRecette === "séance gestalt"
                  ? editForm.clientId || undefined
                  : undefined,
              clientLabel,
              libelleLibre:
                editForm.typeRecette === "séance gestalt"
                  ? undefined
                  : editForm.libelleLibre.trim(),
              dateEvenement: editForm.dateEvenement,
              datePaiement: editForm.datePaiement,
              montant,
              numeroFacture: editForm.numeroFacture.trim(),
              modePaiement: editForm.modePaiement,
              notes: editForm.notes.trim(),
            }
          : entry
      ),
    });

    setEditingId(null);
  };

  const availableYears = useMemo(() => {
    return [
      ...new Set(
        entries.map((e) => getYearFromDate(e.datePaiement)).filter(Boolean)
      ),
    ].sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      const yearOk =
        selectedYear === "all" ||
        getYearFromDate(entry.datePaiement) === selectedYear;

      const monthOk =
        selectedMonth === "all" ||
        getMonthFromDate(entry.datePaiement) === selectedMonth;

      const searchOk =
        !normalizedSearch ||
        getEntryMainLabel(entry).toLowerCase().includes(normalizedSearch) ||
        (entry.numeroFacture || "").toLowerCase().includes(normalizedSearch) ||
        (entry.notes || "").toLowerCase().includes(normalizedSearch) ||
        (entry.libelleLibre || "").toLowerCase().includes(normalizedSearch);

      return yearOk && monthOk && searchOk;
    });
  }, [entries, searchTerm, selectedYear, selectedMonth]);

  const total = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (e.montant || 0), 0);
  }, [filteredEntries]);

  const exportLabel = useMemo(() => {
    if (selectedYear === "all" && selectedMonth === "all") {
      return "Toutes les recettes";
    }

    if (selectedYear !== "all" && selectedMonth === "all") {
      return `Année ${selectedYear}`;
    }

    if (selectedYear !== "all" && selectedMonth !== "all") {
      return `${getMonthLabel(selectedMonth)} ${selectedYear}`;
    }

    return `Mois ${getMonthLabel(selectedMonth)}`;
  }, [selectedYear, selectedMonth]);

  const exportAsPrintableHtml = () => {
    if (filteredEntries.length === 0) {
      alert("Aucune entrée à exporter pour ce filtre.");
      return;
    }

    const rows = filteredEntries
      .slice()
      .sort((a, b) => {
        if (a.datePaiement !== b.datePaiement) {
          return a.datePaiement.localeCompare(b.datePaiement);
        }
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      })
      .map(
        (e) => `
          <tr>
            <td>${formatDateFR(e.datePaiement)}</td>
            <td>${formatDateFR(e.dateEvenement)}</td>
            <td>${getReceiptTypeLabel(e.typeRecette)}</td>
            <td>${getEntryMainLabel(e)}</td>
            <td>${e.numeroFacture || ""}</td>
            <td>${e.modePaiement || ""}</td>
            <td style="text-align:right;">${formatEuro(e.montant || 0)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Livre de recettes - ${exportLabel}</title>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }
            h1 {
              margin-bottom: 4px;
            }
            .meta {
              margin-bottom: 20px;
              color: #4b5563;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 10px;
              font-size: 14px;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
              text-align: left;
            }
            .total {
              margin-top: 18px;
              font-size: 16px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>📒 Livre de recettes</h1>
          <div class="meta">${exportLabel}</div>
          <table>
            <thead>
              <tr>
                <th>Date paiement</th>
                <th>Date événement</th>
                <th>Type</th>
                <th>Client / libellé</th>
                <th>Facture</th>
                <th>Règlement</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="total">Total : ${formatEuro(total)}</div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Impossible d’ouvrir la fenêtre d’export.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="text-2xl font-bold">📒 Livre de recettes</h2>
          <div className="text-sm text-gray-600 mt-1">
            Total encaissé : <strong>{formatEuro(total)}</strong>
          </div>
          <div className="text-sm text-gray-500 mt-1">{exportLabel}</div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Année</label>
            <select
              className="border p-2 rounded"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">Toutes</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Mois</label>
            <select
              className="border p-2 rounded"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">Tous</option>
              {[
                "01",
                "02",
                "03",
                "04",
                "05",
                "06",
                "07",
                "08",
                "09",
                "10",
                "11",
                "12",
              ].map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[240px] flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              Recherche
            </label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              placeholder="Client, facture, prestation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <button
              onClick={exportAsPrintableHtml}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-200 to-blue-200 shadow"
            >
              🖨️ Export mensuel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <h3 className="font-bold text-lg">➕ Nouvelle entrée</h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              className="border p-2 rounded w-full"
              value={form.typeRecette}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  typeRecette: e.target.value as ReceiptType,
                  clientId:
                    e.target.value === "séance gestalt" ? f.clientId : "",
                  libelleLibre:
                    e.target.value === "séance gestalt" ? "" : f.libelleLibre,
                }))
              }
            >
              {RECEIPT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getReceiptTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {form.typeRecette === "séance gestalt" ? (
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-600 mb-1">Client</label>
              <select
                className="border p-2 rounded w-full"
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value }))
                }
              >
                <option value="">-- Choisir un client --</option>
                {activeClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-600 mb-1">
                Libellé / précision
              </label>
              <input
                className="border p-2 rounded w-full"
                placeholder="Ex : Intervention entreprise / Atelier d’été..."
                value={form.libelleLibre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, libelleLibre: e.target.value }))
                }
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              Date événement
            </label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={form.dateEvenement}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateEvenement: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              Date paiement
            </label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={form.datePaiement}
              onChange={(e) =>
                setForm((f) => ({ ...f, datePaiement: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Montant</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              placeholder="Montant"
              value={form.montant}
              onChange={(e) =>
                setForm((f) => ({ ...f, montant: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">
              Numéro de facture
            </label>
            <input
              className="border p-2 rounded w-full"
              placeholder="Facture n°"
              value={form.numeroFacture}
              onChange={(e) =>
                setForm((f) => ({ ...f, numeroFacture: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">
              Mode de paiement
            </label>
            <select
              className="border p-2 rounded w-full"
              value={form.modePaiement}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  modePaiement: e.target.value as ReceiptPaymentMethod,
                }))
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <input
              className="border p-2 rounded w-full"
              placeholder="Note optionnelle"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              onClick={addEntry}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-200 to-blue-200"
            >
              💾 Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-lg">📋 Entrées</h3>
          <div className="text-sm text-gray-500">
            {filteredEntries.length} entrée
            {filteredEntries.length > 1 ? "s" : ""}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-gray-500 text-sm">
            Aucune entrée pour ce filtre.
          </div>
        ) : (
          filteredEntries
            .slice()
            .sort((a, b) => {
              if (a.datePaiement !== b.datePaiement) {
                return b.datePaiement.localeCompare(a.datePaiement);
              }
              return (b.createdAt || "").localeCompare(a.createdAt || "");
            })
            .map((e) => {
              const isEditing = editingId === e.id;

              if (isEditing) {
                return (
                  <div
                    key={e.id}
                    className="border rounded-xl p-4 space-y-4 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-sm text-gray-600 mb-1">
                          Type
                        </label>
                        <select
                          className="border p-2 rounded w-full"
                          value={editForm.typeRecette}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              typeRecette: evt.target.value as ReceiptType,
                              clientId:
                                evt.target.value === "séance gestalt"
                                  ? f.clientId
                                  : "",
                              libelleLibre:
                                evt.target.value === "séance gestalt"
                                  ? ""
                                  : f.libelleLibre,
                            }))
                          }
                        >
                          {RECEIPT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {getReceiptTypeLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {editForm.typeRecette === "séance gestalt" ? (
                        <div className="md:col-span-3">
                          <label className="block text-sm text-gray-600 mb-1">
                            Client
                          </label>
                          <select
                            className="border p-2 rounded w-full"
                            value={editForm.clientId}
                            onChange={(evt) =>
                              setEditForm((f) => ({
                                ...f,
                                clientId: evt.target.value,
                              }))
                            }
                          >
                            <option value="">-- Choisir un client --</option>
                            {activeClients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.prenom} {c.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="md:col-span-3">
                          <label className="block text-sm text-gray-600 mb-1">
                            Libellé / précision
                          </label>
                          <input
                            className="border p-2 rounded w-full"
                            value={editForm.libelleLibre}
                            onChange={(evt) =>
                              setEditForm((f) => ({
                                ...f,
                                libelleLibre: evt.target.value,
                              }))
                            }
                          />
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Date événement
                        </label>
                        <input
                          type="date"
                          className="border p-2 rounded w-full"
                          value={editForm.dateEvenement}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              dateEvenement: evt.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Date paiement
                        </label>
                        <input
                          type="date"
                          className="border p-2 rounded w-full"
                          value={editForm.datePaiement}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              datePaiement: evt.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Montant
                        </label>
                        <input
                          type="number"
                          className="border p-2 rounded w-full"
                          value={editForm.montant}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              montant: evt.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm text-gray-600 mb-1">
                          Numéro de facture
                        </label>
                        <input
                          className="border p-2 rounded w-full"
                          value={editForm.numeroFacture}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              numeroFacture: evt.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm text-gray-600 mb-1">
                          Mode de paiement
                        </label>
                        <select
                          className="border p-2 rounded w-full"
                          value={editForm.modePaiement}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              modePaiement: evt.target
                                .value as ReceiptPaymentMethod,
                            }))
                          }
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-sm text-gray-600 mb-1">
                          Notes
                        </label>
                        <input
                          className="border p-2 rounded w-full"
                          value={editForm.notes}
                          onChange={(evt) =>
                            setEditForm((f) => ({
                              ...f,
                              notes: evt.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg bg-white border"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveEdit(e.id)}
                        className="px-3 py-1 rounded-lg bg-blue-100 border border-blue-200"
                      >
                        💾 Enregistrer
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={e.id}
                  className="border rounded-xl p-3 flex justify-between items-center gap-3 flex-wrap"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {getEntryMainLabel(e)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${typeBadge(
                          e.typeRecette
                        )}`}
                      >
                        {getReceiptTypeLabel(e.typeRecette)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                      <span>
                        📅 Événement : {formatDateFR(e.dateEvenement)}
                      </span>
                      <span>💸 Paiement : {formatDateFR(e.datePaiement)}</span>
                    </div>

                    <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                      <span>🧾 {e.numeroFacture}</span>
                      <span>💳 {e.modePaiement}</span>
                    </div>

                    {e.notes && (
                      <div className="text-sm text-gray-500">{e.notes}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-bold">{formatEuro(e.montant)}</div>
                    <button
                      onClick={() => startEdit(e)}
                      className="text-sm px-2 py-1 border rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeEntry(e.id)}
                      className="text-sm px-2 py-1 border rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
