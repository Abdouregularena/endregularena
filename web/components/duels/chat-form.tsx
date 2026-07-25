"use client";

import { useState } from "react";

export function ChatForm() {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg("");
      }}
    >
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Écrire un message..."
        className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        disabled={!msg.trim()}
        className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition disabled:opacity-40"
      >
        Envoyer
      </button>
    </form>
  );
}
