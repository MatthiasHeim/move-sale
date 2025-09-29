import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getOpenRouterClient() {
  const OpenAI = await import("openai");
  return new OpenAI.default({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DEBUG AGENT TEST ===');
    console.log('Request body keys:', Object.keys(req.body));

    const { test_mode = true } = req.body;

    // Use the same small test image as test-vision
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    console.log('Creating OpenRouter client...');
    const client = await getOpenRouterClient();

    console.log('Making Grok-4-Fast API call...');
    const completion = await client.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
      messages: [
        {
          role: "system",
          content: "Create a JSON object with product details."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a simple product listing based on this image."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${testImageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.1
    }, {
      headers: {
        "HTTP-Referer": "https://seup.ch",
        "X-Title": "Seup.ch - Debug Agent Test"
      }
    });

    console.log('API call completed successfully');
    const result = completion.choices[0]?.message?.content;

    console.log('=== DEBUG COMPLETE ===');

    res.json({
      success: true,
      result: result ? JSON.parse(result) : null,
      usage: completion.usage,
      debug: 'This endpoint mimics agent-draft using OpenRouter Grok-4-Fast without authentication'
    });

  } catch (error: any) {
    console.error("=== DEBUG ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error);
    console.error("=== END DEBUG ERROR ===");

    res.status(500).json({
      error: "Debug agent test failed",
      details: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    });
  }
}