import React from "react";
import { Download, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useDramas } from "../context/DramaContext.jsx";

export default function BackupControls() {
  const { exportDramas, importDramas } = useDramas();

  function downloadBackup() {
    const backup = exportDramas();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ashwatch-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup saved.");
  }

  async function uploadBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());
      await importDramas(backup);
    } catch (error) {
      toast.error(error.message || "That backup could not be restored.");
    }
  }

  return (
    <div className="backup-controls" aria-label="Local backup tools">
      <button className="secondary-button" type="button" onClick={downloadBackup}>
        <Download size={17} /> Export backup
      </button>
      <label className="secondary-button cursor-pointer">
        <Upload size={17} /> Import backup
        <input className="sr-only" type="file" accept="application/json,.json" onChange={uploadBackup} />
      </label>
    </div>
  );
}
