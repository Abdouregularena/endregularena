"use client";

import { ArrowRight } from "lucide-react";

export function ContactForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("(Démo) Demande envoyée");
      }}
      className="mx-auto mt-16 max-w-2xl card-surface !p-8"
    >
      <h2 className="text-2xl font-bold tracking-tight">Prendre contact</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Notre équipe revient vers vous sous 48 h ouvrées.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nom complet</label>
          <input required className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Organisation</label>
          <input required className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email pro</label>
          <input type="email" required className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Effectif</label>
          <select className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option>Moins de 20</option>
            <option>20 à 100</option>
            <option>100 à 500</option>
            <option>Plus de 500</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium">Votre besoin</label>
        <textarea rows={4} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>

      <button type="submit" className="btn-primary mt-6 w-full !py-3">
        Envoyer la demande <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
