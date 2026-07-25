"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function AnswerForm() {
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-success/20 bg-success/5 p-5 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
        <p className="mt-2 text-sm font-semibold">Réponse publiée</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Elle sera visible après validation par la modération.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 rounded-2xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 30) return;
        setSent(true);
      }}
    >
      <label className="text-sm font-semibold">Ajouter une réponse argumentée</label>
      <p className="mt-1 text-xs text-muted-foreground">
        Cite tes sources. Les réponses sans fondement sont retirées par la modération.
      </p>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ton argumentation..."
        className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs ${text.length < 30 ? "text-muted-foreground" : "text-success"}`}>
          {text.length} / 30 caractères minimum
        </span>
        <button
          type="submit"
          disabled={text.trim().length < 30}
          className="btn-primary !py-2 !px-5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" /> Publier
        </button>
      </div>
    </form>
  );
}
