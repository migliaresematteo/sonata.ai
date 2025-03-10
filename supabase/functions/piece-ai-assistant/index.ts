// Follow Deno deploy edge function format

interface RequestBody {
  message: string;
  pieceId?: string;
  pieceTitle?: string;
  composer?: string;
  period?: string;
  instrument?: string;
  difficulty?: number;
  userId?: string;
  userEmail?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const {
      message,
      pieceId,
      pieceTitle,
      composer,
      period,
      instrument,
      difficulty,
      userId,
      userEmail,
    } = (await req.json()) as RequestBody;

    if (!message) {
      throw new Error("Message is required");
    }

    // For now, we'll use a simple response system
    // In a real implementation, you would call an AI API like OpenAI, Anthropic, etc.
    const response = simulateAIResponse(
      message,
      pieceTitle,
      composer,
      period,
      instrument,
      difficulty,
      userEmail,
    );

    return new Response(JSON.stringify({ response }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
    });
  }
});

// Simulate AI response for testing
function simulateAIResponse(
  userInput: string,
  pieceTitle?: string,
  composer?: string,
  period?: string,
  instrument?: string,
  difficulty?: number,
  userEmail?: string,
): string {
  const greeting = userEmail
    ? `I see you're asking about ${pieceTitle} as ${userEmail}. `
    : "";
  const pieceContext =
    pieceTitle && composer ? `${pieceTitle} by ${composer}` : "this piece";

  // Simple keyword matching for more relevant responses
  if (
    userInput.toLowerCase().includes("difficult") ||
    userInput.toLowerCase().includes("hard")
  ) {
    let difficultyLevel = "intermediate";
    if (difficulty !== undefined) {
      difficultyLevel =
        difficulty <= 3
          ? "beginner"
          : difficulty <= 7
            ? "intermediate"
            : "advanced";
    }

    return `${greeting}${pieceTitle} is considered a ${difficultyLevel} level piece. ${difficulty !== undefined && difficulty <= 3 ? "It's suitable for beginners with some experience." : difficulty !== undefined && difficulty <= 7 ? "It requires intermediate technical skills." : "It's quite challenging and requires advanced technique."} When practicing, break it down into smaller sections and work on them separately before combining.`;
  } else if (
    userInput.toLowerCase().includes("technique") ||
    userInput.toLowerCase().includes("practice")
  ) {
    if (instrument && instrument.toLowerCase().includes("piano")) {
      return `${greeting}For ${pieceContext}, focus on hand independence and voicing. Practice hands separately first, then slowly combine. Pay attention to the pedaling, especially in legato passages. Use a metronome to maintain steady rhythm.`;
    } else if (instrument && instrument.toLowerCase().includes("violin")) {
      return `${greeting}When practicing ${pieceContext}, pay special attention to intonation and bow control. Work on string crossings slowly, and use open strings to check your pitch. Focus on producing a clean, resonant tone.`;
    } else {
      return `${greeting}To practice ${pieceContext} effectively, break it into smaller sections and work on the challenging parts at a slower tempo. Gradually increase the speed as you become more comfortable. Record yourself to identify areas that need improvement.`;
    }
  } else if (
    userInput.toLowerCase().includes("history") ||
    userInput.toLowerCase().includes("background")
  ) {
    return `${greeting}${pieceContext} was composed during the ${period || "classical"} period. ${composer || "The composer"} created this piece during a time when ${period === "Baroque" ? "contrapuntal techniques and ornate melodic lines were prevalent." : period === "Classical" ? "formal structures and balanced phrases were valued." : period === "Romantic" ? "emotional expression and rich harmonies were emphasized." : "various musical innovations were being explored."}`;
  } else if (
    userInput.toLowerCase().includes("interpret") ||
    userInput.toLowerCase().includes("perform")
  ) {
    return `${greeting}When interpreting ${pieceContext}, consider the ${period || "appropriate"} performance practices. ${period === "Baroque" ? "Focus on clear articulation and limited use of pedal or vibrato." : period === "Classical" ? "Aim for clarity, balanced phrasing, and controlled dynamics." : period === "Romantic" ? "Express emotion through rubato and dynamic contrast." : "Balance authenticity with your personal artistic voice."} Listen to recordings by different performers to develop your own interpretation.`;
  }

  // Generic responses
  const genericResponses = [
    `${greeting}${pieceContext} is a beautiful work ${period ? `from the ${period} period` : ""}. It showcases ${composer ? `${composer}'s` : "the composer's"} characteristic style with its unique musical elements.`,
    `${greeting}When learning ${pieceContext}, start by analyzing its structure and identifying recurring themes and patterns. This will help you understand the piece better and memorize it more effectively.`,
    `${greeting}${pieceContext} features interesting musical elements that make it both challenging and rewarding to play. The ${difficulty !== undefined ? (difficulty <= 3 ? "accessible" : difficulty <= 7 ? "moderate" : "complex") : "varied"} technical requirements include ${instrument === "Piano" ? "hand coordination and expressive phrasing" : "precise articulation and dynamic control"}.`,
    `${greeting}To master ${pieceContext}, regular, focused practice is key. Spend time on the difficult passages, but also work on connecting sections smoothly to maintain the musical flow.`,
    `${greeting}${pieceContext} exemplifies many characteristics of ${period ? `${period} period music` : "classical music"}, including ${period === "Baroque" ? "contrapuntal textures and ornamental details" : period === "Classical" ? "balanced phrases and clear structures" : period === "Romantic" ? "emotional expressivity and rich harmonies" : "distinctive musical techniques"}.`,
  ];

  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}
