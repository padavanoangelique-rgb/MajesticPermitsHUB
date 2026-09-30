"use client";

import { useState } from "react";

const COUNTIES = [
  {
    id: "miami-dade",
    name: "Miami-Dade",
    url: (address: string) =>
      `https://www.miamidade.gov/Apps/PA/propertysearch/#/?address=${encodeURIComponent(address)}`,
  },
  {
    id: "broward",
    name: "Broward",
    url: () => "https://web.bcpa.net/bcpaclient/#/Record-Search",
  },
  {
    id: "palm-beach",
    name: "Palm Beach",
    url: (address: string) =>
      `https://pbcpao.gov/Property/Search?address=${encodeURIComponent(address)}`,
  },
];

export function LookupForm() {
  const [county, setCounty] = useState(COUNTIES[0].id);
  const [address, setAddress] = useState("");

  function open(event: React.FormEvent) {
    event.preventDefault();
    const chosen = COUNTIES.find((item) => item.id === county) || COUNTIES[0];
    window.open(chosen.url(address.trim()), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={open} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        County
        <select className="min-h-12 rounded-xl border border-border bg-card px-3" value={county} onChange={(e) => setCounty(e.target.value)}>
          {COUNTIES.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Street address
        <input className="min-h-12 rounded-xl border border-border bg-card px-3" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
      </label>
      <button className="min-h-12 rounded-xl bg-primary font-semibold text-white">Open the appraiser</button>
      <p className="text-xs text-muted-foreground">
        Broward’s site does not take the address in the link. Paste it into their search after it opens.
      </p>
    </form>
  );
}
