import { CheckCircle2, ExternalLink, HelpCircle, ShieldAlert } from "lucide-react";

import { Panel, StatusTag } from "@/components/briefing";
import { buildStayMatch } from "@/lib/stay-match-rag";
import type { ScoredStay } from "@/lib/scoring";
import type { UserTripProfile } from "@/lib/types";

export function EvidenceStayMatch({
  scoredStays,
  profile,
}: {
  scoredStays: ScoredStay[];
  profile: UserTripProfile;
}) {
  const match = buildStayMatch(scoredStays, profile);

  if (!match.hasProfile) {
    return (
      <Panel title="Evidence-based stay match">
        <p className="text-sm text-muted-foreground">
          Add must-haves, deal-breakers, or trip needs to match the shortlist
          against listing evidence.
        </p>
      </Panel>
    );
  }

  const best = match.scores.find((score) => score.stayId === match.bestStayId);

  return (
    <Panel
      title="Evidence-based stay match"
      aside={<StatusTag status={match.confidence >= 65 ? "go" : "caution"}>{match.confidence}% confidence</StatusTag>}
      bodyClassName="flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="eyebrow">Best match</p>
          <p className="mt-1 text-xl font-bold">{match.bestStayName ?? "No clear match"}</p>
        </div>
        {best ? <span className="data text-2xl font-bold">{best.score}/100</span> : null}
      </div>

      {match.whyItWins.length > 0 ? (
        <div>
          <h3 className="eyebrow">Why it wins</h3>
          <div className="mt-2 grid gap-3">
            {match.whyItWins.map((reason) => (
              <div key={reason.claim} className="border-l-2 border-go pl-3">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-go" />
                  {reason.claim}
                </p>
                {reason.evidence.map((evidence) => (
                  <blockquote key={`${evidence.source}:${evidence.text}`} className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    “{evidence.text}” <cite className="not-italic">— {evidence.sourceLabel}</cite>
                  </blockquote>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {match.dealbreakerWarnings.length > 0 ? (
        <div className="border-l-2 border-nogo pl-3">
          <h3 className="eyebrow flex items-center gap-2 text-nogo">
            <ShieldAlert className="size-4" /> Deal-breaker warnings
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {match.dealbreakerWarnings.map((warning) => (
              <li key={`${warning.stayId}:${warning.rule}`} className="text-sm">
                <span className="font-medium">{warning.stayName}:</span> {warning.rule}
                {warning.evidence[0] ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    “{warning.evidence[0].text}” — {warning.evidence[0].sourceLabel}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {match.scores.map((score) => {
          const stay = scoredStays.find((entry) => entry.stay.id === score.stayId)?.stay;
          return (
            <div key={score.stayId} className="border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{score.stayName}</span>
                <span className="data font-bold">{score.score}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {score.metCount}/{score.ruleCount} needs supported
                {score.dealbreakerHits > 0 ? ` · ${score.dealbreakerHits} warning${score.dealbreakerHits === 1 ? "" : "s"}` : ""}
              </p>
              {stay?.url ? (
                <a href={stay.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline">
                  Review source listing <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          );
        })}
      </div>

      {match.missingInfo.length > 0 ? (
        <div>
          <h3 className="eyebrow flex items-center gap-2">
            <HelpCircle className="size-4" /> Unknown or unsupported
          </h3>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {match.missingInfo.map((item) => (
              <li key={item} className="text-xs text-muted-foreground">{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}
