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
    console.log('Testing OpenAI API...');
    const openai = await getOpenAI();

    // Simple test without images first
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with a simple JSON object."
        },
        {
          role: "user",
          content: "Create a simple JSON object with name: 'test' and status: 'working'"
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
      temperature: 0.1
    });

    const result = completion.choices[0]?.message?.content;
    console.log('OpenAI API test result:', result);

    res.json({
      success: true,
      result: result ? JSON.parse(result) : null,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error("OpenAI API test error:", error);
    res.status(500).json({
      error: "OpenAI API test failed",
      details: error.message,
      code: error.code
    });
  }
}