/**
 * /api/recommend-stream — SSE endpoint for Plan Recommender AI narrative
 *
 * Accepts questionnaire answers + top 3 ranked plans,
 * streams a personalized Claude Haiku recommendation token-by-token.
 * Uses raw fetch (same pattern as compareStream.ts) — no SDK dependency.
 */

import { Router } from "express";
import { z } from "zod";

const router = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const AnswersSchema = z.object({
  healthStatus: z.string(),
  chronicConditions: z.string(),
  plannedSurgery: z.string(),
  pcpVisits: z.string(),
  specialistVisits: z.string(),
  erVisits: z.string(),
  urgentCareVisits: z.string(),
  monthlyRxCount: z.string(),
  brandNameDrugs: z.string(),
  specialtyDrugs: z.string(),
  monthlyDrugSpend: z.string(),
  dentalImportance: z.string(),
  visionImportance: z.string(),
  hearingImportance: z.string(),
  needsTransportation: z.string(),
  wantsOTC: z.string(),
  wantsFitness: z.string(),
  hasSpecificDoctors: z.string(),
  planTypePreference: z.string(),
  topPriority: z.string(),
});

const TopPlanSchema = z.object({
  planName: z.string(),
  carrier: z.string(),
  planType: z.string(),
  premium: z.number(),
  maxOutOfPocket: z.number(),
  starRating: z.number(),
  estimatedCost: z.number(),
  rank: z.number(),
  whyRecommended: z.array(z.string()),
});

const RequestSchema = z.object({
  answers: AnswersSchema,
  topPlans: z.array(TopPlanSchema).min(1).max(3),
});

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(
  answers: z.infer<typeof AnswersSchema>,
  topPlans: z.infer<typeof TopPlanSchema>[]
): string {
  const healthProfile = [
    `Health status: ${answers.healthStatus}`,
    `Chronic conditions: ${answers.chronicConditions}`,
    `Planned surgery/hospitalization: ${answers.plannedSurgery}`,
    `PCP visits/year: ${answers.pcpVisits}`,
    `Specialist visits/year: ${answers.specialistVisits}`,
    `ER visits/year: ${answers.erVisits}`,
    `Urgent care visits/year: ${answers.urgentCareVisits}`,
    `Monthly prescriptions: ${answers.monthlyRxCount}`,
    `Brand-name drugs: ${answers.brandNameDrugs}`,
    `Specialty/tier 4-5 drugs: ${answers.specialtyDrugs}`,
    `Monthly drug spend (uninsured): ${answers.monthlyDrugSpend}`,
    `Dental importance: ${answers.dentalImportance}`,
    `Vision importance: ${answers.visionImportance}`,
    `Hearing importance: ${answers.hearingImportance}`,
    `Needs transportation: ${answers.needsTransportation}`,
    `Wants OTC allowance: ${answers.wantsOTC}`,
    `Wants fitness benefit: ${answers.wantsFitness}`,
    `Has specific doctors: ${answers.hasSpecificDoctors}`,
    `Plan type preference: ${answers.planTypePreference}`,
    `Top priority: ${answers.topPriority}`,
  ]
    .map((l) => `- ${l}`)
    .join("\n");

  const plansText = topPlans
    .map(
      (p) =>
        `Rank #${p.rank}: ${p.planName} (${p.carrier})\n` +
        `  Type: ${p.planType} | Premium: $${p.premium}/mo | Max OOP: $${p.maxOutOfPocket.toLocaleString()} | Stars: ${p.starRating}★\n` +
        `  Estimated annual cost: $${p.estimatedCost.toLocaleString()}\n` +
        `  Why it matches: ${p.whyRecommended.join("; ")}`
    )
    .join("\n\n");

  return `You are a Medicare insurance advisor. A beneficiary has completed a health profile questionnaire. Based on their answers and the top 3 ranked plans, write a concise personalized recommendation.

BENEFICIARY PROFILE:
${healthProfile}

TOP 3 RANKED PLANS:
${plansText}

Write exactly 3 sections using ## headings:

## Quick Summary
2-3 sentences summarizing this person's health situation and what type of plan fits them best.

## Why These Plans Were Selected
3-4 bullet points explaining the key reasons these specific plans match their profile. Reference specific benefits, costs, or plan features that align with their answers.

## Our Top Recommendation
1 short paragraph (3-4 sentences) explaining why the #1 ranked plan is the best fit, what they should watch out for, and one actionable next step.

Keep the tone warm, clear, and helpful. Avoid jargon. Do not repeat the cost numbers already shown in the comparison table above. Focus on the "why" — the personal fit between their needs and the plan features.`;
}

// ── SSE helper ────────────────────────────────────────────────────────────────

function sendSSE(res: import("express").Response, event: string, data: string) {
  res.write(`event: ${event}\ndata: ${data}\n\n`);
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/recommend-stream", async (req, res) => {
  // Validate input
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { answers, topPlans } = parsed.data;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendSSE(res, "error", JSON.stringify({ message: "ANTHROPIC_API_KEY not configured" }));
    res.end();
    return;
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 600,
        stream: true,
        messages: [{ role: "user", content: buildPrompt(answers, topPlans) }],
      }),
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      sendSSE(res, "error", JSON.stringify({ message: `Anthropic API error: ${anthropicRes.status} — ${errorText.slice(0, 200)}` }));
      res.end();
      return;
    }

    const reader = anthropicRes.body?.getReader();
    if (!reader) {
      sendSSE(res, "error", JSON.stringify({ message: "No response body from Anthropic" }));
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      if (res.destroyed) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;

        try {
          const evt = JSON.parse(raw) as {
            type: string;
            delta?: { type: string; text?: string };
          };

          if (
            evt.type === "content_block_delta" &&
            evt.delta?.type === "text_delta" &&
            evt.delta.text
          ) {
            sendSSE(res, "delta", JSON.stringify(evt.delta.text));
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    sendSSE(res, "done", "{}");
    res.end();
  } catch (err) {
    console.error("[recommend-stream] Error:", err);
    if (!res.destroyed) {
      sendSSE(res, "error", JSON.stringify({ message: (err as Error).message }));
      res.end();
    }
  }
});

export default router;
