import { Download } from "lucide-react";

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: "csv" | "pdf";
  disabled?: boolean;
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(";"),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = String(val ?? "");
          return str.includes(";") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(";"),
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => String(row[h] ?? "")).join(" | "),
  );

  const content = [
    `RAPPORT: ${filename.replace(/_/g, " ").toUpperCase()}`,
    `Date: ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    headers.join(" | "),
    "-".repeat(headers.join(" | ").length),
    ...rows,
    "",
    `Total: ${data.length} ligne(s)`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ data, filename, type, disabled }: ExportButtonProps) {
  const handleClick = () => {
    if (type === "csv") {
      exportCSV(data, filename);
    } else {
      exportPDF(data, filename);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !data.length}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download size={13} />
      {type === "csv" ? "CSV" : "PDF"}
    </button>
  );
}
