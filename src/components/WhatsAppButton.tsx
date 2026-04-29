"use client";

import { useState } from "react";
import { Lead } from "@/lib/types";
import { TEMPLATES, buildWhatsAppLink } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  lead: Lead;
  onSent?: () => void;
}

export default function WhatsAppButton({ lead, onSent }: WhatsAppButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("welcome");
  const [customMessage, setCustomMessage] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const messageText = useCustom
    ? customMessage
    : TEMPLATES[selectedTemplate]?.build(lead.name) || "";

  const waLink = buildWhatsAppLink(lead.phone, messageText);

  const handleSend = async () => {
    // Open WhatsApp in new tab
    window.open(waLink, "_blank");

    // Log the send to our API
    try {
      await fetch("/api/whatsapp/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          template: useCustom ? "custom" : selectedTemplate,
        }),
      });
    } catch {
      // Logging is best-effort
    }

    onSent?.();
    setOpen(false);
  };

  // Quick send: open wa.me directly with the default template
  const handleQuickSend = () => {
    const quickLink = buildWhatsAppLink(
      lead.phone,
      TEMPLATES["welcome"].build(lead.name)
    );
    window.open(quickLink, "_blank");
  };

  return (
    <>
      {/* Main WA button with quick-send */}
      <div className="flex">
        <button
          onClick={handleQuickSend}
          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-l transition"
          title="×¤×ª× WhatsApp ×¢× ××××¢×ª ××¨××"
        >
          WA
        </button>
        <button
          onClick={() => setOpen(true)}
          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-1 py-1 rounded-r border-l border-green-200 transition"
          title="×××¨ ×ª×× ××ª ××××¢×"
        >
          â¾
        </button>
      </div>

      {/* Template picker dialog */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <span className="text-green-600">â</span>
                ×©××××ª WhatsApp ×{lead.name}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                â
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Template or Custom toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUseCustom(false)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition ${
                    !useCustom ? "bg-green-50 border-green-300 text-green-700" : "bg-white"
                  }`}
                >
                  ×ª×× ××ª ×××× ×
                </button>
                <button
                  onClick={() => setUseCustom(true)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition ${
                    useCustom ? "bg-green-50 border-green-300 text-green-700" : "bg-white"
                  }`}
                >
                  ××××¢× ×××¤×©××ª
                </button>
              </div>

              {!useCustom ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ×××¨ ×ª×× ××ª
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                      <option key={key} value={key}>
                        {tmpl.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ××××¢× ×××¤×©××ª
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={4}
                    placeholder="××ª×× ××××¢×..."
                  />
                </div>
              )}

              {/* Preview */}
              <div>
                <p className="text-xs text-gray-500 mb-1">×ª×¦××× ××§××××:</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-700 max-h-32 overflow-y-auto">
                  {messageText || "..."}
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-400">
                ××¡×¤×¨: {lead.phone} Â· ×××¤×ª× ××©××¨××ª ×-WhatsApp
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={useCustom && !customMessage.trim()}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ×¤×ª× ×-WhatsApp
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  ×××××
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
