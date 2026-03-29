import { Link } from "react-router-dom";

export default function Dashboard() {
  const cards = [
    {
      title: "👥 Clients",
      description: "Accéder aux fiches clients et au suivi clinique",
      path: "/clients",
    },
    {
      title: "💰 Compte",
      description: "Suivi de trésorerie et des dépenses",
      path: "/comptabilite",
    },
    {
      title: "📒 Livre de recettes",
      description: "Suivi des paiements et factures",
      path: "/livre-recettes",
    },
    {
      title: "📚 Ressources",
      description: "Supports et outils thérapeutiques",
      path: "/resources",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 p-6">
      <h1 className="text-3xl font-bold text-center mb-10">
        🌿 Tableau de bord
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {cards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="bg-white rounded-2xl shadow p-6 hover:scale-[1.02] transition border"
          >
            <div className="text-xl font-semibold mb-2">{card.title}</div>
            <div className="text-sm text-gray-600">{card.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
