// Grades one rubric criterion of a written answer: YES or NO.
//
// The model never writes feedback. It only decides whether a criterion is
// met; students see the on_fail text written in the exercise's YAML. That
// keeps the voice the course's own and stops the verdict drifting between
// runs.
//
// The API key lives only in Netlify's environment variables, never in code.

const MODEL = "claude-haiku-4-5-20251001";

export default async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }

  const { answer, criterion, exemplar } = body ?? {};
  if (!answer || !criterion) {
    return Response.json({ error: "missing answer or criterion" }, { status: 400 });
  }
  if (answer.length > 2000) {
    return Response.json({ error: "answer too long" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 5,
      system:
        "You grade one criterion for a student answer. Reply with exactly YES or NO. " +
        "Nothing else. Judge only the criterion given, not spelling, length, or style. " +
        "The exemplar shows one good answer; different wording that meets the criterion " +
        "should still be YES.",
      messages: [{
        role: "user",
        content:
          `Criterion: ${criterion}\n\n` +
          `Exemplar answer: ${exemplar ?? "(none)"}\n\n` +
          `Student answer: ${answer}\n\n` +
          `Does the student answer meet the criterion? YES or NO.`,
      }],
    }),
  });

  if (!res.ok) return Response.json({ error: "judge unavailable" }, { status: 502 });

  const data = await res.json();
  const verdict = (data.content?.[0]?.text ?? "").trim().toUpperCase();
  return Response.json({ pass: verdict.startsWith("YES") });
};
