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
    console.log('Testing OpenRouter Grok-4-Fast Vision API...');
    const client = await getOpenRouterClient();

    // Simple test with a small test image (base64)
    // This is a tiny 1x1 pixel red image
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    const completion = await client.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that describes images. Respond with a simple JSON object."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in a JSON format with 'description' field."
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
      max_tokens: 100,
      temperature: 0.1
    }, {
      headers: {
        "HTTP-Referer": "https://seup.ch",
        "X-Title": "Seup.ch - Vision Test Endpoint"
      }
    });

    const result = completion.choices[0]?.message?.content;
    console.log('OpenRouter Grok-4-Fast Vision API test result:', result);

    res.json({
      success: true,
      result: result ? JSON.parse(result) : null,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error("OpenRouter Grok-4-Fast Vision API test error:", error);
    res.status(500).json({
      error: "OpenRouter Grok-4-Fast Vision API test failed",
      details: error.message,
      code: error.code,
      type: error.type
    });
  }
}