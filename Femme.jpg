// src/App.tsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import {
  AccountingData,
  Client,
  PlanningData,
  ReceiptBookData,
  ResourceItem,
} from "./types";

import ClientPage from "./components/ClientPage";
import SectionResources from "./components/SectionResources";
import SectionComptabilite from "./components/SectionComptabilite";
import SectionPlanification from "./components/SectionPlanification";
import SectionLivreRecettes from "./components/SectionLivreRecettes";
import Dashboard from "./components/Dashboard";

import hommeImg from "./assets/illustrations/Homme.jpg";
import femmeImg from "./assets/illustrations/Femme.jpg";
import nonGenreImg from "./assets/illustrations/Non-genré.jpg";

/* ===================== ILLUSTRATIONS ===================== */
const illustrations: Record<Client["genre"], string> = {
  Homme: hommeImg,
  Femme: femmeImg,
  "Non genré": nonGenreImg,
};

const formatDateFR = (iso?: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

/* ===================== HELPERS ===================== */
const initializeClient = (c: Client): Client => ({
  travail: { type: [], profession: "", vecu: "" },
  couple: { statut: [], precisions: "", vecu: "" },
  parents: {
    pere: { decede: false, vecu: "" },
    mere: { decede: false, vecu: "" },
  },
  enfants: { nombre: 0, data: [] },
  fratrie: { nombre: 0, data: [] },
  relations: [],
  resourceIds: [],
  supervision: [],
  divers: "",
  stresseurs: "",
  archived: false,
  archivedAt: "",
  ...c,
});

const normalizeAccounting = (raw: any): AccountingData => ({
  entries: Array.isArray(raw?.entries) ? raw.entries : [],
  recurringCharges: Array.isArray(raw?.recurringCharges)
    ? raw.recurringCharges
    : [],
});
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

/* ===================== HOME ===================== */
function ClientsPage({ clients, user }: { clients: Client[]; user: User }) {
  const [showForm, setShowForm] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<Client>({
    nom: "",
    prenom: "",
    date: "",
    cadre: "Présentiel",
    genre: "Homme",
    seances: [],
    archived: false,
    archivedAt: "",
  });

  const addClient = async () => {
    if (!form.nom || !form.prenom) return;

    await addDoc(collection(db, "clients"), {
      ...form,
      seances: [],
      ownerId: user.uid,
      archived: false,
      archivedAt: "",
      createdAt: new Date(),
    });

    setShowForm(false);
    setForm({
      nom: "",
      prenom: "",
      date: "",
      cadre: "Présentiel",
      genre: "Homme",
      seances: [],
      archived: false,
      archivedAt: "",
    });
  };

  const toggleArchiveClient = async (
    e: React.MouseEvent,
    clientId: string,
    archived: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    await updateDoc(doc(db, "clients", clientId), {
      archived: !archived,
      archivedAt: !archived ? new Date().toISOString() : "",
    });
  };

  const searchedClients = clients.filter((c) =>
    `${c.nom} ${c.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeClients = searchedClients
    .filter((c) => !c.archived)
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const archivedClients = searchedClients
    .filter((c) => c.archived)
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const ClientCard = ({
    c,
    archived = false,
  }: {
    c: Client;
    archived?: boolean;
  }) => (
    <Link
      key={c.id}
      to={`/client/${c.id}`}
      className={`rounded-2xl shadow p-4 flex justify-between items-center hover:scale-[1.02] transition cursor-pointer border ${
        archived
          ? "bg-gray-50 border-gray-200 opacity-90"
          : "bg-white border-white"
      }`}
    >
      <div className="min-w-0 pr-3">
        <div className="font-semibold text-lg">
          {c.prenom} {c.nom}
        </div>
        <div className="text-sm">📅 {formatDateFR(c.date)}</div>
        <div className="text-sm">🪑 {c.cadre || "Présentiel"}</div>

        {archived && (
          <div className="text-xs text-gray-500 mt-1">
            📦 Archivé
            {c.archivedAt
              ? ` le ${formatDateFR(c.archivedAt.slice(0, 10))}`
              : ""}
          </div>
        )}

        <div className="mt-3">
          <button
            onClick={(e) => toggleArchiveClient(e, c.id!, Boolean(c.archived))}
            className={`px-3 py-1.5 rounded-full text-sm shadow-sm border ${
              archived
                ? "bg-green-100 border-green-200"
                : "bg-amber-100 border-amber-200"
            }`}
          >
            {archived ? "♻️ Restaurer" : "📦 Archiver"}
          </button>
        </div>
      </div>

      <img
        src={illustrations[c.genre]}
        alt={c.genre}
        className="w-20 h-20 object-contain flex-shrink-0"
      />
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        🌿 Suivi thérapeutique Gestalt
      </h1>

      <div className="mb-6 flex justify-between items-center gap-3 flex-wrap">
        <Link
          to="/"
          className="px-4 py-2 rounded-full bg-pink-200 shadow-md inline-flex items-center gap-2"
        >
          🏠 Tableau de bord
        </Link>

        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 rounded-full bg-white shadow-md"
          >
            ➕ Nouveau client
          </button>

          <Link
            to="/resources"
            className="px-6 py-2 rounded-full bg-white shadow-md inline-block"
          >
            📚 Ressources
          </Link>

          <button
            onClick={() => setShowArchives((v) => !v)}
            className="px-6 py-2 rounded-full bg-white shadow-md"
          >
            {showArchives ? "🙈 Masquer archives" : "📦 Voir archives"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-4 mb-6 space-y-3">
          <input
            placeholder="Prénom"
            className="w-full p-2 border rounded"
            value={form.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
          />
          <input
            placeholder="Nom"
            className="w-full p-2 border rounded"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <select
            value={form.cadre}
            onChange={(e) =>
              setForm({ ...form, cadre: e.target.value as Client["cadre"] })
            }
            className="w-full p-2 border rounded"
          >
            <option value="Présentiel">Présentiel</option>
            <option value="Visio">Visio</option>
            <option value="Mixte">Mixte</option>
          </select>
          <select
            value={form.genre}
            onChange={(e) =>
              setForm({ ...form, genre: e.target.value as Client["genre"] })
            }
            className="w-full p-2 border rounded"
          >
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
            <option value="Non genré">Non genré</option>
          </select>

          <button
            onClick={addClient}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-200 to-blue-200"
          >
            💾 Enregistrer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-sm text-gray-500">Clients actifs</div>
          <div className="text-2xl font-bold mt-1">
            {clients.filter((c) => !c.archived).length}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-sm text-gray-500">Archives</div>
          <div className="text-2xl font-bold mt-1">
            {clients.filter((c) => c.archived).length}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-sm text-gray-500">Suivi</div>
          <div className="text-sm mt-1 text-gray-700">
            Gère tes clients et leurs séances en un seul endroit.
          </div>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Rechercher un client..."
        className="w-full p-2 mb-6 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold">🟢 Clients actifs</h2>
            <div className="text-sm text-gray-600">
              {activeClients.length} client
              {activeClients.length > 1 ? "s" : ""}
            </div>
          </div>

          {activeClients.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
              Aucun client actif.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeClients.map((c) => (
                <ClientCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>

        {showArchives && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold">📦 Archives</h2>
              <div className="text-sm text-gray-600">
                {archivedClients.length} client
                {archivedClients.length > 1 ? "s" : ""}
              </div>
            </div>

            {archivedClients.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
                Aucune archive pour l’instant.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedClients.map((c) => (
                  <ClientCard key={c.id} c={c} archived />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== APP ===================== */
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [accounting, setAccounting] = useState<AccountingData>({
    entries: [],
    recurringCharges: [],
  });
  const [accountingDocId, setAccountingDocId] = useState<string | null>(null);

  const [planning, setPlanning] = useState<PlanningData>({
    appointments: [],
  });
  const [planningDocId, setPlanningDocId] = useState<string | null>(null);

  const [receiptBook, setReceiptBook] = useState<ReceiptBookData>({
    entries: [],
  });
  const [receiptBookDocId, setReceiptBookDocId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "clients"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(
        snapshot.docs.map((d) =>
          initializeClient({ id: d.id, ...(d.data() as any) } as Client)
        )
      );
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "resources"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResources(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as ResourceItem[]
      );
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "accounting"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        const created = await addDoc(collection(db, "accounting"), {
          ownerId: user.uid,
          entries: [],
          recurringCharges: [],
          createdAt: new Date(),
        });

        setAccountingDocId(created.id);
        setAccounting({
          entries: [],
          recurringCharges: [],
        });
        return;
      }

      const docSnap = snapshot.docs[0];
      setAccountingDocId(docSnap.id);
      setAccounting(normalizeAccounting(docSnap.data()));
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "planning"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        const created = await addDoc(collection(db, "planning"), {
          ownerId: user.uid,
          appointments: [],
          createdAt: new Date(),
        });

        setPlanningDocId(created.id);
        setPlanning({
          appointments: [],
        });
        return;
      }

      const docSnap = snapshot.docs[0];
      setPlanningDocId(docSnap.id);

      const raw = docSnap.data() as any;
      setPlanning({
        appointments: Array.isArray(raw?.appointments) ? raw.appointments : [],
      });
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "receiptBook"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        const created = await addDoc(collection(db, "receiptBook"), {
          ownerId: user.uid,
          entries: [],
          createdAt: new Date(),
        });

        setReceiptBookDocId(created.id);
        setReceiptBook({
          entries: [],
        });
        return;
      }

      const docSnap = snapshot.docs[0];
      setReceiptBookDocId(docSnap.id);

      const raw = docSnap.data() as any;
      setReceiptBook({
        entries: Array.isArray(raw?.entries) ? raw.entries : [],
      });
    });

    return unsubscribe;
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const saveAccounting = async (next: AccountingData) => {
    if (!user) return;

    setAccounting(next);

    try {
      const cleaned = stripUndefinedDeep(next);

      if (accountingDocId) {
        await updateDoc(doc(db, "accounting", accountingDocId), cleaned as any);
        return;
      }

      const created = await addDoc(collection(db, "accounting"), {
        ownerId: user.uid,
        ...cleaned,
        createdAt: new Date(),
      });

      setAccountingDocId(created.id);
    } catch (error) {
      console.error("Erreur sauvegarde comptabilité :", error);
      alert(
        "Erreur sauvegarde comptabilité : " +
          ((error as any)?.message ?? "erreur inconnue")
      );
    }
  };

  const savePlanning = async (next: PlanningData) => {
    if (!user) return;

    setPlanning(next);

    try {
      const cleaned = stripUndefinedDeep(next);

      if (planningDocId) {
        await updateDoc(doc(db, "planning", planningDocId), cleaned as any);
        return;
      }

      const created = await addDoc(collection(db, "planning"), {
        ownerId: user.uid,
        ...cleaned,
        createdAt: new Date(),
      });

      setPlanningDocId(created.id);
    } catch (error) {
      console.error("Erreur sauvegarde planning :", error);
      alert(
        "Erreur sauvegarde planning : " +
          ((error as any)?.message ?? "erreur inconnue")
      );
    }
  };

  const saveReceiptBook = async (next: ReceiptBookData) => {
    if (!user) return;

    setReceiptBook(next);

    try {
      const cleaned = stripUndefinedDeep(next);

      if (receiptBookDocId) {
        await updateDoc(
          doc(db, "receiptBook", receiptBookDocId),
          cleaned as any
        );
        return;
      }

      const created = await addDoc(collection(db, "receiptBook"), {
        ownerId: user.uid,
        ...cleaned,
        createdAt: new Date(),
      });

      setReceiptBookDocId(created.id);
    } catch (error) {
      console.error("Erreur sauvegarde livre de recettes :", error);
      alert(
        "Erreur sauvegarde livre de recettes : " +
          ((error as any)?.message ?? "erreur inconnue")
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 rounded bg-blue-300 font-semibold"
        >
          🔑 Se connecter avec Google
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/clients"
          element={<ClientsPage clients={clients} user={user} />}
        />

        <Route
          path="/client/:id"
          element={
            <ClientPage
              clients={clients}
              setClients={setClients}
              resources={resources}
            />
          }
        />

        <Route
          path="/resources"
          element={<SectionResources resources={resources} />}
        />

        <Route
          path="/comptabilite"
          element={
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 p-6">
              <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <h1 className="text-3xl font-bold">💰 Comptabilité</h1>

                  <Link
                    to="/"
                    className="px-4 py-2 bg-pink-200 rounded-full inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    🏠 Accueil
                  </Link>
                </div>

                <SectionComptabilite
                  data={accounting}
                  clients={clients}
                  onSave={saveAccounting}
                />
              </div>
            </div>
          }
        />

        <Route
          path="/planification"
          element={
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 p-6">
              <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <h1 className="text-3xl font-bold">🗓️ Planification</h1>

                  <Link
                    to="/"
                    className="px-4 py-2 bg-pink-200 rounded-full inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    🏠 Accueil
                  </Link>
                </div>

                <SectionPlanification
                  data={planning}
                  clients={clients}
                  onSave={savePlanning}
                />
              </div>
            </div>
          }
        />

        <Route
          path="/livre-recettes"
          element={
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 p-6">
              <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <h1 className="text-3xl font-bold">📒 Livre de recettes</h1>

                  <Link
                    to="/"
                    className="px-4 py-2 bg-pink-200 rounded-full inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    🏠 Accueil
                  </Link>
                </div>

                <SectionLivreRecettes
                  data={receiptBook}
                  clients={clients}
                  onSave={saveReceiptBook}
                />
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
