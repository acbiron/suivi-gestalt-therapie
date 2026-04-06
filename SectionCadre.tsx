import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

export const getClients = async () => {
  const snapshot = await getDocs(collection(db, "clients"));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const addClient = async (client: any) => {
  await addDoc(collection(db, "clients"), {
    ...client,
    createdAt: new Date(),
  });
};

export const updateClient = async (id: string, data: any) => {
  await updateDoc(doc(db, "clients", id), data);
};
