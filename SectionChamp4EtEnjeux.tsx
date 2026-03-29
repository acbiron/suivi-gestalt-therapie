// src/components/ClientPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import { db } from "../firebase";
import { Client, ResourceItem } from "../types";

import { exportClientPdf } from "../utils/exportClientPdf";
import { exportBackup } from "../utils/exportBackup";

import SectionSeances from "./SectionSeances";
import SectionContact from "./SectionContact";
import SectionChamp3 from "./SectionChamp3";
import SectionChamp4EtEnjeux from "./SectionChamp4EtEnjeux";
import SectionSelf from "./SectionSelf";
import SectionCadre from "./SectionCadre";
import SectionSupervision from "./SectionSupervision";
import SectionDivers from "./SectionDivers";
import SectionInfos from "./SectionInfos";
import SectionRelations from "./SectionRelations";
import SectionClientResources from "./SectionClientResources";
import SectionTimeline from "./SectionTimeline";

import SectionAttachementGrid from "./SectionAttachementGrid";
import SectionEstimeGrid from "./SectionEstimeGrid";

import hommeImg from "../assets/illustrations/Homme.jpg";
import femmeImg from "../assets/illustrations/Femme.jpg";
import nonGenreImg from "../assets/illustrations/Non-genré.jpg";

const illustrations: Record<Client["genre"], string> = {
  Homme: hommeImg,
  Femme: femmeImg,
  "Non genré": nonGenreImg,
};

const formatDateFR = (iso?: string) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

type SectionKey =
  | "seances"
  | "infos"
  | "ressources"
  | "contact"
  | "champ3"
  | "relations"
  | "champ4"
  | "enjeux"
  | "attachementGrid"
  | "estimeGrid"
  | "timeline"
  | "communication"
  | "strategie"
  | "self"
  | "cadre"
  | "supervision"
  | "divers";

type Props = {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  resources: ResourceItem[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function parseISODate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getTherapyDuration(fromISO?: string): string {
  const start = parseISODate(fromISO);
  if (!start) return "-";

  const now = new Date();
  const ms = now.getTime() - start.getTime();
  if (ms < 0) return "0 jour";

  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  if (months <= 0) return `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
  if (days === 0) return `${months} mois`;
  return `${months} mois ${days} j`;
}

function asString(v: any, fallback = "—") {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return fallback;
}

function formatList(v: any): string {
  if (!v) return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "string") return v.trim() ? v : "—";
  return "—";
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined && item !== null)
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => {
        if (item === undefined || item === null) return false;
        if (typeof item === "object" && !Array.isArray(item)) {
          return Object.keys(item as Record<string, any>).length > 0;
        }
        return true;
      }) as T;
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {};

    Object.entries(value as Record<string, any>).forEach(([key, val]) => {
      if (val === undefined || val === null) return;

      const cleaned = stripUndefinedDeep(val);

      if (cleaned === undefined || cleaned === null) return;

      if (
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned as Record<string, any>).length === 0
      ) {
        return;
      }

      result[key] = cleaned;
    });

    return result as T;
  }

  return value;
}

export default function ClientPage({ clients, setClients, resources }: Props) {
  const { id } = useParams<{ id: string }>();

  const clientIndex = useMemo(() => {
    if (!id || !clients || clients.length === 0) return -1;
    return clients.findIndex((c) => c.id === id);
  }, [clients, id]);

  const client = clientIndex >= 0 ? clients[clientIndex] : null;

  const menuItems = useMemo(
    () =>
      [
        ["seances", "🫴🏻 Séances"],
        ["infos", "📄 Informations"],
        ["contact", "📞 Contact"],
        ["champ3", "📚 Champ 3"],
        ["relations", "👥 Relations"],
        ["champ4", "📜 Champ 4"],
        ["enjeux", "🗝️ Enjeux"],
        ["attachementGrid", "🫶 Attachement"],
        ["estimeGrid", "🌱 Estime de soi"],
        ["timeline", "🕰️ Timeline"],
        ["communication", "🎙️ Communication"],
        ["strategie", "⛯ Stratégie"],
        ["self", "🪞 SELF"],
        ["cadre", "🖼️ Cadre"],
        ["supervision", "🧑‍🏫 Supervision"],
        ["ressources", "🧰 Outils"],
        ["divers", "📝 Divers"],
      ] as const,
    []
  );

  const [activeSection, setActiveSection] = useState<SectionKey>("seances");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showHeaderDetails, setShowHeaderDetails] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const saveStatusTimer = useRef<number | null>(null);
  const saveRequestId = useRef(0);

  useEffect(() => {
    setActiveSection("seances");
    setShowHeaderDetails(true);
    setSaveStatus("idle");
  }, [id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setShowScrollTop(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll);
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const clearSaveStatusTimer = () => {
    if (saveStatusTimer.current) {
      window.clearTimeout(saveStatusTimer.current);
      saveStatusTimer.current = null;
    }
  };

  const saveClient = (
    updatedClient: Client,
    _opts?: { immediate?: boolean }
  ) => {
    if (clientIndex < 0) return;

    setClients((prev) => {
      const updated = [...prev];
      updated[clientIndex] = updatedClient;
      return updated;
    });

    if (!updatedClient.id) return;

    clearSaveStatusTimer();
    setSaveStatus("saving");

    const currentRequestId = ++saveRequestId.current;

    void (async () => {
      try {
        const cleanedClient = stripUndefinedDeep(updatedClient);
        await updateDoc(doc(db, "clients", updatedClient.id!), cleanedClient);

        if (currentRequestId !== saveRequestId.current) return;

        setSaveStatus("saved");
        saveStatusTimer.current = window.setTimeout(() => {
          setSaveStatus("idle");
        }, 1500);
      } catch (error) {
        console.error("Erreur sauvegarde client :", error);
        alert(
          "Erreur sauvegarde : " +
            ((error as any)?.message ?? "erreur inconnue")
        );
        setSaveStatus("error");
      }
    })();
  };

  const updateClient = (field: keyof Client, value: any) => {
    if (!client) return;
    const updatedClient = { ...client, [field]: value };
    saveClient(updatedClient);
  };

  const toggleArchiveClient = () => {
    if (!client) return;

    const updatedClient = {
      ...client,
      archived: !client.archived,
      archivedAt: !client.archived ? new Date().toISOString() : "",
    };

    saveClient(updatedClient, { immediate: true });
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!id) return <div className="p-6">Chargement...</div>;
  if (!clients || clients.length === 0) {
    return <div className="p-6">Chargement des clients...</div>;
  }
  if (!client) {
    return <div className="p-6">Client introuvable</div>;
  }

  const seances = Array.isArray((client as any).seances)
    ? (client as any).seances
    : [];

  const firstSeanceISO =
    seances.length > 0
      ? seances
          .map((s: any) => s?.date)
          .filter(Boolean)
          .sort()[0]
      : client.date;

  const lastSeanceISO =
    seances.length > 0 ? seances[seances.length - 1]?.date : undefined;

  const motif =
    (client as any).motifConsultation ?? (client as any).motif ?? "";

  const saveStatusUi =
    saveStatus === "saving"
      ? {
          text: "💾 Enregistrement...",
          className: "bg-amber-100 text-amber-800",
        }
      : saveStatus === "saved"
      ? {
          text: "✅ Enregistré",
          className: "bg-green-100 text-green-800",
        }
      : saveStatus === "error"
      ? {
          text: "⚠️ Erreur sauvegarde",
          className: "bg-red-100 text-red-800",
        }
      : {
          text: "",
          className: "",
        };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-blue-50 to-green-50">
      <div className="h-full flex flex-col lg:flex-row">
        {/* COLONNE / PANNEAU GAUCHE */}
        <aside className="w-full lg:w-[330px] xl:w-[360px] lg:h-full lg:border-r border-white/50 bg-white/80 backdrop-blur-md shadow-lg flex flex-col">
          <div className="lg:sticky lg:top-0 z-30 p-4 md:p-5 border-b border-gray-200 bg-white/90 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <img
                src={illustrations[client.genre] ?? hommeImg}
                alt={client.genre}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold leading-tight">
                    {client.prenom} {client.nom}
                  </h1>

                  {client.archived && (
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 whitespace-nowrap">
                      📦 Archivé
                    </div>
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div>🪑/💻 {client.cadre ?? "Présentiel"}</div>
                  <div>📅 Première : {formatDateFR(firstSeanceISO)}</div>
                  <div>🧾 {seances.length} séances</div>
                  {lastSeanceISO && (
                    <div>📍 Dernière : {formatDateFR(lastSeanceISO)}</div>
                  )}
                </div>
              </div>
            </div>

            {saveStatus !== "idle" && (
              <div
                className={`mt-4 px-3 py-2 rounded-xl text-sm font-medium ${saveStatusUi.className}`}
              >
                {saveStatusUi.text}
              </div>
            )}

            {/* BOUTONS EN 2 COLONNES */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={toggleArchiveClient}
                className={`px-3 py-3 rounded-2xl inline-flex items-center justify-center gap-2 shadow-sm font-medium text-sm ${
                  client.archived ? "bg-green-200" : "bg-amber-200"
                }`}
              >
                {client.archived ? "♻️ Restaurer" : "📦 Archiver"}
              </button>

              <button
                onClick={() => exportClientPdf(client)}
                className="px-3 py-3 bg-blue-200 rounded-2xl inline-flex items-center justify-center gap-2 shadow-sm font-medium text-sm"
              >
                📄 Export
              </button>

              <button
                onClick={() => exportBackup(clients)}
                className="px-3 py-3 bg-green-200 rounded-2xl inline-flex items-center justify-center gap-2 shadow-sm font-medium text-sm"
              >
                💾 Backup
              </button>

              <Link
                to="/"
                className="px-3 py-3 bg-pink-200 rounded-2xl inline-flex items-center justify-center gap-2 shadow-sm font-medium text-sm"
              >
                🏠 Accueil
              </Link>

              <button
                onClick={() => setShowHeaderDetails((v) => !v)}
                className="col-span-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-sm shadow-sm font-medium"
              >
                {showHeaderDetails
                  ? "▲ Masquer les détails"
                  : "▼ Afficher les détails"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
            <div className="rounded-2xl bg-white/90 shadow p-4 border border-gray-100">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Vue rapide
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <span className="font-medium">⏳ Durée :</span>{" "}
                  {getTherapyDuration(firstSeanceISO)}
                </div>
                <div>
                  <span className="font-medium">🧩 Attachement :</span>{" "}
                  {formatList((client as any).attachement)}
                </div>
                <div>
                  <span className="font-medium">💪 Estime :</span>{" "}
                  {formatList((client as any).estime)}
                </div>
                <div>
                  <span className="font-medium">📝 Motif :</span>{" "}
                  {asString(motif)}
                </div>
              </div>
            </div>

            {showHeaderDetails && (
              <>
                <div className="rounded-2xl border bg-white/90 p-4 shadow">
                  <div className="font-semibold mb-3">📌 Séances</div>
                  <div className="text-sm text-gray-800 space-y-2">
                    <div>
                      <span className="font-semibold">🪑/💻 Format :</span>{" "}
                      {client.cadre ?? "Présentiel"}
                    </div>
                    <div>
                      <span className="font-semibold">
                        📅 Première séance :
                      </span>{" "}
                      {formatDateFR(firstSeanceISO)}
                    </div>
                    <div>
                      <span className="font-semibold">⏳ Durée :</span>{" "}
                      {getTherapyDuration(firstSeanceISO)}
                    </div>
                    <div>
                      <span className="font-semibold">🧾 Nombre :</span>{" "}
                      {seances.length}
                    </div>
                    <div>
                      <span className="font-semibold">📍 Dernière :</span>{" "}
                      {formatDateFR(lastSeanceISO)}
                    </div>
                    <div>
                      <span className="font-semibold">📦 Statut :</span>{" "}
                      {client.archived ? "Archivé" : "Actif"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white/90 p-4 shadow">
                  <div className="font-semibold mb-3">🎯 Enjeux & Motif</div>
                  <div className="text-sm text-gray-800 space-y-2">
                    <div>
                      <span className="font-semibold">🧩 Attachement :</span>{" "}
                      {formatList((client as any).attachement)}
                    </div>
                    <div>
                      <span className="font-semibold">💪 Estime :</span>{" "}
                      {formatList((client as any).estime)}
                    </div>
                    <div>
                      <span className="font-semibold">❤️ Ethos/Eros :</span>{" "}
                      {formatList((client as any).ethosEros)}
                    </div>
                    <div>
                      <span className="font-semibold">📝 Motif :</span>{" "}
                      {asString(motif)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ZONE PRINCIPALE */}
        <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          {/* MENU MULTI-LIGNES */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-pink-200 via-blue-200 to-green-200 shadow border-b border-white/40">
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2 justify-start">
                {menuItems.map(([key, label]) => {
                  const active = activeSection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key as SectionKey)}
                      className={`px-4 py-2 rounded-full text-sm transition shadow-sm flex items-center gap-2 ${
                        active
                          ? "bg-white font-semibold"
                          : "bg-white/40 hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          active ? "bg-blue-600" : "bg-transparent"
                        }`}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CONTENU */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 pb-32"
          >
            <div className="max-w-5xl mx-auto">
              {activeSection === "seances" && (
                <SectionSeances client={client} onSave={saveClient} />
              )}

              {activeSection === "infos" && (
                <SectionInfos client={client} onSave={saveClient} />
              )}

              {activeSection === "contact" && (
                <SectionContact client={client} onSave={saveClient} />
              )}

              {activeSection === "champ3" && (
                <SectionChamp3 client={client} onSave={saveClient} />
              )}

              {activeSection === "relations" && (
                <SectionRelations client={client} onSave={saveClient} />
              )}

              {activeSection === "champ4" && (
                <SectionChamp4EtEnjeux
                  client={client}
                  onSave={saveClient}
                  tab="champ4"
                />
              )}

              {activeSection === "enjeux" && (
                <SectionChamp4EtEnjeux
                  client={client}
                  onSave={saveClient}
                  tab="enjeux"
                />
              )}

              {activeSection === "attachementGrid" && (
                <SectionAttachementGrid client={client} onSave={saveClient} />
              )}

              {activeSection === "estimeGrid" && (
                <SectionEstimeGrid client={client} onSave={saveClient} />
              )}

              {activeSection === "timeline" && (
                <SectionTimeline client={client} onSave={saveClient} />
              )}

              {activeSection === "communication" && (
                <SectionChamp4EtEnjeux
                  client={client}
                  onSave={saveClient}
                  tab="communication"
                />
              )}

              {activeSection === "strategie" && (
                <SectionChamp4EtEnjeux
                  client={client}
                  onSave={saveClient}
                  tab="strategie"
                />
              )}

              {activeSection === "self" && (
                <SectionSelf client={client} onSave={saveClient} />
              )}

              {activeSection === "cadre" && (
                <SectionCadre client={client} onSave={saveClient} />
              )}

              {activeSection === "supervision" && (
                <SectionSupervision client={client} onSave={saveClient} />
              )}

              {activeSection === "ressources" && (
                <SectionClientResources
                  client={client}
                  resources={resources}
                  onSave={saveClient}
                />
              )}

              {activeSection === "divers" && (
                <div className="space-y-3">
                  <SectionDivers client={client} onSave={saveClient} />

                  <div className="bg-white p-4 rounded-2xl shadow space-y-2">
                    <h3 className="font-semibold mb-2">⚡ Stresseurs</h3>
                    <textarea
                      placeholder="Stresseurs"
                      value={client.stresseurs ?? ""}
                      onChange={(e) =>
                        updateClient("stresseurs", e.target.value)
                      }
                      className="w-full border rounded p-2 h-28 resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="h-24" />
            </div>
          </div>
        </main>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-white shadow-lg border hover:shadow-xl transition"
          aria-label="Remonter en haut"
        >
          ↑ Haut
        </button>
      )}
    </div>
  );
}
