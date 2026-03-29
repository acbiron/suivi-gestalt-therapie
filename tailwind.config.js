export function exportBackup(clients: any[]) {
  try {
    const dataStr = JSON.stringify(clients, null, 2);

    const blob = new Blob([dataStr], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const date = new Date().toISOString().split("T")[0];

    link.download = `backup-gestalt-${date}.json`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur export backup", error);
    alert("Impossible d’exporter la sauvegarde.");
  }
}
