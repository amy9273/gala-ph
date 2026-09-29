"use client";

import React, { useState } from "react";
import {
  Navigation,
  Clock,
  ShieldCheck,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Moon,
  MessageCircle,
} from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import { TodaTariff } from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export interface TodaTariffCardProps {
  tariff: TodaTariff;
  onUpvote?: (tariffId: string) => void;
}

export function TodaTariffCard({ tariff, onUpvote }: TodaTariffCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [upvotes, setUpvotes] = useState(tariff.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  const handleUpvote = () => {
    if (hasUpvoted) {
      setUpvotes((prev) => prev - 1);
      setHasUpvoted(false);
    } else {
      setUpvotes((prev) => prev + 1);
      setHasUpvoted(true);
      if (onUpvote) onUpvote(tariff.id);
    }
  };

  const copyPhrase = (phrase: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedPhrase(phrase);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-brand-ocean/40 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-brand-ocean uppercase tracking-wider">
              {tariff.municipality}, {tariff.province}
            </span>
            {tariff.verifiedByLGU && (
              <Badge variant="commute" className="text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>LGU Verified Tariff</span>
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-semibold">
              {tariff.dialectName}
            </Badge>
          </div>

          <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <span>{tariff.originTerminal}</span>
            <span className="text-accent-sunset font-black">→</span>
            <span>{tariff.destination}</span>
          </h4>
        </div>

        {/* Upvote Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUpvote}
            className={`gap-1.5 rounded-xl text-xs h-8 ${
              hasUpvoted
                ? "border-nature-emerald bg-nature-emerald/10 text-nature-emerald font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp
              className={`h-3.5 w-3.5 ${hasUpvoted ? "fill-current" : ""}`}
            />
            <span>{upvotes}</span>
          </Button>
        </div>
      </div>

      {/* Fare Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="rounded-xl bg-surface-secondary/70 p-3 border border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Regular Fare (Per Head)
          </span>
          <div className="text-lg font-black text-foreground mt-0.5">
            {formatPHP(tariff.regularFarePerHead, false)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Standard commuter rate
          </span>
        </div>

        <div className="rounded-xl bg-brand-ocean/5 p-3 border border-brand-ocean/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ocean block">
            Special Chartered Trip
          </span>
          <div className="text-lg font-black text-brand-ocean mt-0.5">
            {formatPHP(tariff.specialTripFare, false)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Direct group trip (1-3 pax)
          </span>
        </div>

        {tariff.nightDiffFare && (
          <div className="rounded-xl bg-amber-500/5 p-3 border border-amber-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Moon className="h-3 w-3" />
              <span>Night Differential</span>
            </span>
            <div className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
              {formatPHP(tariff.nightDiffFare, false)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              After {tariff.nightDiffStartTime || "8:00 PM"}
            </span>
          </div>
        )}

        <div className="rounded-xl bg-rose-500/5 p-3 border border-rose-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Last Trip Curfew</span>
          </span>
          <div className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5">
            {tariff.lastTripCurfew}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Avoid getting stranded
          </span>
        </div>
      </div>

      {tariff.notes && (
        <div className="flex items-center gap-2 rounded-xl bg-surface-secondary/40 p-2.5 text-xs text-muted-foreground border border-border/50">
          <Navigation className="h-3.5 w-3.5 text-brand-ocean shrink-0" />
          <span>{tariff.notes}</span>
        </div>
      )}

      {/* Dialect Negotiation Flashcards Accordion */}
      {tariff.dialectPhrases.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-brand-ocean hover:text-brand-ocean/80 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>
                {tariff.dialectName} Bargaining Cheat Sheet (
                {tariff.dialectPhrases.length} phrases)
              </span>
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-200">
              {tariff.dialectPhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-surface-secondary/60 p-3 border border-border/60 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <span className="text-accent-sunset">🗣️</span>
                        <span>&ldquo;{phrase.phrase}&rdquo;</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground italic">
                        [{phrase.phonetic}]
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyPhrase(phrase.phrase)}
                      className="gap-1 rounded-lg text-[10px] h-7 px-2"
                    >
                      {copiedPhrase === phrase.phrase ? (
                        <>
                          <Check className="h-3 w-3 text-nature-emerald" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-foreground/90 font-medium">
                    Meaning: <span className="italic">{phrase.meaning}</span>
                  </div>

                  <div className="text-[10px] text-muted-foreground bg-surface/80 rounded-lg p-1.5 border border-border/40">
                    💡 Tip: {phrase.context}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
