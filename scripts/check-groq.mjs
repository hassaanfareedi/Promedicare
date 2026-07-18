// Quick standalone Groq connectivity check. Run:
//   node --env-file=.env.local scripts/check-groq.mjs
const apiKey = process.env.GROQ_API_KEY;
const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!apiKey) {
  console.error("GROQ_API_KEY is not set");
  process.exit(1);
}

const res = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: 'Return ONLY {"status":"ok"} as JSON.' },
      { role: "user", content: "ping" },
    ],
  }),
});

if (!res.ok) {
  console.error(`Groq responded ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const json = await res.json();
console.log("Groq OK. model=", json.model, "content=", json.choices?.[0]?.message?.content);
