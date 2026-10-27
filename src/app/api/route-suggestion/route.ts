import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: Request) {
  try {
    const baseUrl = new URL(req.url).origin;
    const trafficRes = await fetch(`${baseUrl}/api/traffic`);
    const trafficData = await trafficRes.json();

    const corridorSummary = trafficData.corridors
      .map((c: any) => `${c.corridor}: ${c.status} traffic, ${c.durationMin} min`)
      .join(". ");

    const systemPrompt =
      "You are a NYC parking and traffic expert. Using the live traffic data provided, generate a short, practical Smart Route tip for today. Mention specific roads by name. Keep it under 40 words. Do not use markdown formatting.";

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Current live traffic conditions: ${corridorSummary}. Give me today's NYC smart parking route suggestion based on this.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const suggestion = completion.choices[0]?.message?.content || "No suggestion available.";

    return NextResponse.json({ suggestion, traffic: trafficData.corridors });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate route suggestion", details: err.message },
      { status: 500 }
    );
  }
}
