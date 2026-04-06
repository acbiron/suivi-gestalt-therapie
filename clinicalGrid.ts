// src/components/SectionResources.tsx
import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { ResourceCategory, ResourceItem } from "../types";

type Props = {
  resources: ResourceItem[];
};

const CATEGORIES: ResourceCategory[] = [
  "Attachement",
  "Émotions",
  "Estime de soi",
  "Stress",
  "Outils",
  "SELF",
  "Abondance",
  "Exercices",
  "Concepts",
  "Autre",
];

function normalizeTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function SectionResources({ resources }: Props) {
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState<ResourceCategory>("Autre");
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    ResourceCategory | "Toutes"
  >("Toutes");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filteredResources = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...resources]
      .filter((r) => {
        if (categoryFilter !== "Toutes" && r.categorie !== categoryFilter) {
          return false;
        }

        if (onlyFavorites && !r.favori) {
          return false;
        }

        if (!term) return true;

        const haystack = [
          r.titre,
          r.categorie,
          r.description ?? "",
          ...(r.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(term);
      })
      .sort((a, b) => {
        const af = a.favori ? 1 : 0;
        const bf = b.favori ? 1 : 0;
        if (bf !== af) return bf - af;
        return a.titre.localeCompare(b.titre);
      });
  }, [resources, search, categoryFilter, onlyFavorites]);

  const resetForm = () => {
    setTitre("");
    setCategorie("Autre");
    setTagsInput("");
    setDescription("");
    setFile(null);
  };

  const handleUpload = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Utilisateur non connecté.");
      return;
    }

    if (!titre.trim()) {
      alert("Ajoute un titre.");
      return;
    }

    if (!file) {
      alert("Ajoute un fichier PDF.");
      return;
    }

    try {
      setUploading(true);
      console.log("Début upload");
      console.log("Utilisateur :", user.uid);
      console.log("Nom fichier :", file.name);
      console.log("Type fichier :", file.type);
      console.log("Taille fichier :", file.size);

      const safeFileName = file.name.replace(/\s+/g, "-");
      const storagePath = `resources/${user.uid}/${Date.now()}-${safeFileName}`;
      console.log("Storage path :", storagePath);

      const storageRef = ref(storage, storagePath);
      console.log("Storage ref créé");

      const uploadResult = await uploadBytes(storageRef, file);
      console.log("Upload OK :", uploadResult);

      const pdfUrl = await getDownloadURL(storageRef);
      console.log("Download URL OK :", pdfUrl);

      await addDoc(collection(db, "resources"), {
        titre: titre.trim(),
        categorie,
        tags: normalizeTags(tagsInput),
        description: description.trim(),
        favori: false,
        pdfUrl,
        fileName: file.name,
        storagePath,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log("Firestore OK");
      resetForm();
      alert("Ressource ajoutée avec succès.");
    } catch (error: any) {
      console.error("Erreur upload ressource :", error);
      alert(
        "Impossible d'ajouter la ressource : " +
          (error?.code ?? "") +
          " " +
          (error?.message ?? "erreur inconnue")
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleFavorite = async (resource: ResourceItem) => {
    if (!resource.id) return;

    try {
      await updateDoc(doc(db, "resources", resource.id), {
        favori: !resource.favori,
      });
    } catch (error) {
      console.error("Erreur favori :", error);
    }
  };

  const removeResource = async (
    resource: ResourceItem & { storagePath?: string }
  ) => {
    if (!resource.id) return;

    const confirmed = window.confirm(
      `Supprimer la ressource "${resource.titre}" ?`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "resources", resource.id));

      if (resource.storagePath) {
        const fileRef = ref(storage, resource.storagePath);
        await deleteObject(fileRef);
      }
    } catch (error) {
      console.error("Erreur suppression ressource :", error);
      alert("Impossible de supprimer cette ressource.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Ajout */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="font-bold text-lg">📚 Ressources PDF</h2>
          <a
            href="/"
            className="inline-block mt-2 text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            ← Retour à l'accueil
          </a>

          <p className="text-sm text-gray-600">
            Ajoute ici tes outils, fiches, exercices et supports de travail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="text-sm font-semibold text-gray-700">Titre</label>
            <input
              className="w-full border rounded p-2"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Attachement anxieux"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-gray-700">
              Catégorie
            </label>
            <select
              className="w-full border rounded p-2"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as ResourceCategory)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="text-sm font-semibold text-gray-700">Tags</label>
            <input
              className="w-full border rounded p-2"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex : abandon, dépendance, attachement"
            />
          </div>

          <div className="md:col-span-8">
            <label className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Petit résumé de l’outil..."
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-sm font-semibold text-gray-700">
              Fichier PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              className="w-full border rounded p-2"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <div className="text-xs text-gray-500 mt-1">{file.name}</div>
            )}
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-200 to-blue-200 shadow disabled:opacity-50"
            >
              {uploading ? "⏳ Envoi..." : "➕ Ajouter la ressource"}
            </button>
          </div>
        </div>
      </div>

      {/* Outils de recherche */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              className="border rounded p-2 w-72"
              placeholder="🔍 Rechercher une ressource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border rounded p-2"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as ResourceCategory | "Toutes")
              }
            >
              <option value="Toutes">Toutes catégories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
            />
            ⭐ Favoris seulement
          </label>
        </div>

        <div className="text-sm text-gray-600">
          {filteredResources.length} ressource
          {filteredResources.length > 1 ? "s" : ""} affichée
          {filteredResources.length > 1 ? "s" : ""}.
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((resource: any) => (
          <div
            key={resource.id}
            className="bg-white p-4 rounded-2xl shadow border space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {resource.categorie}
                  </span>

                  {resource.favori && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      ⭐ Favori
                    </span>
                  )}
                </div>

                <div className="font-bold mt-2">{resource.titre}</div>

                {resource.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {resource.description}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(resource)}
                  className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                  title="Favori"
                >
                  {resource.favori ? "⭐" : "☆"}
                </button>

                <button
                  onClick={() => removeResource(resource)}
                  className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>

            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={resource.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-sm"
              >
                📄 Ouvrir le PDF
              </a>
            </div>
          </div>
        ))}

        {filteredResources.length === 0 && (
          <div className="text-center text-gray-600 md:col-span-2">
            Aucune ressource pour l’instant.
          </div>
        )}
      </div>
    </div>
  );
}
