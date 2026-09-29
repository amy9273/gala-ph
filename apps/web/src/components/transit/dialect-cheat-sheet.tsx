"use client";

import React, { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface DialectSection {
  code: string;
  name: string;
  region: string;
  flagEmoji: string;
  description: string;
  phrases: Array<{
    phrase: string;
    phonetic: string;
    english: string;
    tagalog: string;
    tip: string;
  }>;
}

const REGIONAL_DIALECTS: DialectSection[] = [
  {
    code: "ILO",
    name: "Ilocano",
    region: "La Union, Baguio, Pangasinan, Ilocos Sur & Norte",
    flagEmoji: "🏄‍♂️",
    description:
      "Essential for Elyu surfing weekend and Baguio highlands travel.",
    phrases: [
      {
        phrase: "Mano ti plete aginggana idiay beachfront?",
        phonetic: "MAH-noh tee PLEH-teh ah-geeng-GAH-nah ee-dee-AY beachfront?",
        english: "How much is the fare to the beachfront?",
        tagalog: "Magkano ang pamasahe hanggang beachfront?",
        tip: "Ask before boarding to secure the local commuter rate.",
      },
      {
        phrase: "Awanen ti tawar manong?",
        phonetic: "ah-wah-NEN tee TAH-wahr MAH-nong?",
        english: "Can we get a small discount, kuya?",
        tagalog: "Wala na bang tawad kuya?",
        tip: "Effective when hiring special trips for 3+ passengers.",
      },
      {
        phrase: "Ditoy laengen, agyamanak unay!",
        phonetic: "dee-TOY lah-eng-EN, ahg-yah-mah-NAHK oo-NAY!",
        english: "Just right here, thank you very much!",
        tagalog: "Dito na lang po, maraming salamat!",
        tip: "Polite stopping phrase when reaching your hostel or hotel.",
      },
      {
        phrase: "Naimbag a bigat / rabii!",
        phonetic: "nah-eem-BAHG ah BEE-gaht / rah-BEE-ee!",
        english: "Good morning / Good evening!",
        tagalog: "Magandang umaga / Magandang gabi!",
        tip: "Warm greeting that immediately establishes rapport with drivers.",
      },
    ],
  },
  {
    code: "BTG",
    name: "Batangueño Tagalog",
    region: "Batangas (Nasugbu, Calatagan, Mabini/Anilao, Laiya)",
    flagEmoji: "🏖️",
    description:
      "Authentic Southern Tagalog intonations with classic 'Ala eh!' warmth.",
    phrases: [
      {
        phrase: "Gaano baga ang pamasahi pa-Wawa port?",
        phonetic: "GAH-ah-noh BAH-gah ahng pah-mah-SAH-hee pah-WAH-wah port?",
        english: "How much is the fare to Wawa port?",
        tagalog: "Magkano ba ang pamasahe papuntang Wawa port?",
        tip: "Using 'baga' instantly signals you know local travel customs.",
      },
      {
        phrase: "Ala eh, baka naman pwedeng tawaran at marami kami!",
        phonetic:
          "AH-lah EH, BAH-kah nah-mahn PWEH-deng tah-wah-RAHN aht mah-RAH-mee kah-MEE!",
        english:
          "Ala eh, maybe we can get a discount since there are many of us!",
        tagalog: "Baka pwedeng tawaran at marami kami!",
        tip: "Friendly bargaining tone for Fortune Island boat trip connections.",
      },
      {
        phrase: "Pakitabi na laang ho sa may paradahan!",
        phonetic: "pah-kee-TAH-bee nah LAH-ahng hoh sah may pah-rah-DAH-hahn!",
        english: "Please just pull over near the parking area!",
        tagalog: "Pakitabi na lang po sa may paradahan!",
        tip: "Dropping off at beach resort entry points.",
      },
    ],
  },
  {
    code: "CEB",
    name: "Cebuano / Bisaya",
    region: "Cebu (Moalboal, Malapascua, Oslob), Bohol (Panglao), Dumaguete",
    flagEmoji: "🤿",
    description:
      "Crucial for Visayas island hopping, sardine run diving, and Bohol tours.",
    phrases: [
      {
        phrase: "Pila ang plete padung sa Panagsama Beach?",
        phonetic: "PEE-lah ahng PLEH-teh pah-DOONG sah pah-nahg-SAH-mah Beach?",
        english: "How much is the fare to Panagsama Beach?",
        tagalog: "Magkano ang pamasahe papuntang Panagsama Beach?",
        tip: "Locks in official local fare instead of tourist markups.",
      },
      {
        phrase: "Mahangyo pa ni kuya para sa barkada?",
        phonetic: "mah-HAHNG-yoh PAH nee KOO-yah PAH-rah sah bar-KAH-dah?",
        english: "Can we still negotiate the fare for our group, kuya?",
        tagalog: "Pwede pa bang mahingi ng tawad para sa barkada?",
        tip: "Respectful negotiation for chartered day tours.",
      },
      {
        phrase: "Palihug pakanaog diri sa may diving resort.",
        phonetic: "pah-LEE-hoog pah-kah-NAH-ohg DEE-ree sah may diving resort.",
        english: "Please drop us off here near the diving resort.",
        tagalog: "Pakibaba po kami dito sa may diving resort.",
        tip: "Clear direction for tricycle drivers along Panagsama road.",
      },
      {
        phrase: "Salamat kaayo, amping kanunay!",
        phonetic: "sah-LAH-maht KAH-ah-yoh, ahm-PEENG kah-NOO-nay!",
        english: "Thank you so much, take care always!",
        tagalog: "Maraming salamat, ingat palagi!",
        tip: "Warm parting phrase for island drivers.",
      },
    ],
  },
];

export function DialectCheatSheet() {
  const [selectedDialectCode, setSelectedDialectCode] = useState("ILO");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const dialect =
    REGIONAL_DIALECTS.find((d) => d.code === selectedDialectCode) ||
    REGIONAL_DIALECTS[0]!;

  const handleCopy = (phrase: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedText(phrase);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Dialect Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60">
        {REGIONAL_DIALECTS.map((d) => (
          <button
            key={d.code}
            type="button"
            onClick={() => setSelectedDialectCode(d.code)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedDialectCode === d.code
                ? "bg-brand-ocean text-white shadow-sm"
                : "bg-surface-secondary text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>{d.flagEmoji}</span>
            <span>{d.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Dialect Header */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{dialect.flagEmoji}</span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {dialect.name} Regional Negotiation Guide
              </h3>
              <p className="text-xs text-muted-foreground">
                Spoken in:{" "}
                <strong className="text-foreground">{dialect.region}</strong>
              </p>
            </div>
          </div>
          <Badge variant="sunset">Taga-Dito Friendly Discount</Badge>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {dialect.description} Speaking even a single greeting in the local
          tongue breaks the ice and helps your barkada secure fair municipal
          rates.
        </p>
      </div>

      {/* Phrases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dialect.phrases.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs hover:border-brand-ocean/40 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-black text-foreground">
                  &ldquo;{item.phrase}&rdquo;
                </div>
                <div className="text-[11px] font-mono text-muted-foreground italic">
                  [{item.phonetic}]
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(item.phrase)}
                className="gap-1 rounded-xl text-xs h-8 px-2.5 shrink-0"
              >
                {copiedText === item.phrase ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-nature-emerald" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-1 text-xs border-t border-border/40 pt-2">
              <div className="text-foreground/90">
                <strong className="text-muted-foreground text-[10px] uppercase block">
                  English Translation:
                </strong>
                <span>{item.english}</span>
              </div>
              <div className="text-muted-foreground text-[11px]">
                <strong className="text-muted-foreground text-[10px] uppercase block">
                  Tagalog Equivalent:
                </strong>
                <span>{item.tagalog}</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-secondary/70 p-2.5 text-[11px] text-muted-foreground flex items-center gap-1.5 border border-border/50">
              <Sparkles className="h-3.5 w-3.5 text-accent-sunset shrink-0" />
              <span>
                <strong>Cultural Tip:</strong> {item.tip}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
