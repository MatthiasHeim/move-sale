import type { VercelRequest, VercelResponse } from '@vercel/node';
import { agentProposalSchema } from '../shared/schema';

// Dynamic import functions to avoid module-level initialization
async function getOpenAI() {
  const OpenAI = await import("openai");
  return new OpenAI.default({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Auth check for admin with enhanced logging
function requireAdminAuth(req: VercelRequest): boolean {
  console.log('🔐 Authentication check started');

  // Check for API token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const isValidToken = token === process.env.API_TOKEN;
    console.log('🔑 API token check:', isValidToken ? 'valid' : 'invalid');
    if (isValidToken) return true;
  }

  // Check for session-based auth (cookie)
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const hasAuthSession = cookieHeader.includes('auth-session=authenticated');
    console.log('✅ Auth session found:', hasAuthSession);
    return hasAuthSession;
  }

  console.log('❌ No valid authentication found');
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  if (!requireAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('=== WORKING AGENT DRAFT START ===');
    const { text, image_urls } = req.body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json({ error: "At least one image URL is required" });
    }

    // Use a minimal but effective prompt
    const systemPrompt = `Create a product listing in German for a family moving from Switzerland to Hong Kong. Respond with valid JSON only.

Required format:
{
  "name": "Product name in German",
  "description": "2-3 sentences describing the item and its value",
  "price_chf": "95.00",
  "category": "furniture",
  "condition": "good",
  "tutti_title_de": "Title without price",
  "tutti_body_de": "German description mentioning Hong Kong move and price at end"
}

Categories: furniture, appliances, toys, electronics, decor, kitchen, sports, outdoor, kids_furniture, other
Conditions: like new, very good, good, fair`;

    // Simple content structure like debug-agent
    const userContent = [
      {
        type: "text",
        text: text ? `Additional info: ${text}. Create listing based on image.` : "Create product listing based on the image."
      }
    ];

    // Process actual uploaded images
    for (const imageUrl of image_urls.slice(0, 3)) { // Limit to 3 images for API efficiency
      console.log(`📷 Processing image URL: ${imageUrl}`);

      // Use the uploaded image URLs directly (they should be accessible URLs)
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "low"
        }
      });

      console.log(`✅ Added uploaded image to content`);
    }

    console.log('🤖 Making OpenAI API call...');
    const openai = await getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7
    });

    console.log('✅ OpenAI API call completed successfully');

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from AI");
    }

    let aiProposal;
    try {
      aiProposal = JSON.parse(responseContent);
    } catch (error) {
      console.error("Failed to parse AI response:", responseContent);
      throw new Error("Invalid JSON response from AI");
    }

    // Minimal validation
    const validatedCategories = ["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"];
    const validatedConditions = ["like new", "very good", "good", "fair"];

    if (!validatedCategories.includes(aiProposal.category)) {
      aiProposal.category = "other";
    }

    if (!validatedConditions.includes(aiProposal.condition)) {
      aiProposal.condition = "good";
    }

    // Set cover image and gallery
    aiProposal.cover_image_url = image_urls[0] || '';
    aiProposal.gallery_image_urls = image_urls || [];

    // Add required fields if missing
    if (!aiProposal.price_chf) aiProposal.price_chf = "95.00";
    if (!aiProposal.dimensions_cm) aiProposal.dimensions_cm = "";
    if (!aiProposal.market_research) aiProposal.market_research = "Estimated based on Swiss secondhand market";
    if (!aiProposal.price_confidence) aiProposal.price_confidence = "medium";

    console.log('=== WORKING AGENT DRAFT SUCCESS ===');

    res.json({
      success: true,
      proposal: aiProposal
    });

  } catch (error: any) {
    console.error("=== WORKING AGENT DRAFT ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("=== END ERROR ===");

    res.status(500).json({
      error: "AI processing failed",
      details: String(error),
      message: error.message,
      code: error.code
    });
  }
}