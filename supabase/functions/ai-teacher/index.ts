// Follow Deno deploy edge function format

interface RequestBody {
  message: string;
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
    const { message, userId, userEmail } = (await req.json()) as RequestBody;

    if (!message) {
      throw new Error("Message is required");
    }

    // For now, we'll use a simple response system
    // In a real implementation, you would call an AI API like OpenAI, Anthropic, etc.
    const response = simulateAIResponse(message, userEmail);

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
function simulateAIResponse(userInput: string, userEmail?: string): string {
  const greeting = userEmail ? `I see you're practicing as ${userEmail}. ` : "";

  const responses = [
    `${greeting}Based on your practice history, I recommend focusing on improving your finger technique. Try practicing scales slowly with a metronome, gradually increasing the tempo as you become more comfortable.`,
    `${greeting}For Bach's pieces, pay special attention to articulation and ornaments. Try practicing each hand separately before combining them.`,
    `${greeting}To improve your sight-reading skills, I recommend spending 10-15 minutes each day reading through new pieces at a comfortable tempo. Don't worry about mistakes - the goal is to keep going and train your eyes to look ahead.`,
    `${greeting}For your current repertoire, I suggest dividing each piece into smaller sections and practicing them intensively. Focus on one section per day, and review previously mastered sections regularly.`,
    `${greeting}Based on your progress, you might be ready to tackle more challenging pieces. Consider adding some Chopin or Debussy to your repertoire to develop different aspects of your technique.`,
    `${greeting}When practicing the Moonlight Sonata, focus on maintaining an even tempo and bringing out the melody in the top voice while keeping the triplet accompaniment soft and flowing.`,
    `${greeting}For Chopin's Nocturnes, work on your pedaling technique. The pedal should create a smooth, connected sound without blurring harmonies.`,
    `${greeting}I recommend practicing with a metronome to develop a solid sense of rhythm, especially for pieces with complex rhythmic patterns.`,
  ];

  // Simple keyword matching for more relevant responses
  if (userInput.toLowerCase().includes("bach")) {
    return `${greeting}For Bach's counterpoint, I recommend practicing each voice separately before combining them. Pay attention to the independence of each line while maintaining a cohesive whole.`;
  } else if (userInput.toLowerCase().includes("chopin")) {
    return `${greeting}Chopin's music requires a delicate touch and expressive rubato. Practice with a flexible wrist and focus on creating a singing tone for the melodies.`;
  } else if (
    userInput.toLowerCase().includes("beginner") ||
    userInput.toLowerCase().includes("start")
  ) {
    return `${greeting}For beginners, I recommend starting with pieces like Bach's Minuet in G, Clementi's Sonatinas, or Schumann's 'The Merry Farmer'. These pieces will help develop fundamental techniques while being musically rewarding.`;
  } else if (
    userInput.toLowerCase().includes("technique") ||
    userInput.toLowerCase().includes("finger")
  ) {
    return `${greeting}To improve finger technique, practice Hanon exercises, scales, and arpeggios daily. Start slowly with a metronome and gradually increase the tempo as you gain confidence and accuracy.`;
  }

  // Return a random response if no keywords match
  return responses[Math.floor(Math.random() * responses.length)];
}
