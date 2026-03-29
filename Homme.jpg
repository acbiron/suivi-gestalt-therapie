// src/Login.tsx
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";

export default function Login() {
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      alert("Connexion réussie !");
    } catch (error: any) {
      console.error(error);
      alert("Erreur de connexion : " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-blue-50 to-green-50">
      <button
        onClick={loginWithGoogle}
        className="px-6 py-3 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
      >
        🔑 Se connecter avec Google
      </button>
    </div>
  );
}
