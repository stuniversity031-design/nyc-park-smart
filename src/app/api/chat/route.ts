import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `You are NYC Park Smart, an intelligent parking and city assistant for New York City residents. 
You have access to the following live context about the user's current situation:

Location: ${context.locationName || "NYC"}
Zip Code: ${context.zip || "Unknown"}
Borough: ${context.borough || "Unknown"}
Current Weather: ${context.weather || "Unknown"}
ASP Status: ${context.aspStatus || "Unknown"}
Next ASP Suspension: ${context.nextSuspension || "Unknown"}
Traffic on BQE: ${context.bqeStatus || "Unknown"}
Traffic on LIE: ${context.lieStatus || "Unknown"}
Traffic on Atlantic Ave: ${context.atlanticStatus || "Unknown"}
Traffic on Van Wyck: ${context.vanWyckStatus || "Unknown"}

You can help with:
- Alternate side parking schedules and suspensions
- Street cleaning rules and times
- Parking garage locations and rates
- Parking meter locations and hours
- NYC 311 parking complaints
- MTA subway and bus alerts
- Traffic conditions on major corridors
- Weather impact on parking
- Smart routing suggestions
- NYC parking rules and regulations
- Fire hydrant rules (15 feet)
- Street sign interpretation
- Ticket disputes and violations

Keep responses concise, practical, and NYC-specific. 
Never use markdown formatting. 
Always be helpful and direct.
If asked about something outside NYC parking and transit, politely redirect to your specialty.`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || "I could not process that request.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Chat failed", details: err.message },
      { status: 500 }
    );
  }
}
