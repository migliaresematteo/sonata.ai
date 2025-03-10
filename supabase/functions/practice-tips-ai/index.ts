// Follow Deno deploy edge function format

interface RequestBody {
  pieceId?: string;
  pieceTitle?: string;
  composer?: string;
  period?: string;
  instrument?: string;
  difficulty?: number;
  genre?: string;
  userId?: string;
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
      pieceTitle,
      composer,
      period,
      instrument,
      difficulty,
      genre,
      userId,
    } = (await req.json()) as RequestBody;

    if (!pieceTitle) {
      throw new Error("Piece title is required");
    }

    // Gemini API key
    const apiKey = "AIzaSyAMZxzBoYdhDvQZRHOmAFamBztLI7po8mg";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    // Create prompt for Gemini
    const difficultyLevel =
      difficulty !== undefined
        ? difficulty <= 3
          ? "beginner"
          : difficulty <= 7
            ? "intermediate"
            : "advanced"
        : "intermediate";

    const prompt = `You are an expert classical music teacher. Please provide three specific practice tips for a student learning "${pieceTitle}" by ${composer || "an unknown composer"}. 
    
    The piece is for ${instrument || "piano"}, from the ${period || "unknown"} period, in the ${genre || "classical"} genre, and is considered ${difficultyLevel} level difficulty.
    
    Format your response as a JSON object with these three keys:
    1. "technicalFocus": A specific technical aspect to focus on for this piece (100-150 words)
    2. "practiceSchedule": A recommended practice schedule for this piece (100-150 words)
    3. "interpretation": Tips on how to interpret this piece authentically (100-150 words)
    
    Keep each tip concise, specific to this piece, and directly applicable.`;

    // Call Gemini API
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let practiceData;

    try {
      // Try to extract JSON from the response
      const textContent = data.candidates[0].content.parts[0].text;

      // Find JSON in the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        practiceData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      // Fallback to default practice tips
      practiceData = {
        technicalFocus: getDefaultTechnicalFocus(instrument, period),
        practiceSchedule:
          "Divide the piece into sections and focus on one section per practice session. Spend 15-20 minutes on technical challenges, then work on musicality and expression. Review previously learned sections regularly to maintain progress.",
        interpretation: getDefaultInterpretation(period),
      };
    }

    return new Response(JSON.stringify(practiceData), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error in practice-tips-ai function:", error);

    // Return fallback practice tips
    const fallbackTips = {
      technicalFocus:
        "Focus on identifying the challenging sections and practice them slowly with a metronome. Gradually increase the tempo as you become more comfortable. Pay attention to fingering, articulation, and dynamics.",
      practiceSchedule:
        "Divide the piece into sections and focus on one section per practice session. Spend 15-20 minutes on technical challenges, then work on musicality and expression. Review previously learned sections regularly to maintain progress.",
      interpretation:
        "Listen to recordings by different performers to develop your own interpretation. Pay attention to the historical context and performance practices of the period. Balance technical precision with emotional expression.",
    };

    return new Response(JSON.stringify(fallbackTips), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  }
});

// Default technical focus based on instrument
function getDefaultTechnicalFocus(
  instrument?: string,
  period?: string,
): string {
  if (instrument?.toLowerCase().includes("piano")) {
    return "Focus on hand independence and voicing. Pay attention to pedaling, especially in legato passages. Practice hands separately before combining them, and use a metronome to maintain steady rhythm.";
  } else if (instrument?.toLowerCase().includes("violin")) {
    return "Work on intonation and bow control. Practice string crossings slowly and use open strings to check your pitch. Focus on producing a clean, resonant tone and pay attention to bow distribution.";
  } else if (instrument?.toLowerCase().includes("voice")) {
    return "Focus on breath control and support. Pay attention to diction and text clarity. Practice difficult passages on a neutral syllable before adding text, and work on maintaining consistent tone throughout your range.";
  } else {
    return "Break down difficult passages and practice them slowly. Focus on tone production and articulation. Use a metronome to ensure rhythmic accuracy, and gradually increase the tempo as you become more comfortable.";
  }
}

// Default interpretation based on period
function getDefaultInterpretation(period?: string): string {
  if (period === "Baroque") {
    return "Focus on clear articulation and limited use of pedal or vibrato. Pay attention to ornaments and consider the dance-like qualities of the music. Emphasize the terraced dynamics characteristic of Baroque music.";
  } else if (period === "Classical") {
    return "Aim for clarity, balanced phrasing, and controlled dynamics. Observe the structural elements and highlight the thematic development. Maintain a steady pulse while allowing for subtle flexibility in tempo.";
  } else if (period === "Romantic") {
    return "Express emotion through rubato and dynamic contrast. Focus on the singing quality of the melodic lines and the rich harmonic colors. Allow for more personal expression while respecting the composer's intentions.";
  } else if (period === "Modern" || period === "Contemporary") {
    return "Pay careful attention to the composer's specific notations and instructions. Explore the unique sound world of the piece, which may include extended techniques. Balance precision with the expressive elements indicated in the score.";
  } else {
    return "Balance authenticity with your personal artistic voice. Research performance practices of the period while bringing your own interpretation. Focus on communicating the emotional content of the music to your audience.";
  }
}
