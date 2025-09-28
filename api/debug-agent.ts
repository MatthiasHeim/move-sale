import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getOpenAI() {
  const OpenAI = await import("openai");
  return new OpenAI.default({
    apiKey: process.env.OPENAI_API_KEY,
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

    console.log('Creating OpenAI client...');
    const openai = await getOpenAI();

    console.log('Making API call...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
                detail: "low"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.1
    });

    console.log('API call completed successfully');
    const result = completion.choices[0]?.message?.content;

    console.log('=== DEBUG COMPLETE ===');

    res.json({
      success: true,
      result: result ? JSON.parse(result) : null,
      usage: completion.usage,
      debug: 'This endpoint mimics agent-draft without authentication'
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