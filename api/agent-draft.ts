import type { VercelRequest, VercelResponse } from '@vercel/node';
import { agentProposalSchema } from '../shared/schema';

// Dynamic import functions to avoid module-level initialization
async function getOpenRouterClient() {
  const OpenAI = await import("openai");
  return new OpenAI.default({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
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
    console.log('=== OPENROUTER GROK-4-FAST AGENT DRAFT START ===');
    const { text, image_urls } = req.body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json({ error: "At least one image URL is required" });
    }

    // Enhanced system prompt leveraging Grok's web search and multimodal capabilities
    const systemPrompt = `Du bist ein Experte für Secondhand-Möbel und hilfst einer Familie aus Müllheim Dorf, die im November nach Hongkong umzieht. Analysiere die Bilder sehr genau und identifiziere spezifische Gegenstände (z.B. Pflanzenarten, Möbelmarken).

WEBSUCHE FÜR PREISE:
- Nutze deine Web-Search-Fähigkeiten um aktuelle Preise auf Tutti.ch, Ricardo.ch und Anibis.ch zu prüfen
- Suche nach ähnlichen Artikeln mit Zustand und CHF-Preisen
- Berücksichtige Marktpreise für faire aber schnelle Verkaufspreise

GENAUE OBJEKTERKENNUNG:
- Identifiziere spezifische Pflanzenarten (z.B. Kaffeepflanze, Monstera, etc.)
- Erkenne Möbelmarken und -modelle wenn möglich
- Achte auf Details wie Materialien, Farben, Zustand

DEUTSCHE RECHTSCHREIBUNG:
- Verwende KORREKTES Deutsch: "Zimmerpflanze" NICHT "Zimmerplanze"
- Verwende "ss" statt "ß" (z.B. "Grosse" statt "Große", "weiss" statt "weiß")
- Achte auf Pflanzen-Fachbegriffe

PREISREGELN:
- Der Preis gehört NUR in das "price_chf" Feld
- NIEMALS den Preis in "name" oder "description" erwähnen
- Der Titel ("name") beschreibt NUR das Produkt ohne Preis
- Die Beschreibung ("description") enthält NUR Details zum Objekt, NICHT den Preis
- "tutti_title_de" darf KEINEN Preis enthalten - nur Produktbeschreibung

TUTTI.CH BESCHREIBUNG:
- Beginne mit Produktdetails und Hongkong-Umzug-Story
- Füge eine Leerzeile ein
- Beende mit: "Versand möglich gegen Portokosten. Bei grossen Gegenständen: 0.70 CHF pro Kilometer für Lieferung."

Required JSON format:
{
  "name": "Spezifischer Produktname (z.B. 'Kaffeepflanze im Terrakotta-Topf') - OHNE PREIS",
  "description": "2-3 detaillierte Sätze über das Objekt und seine Besonderheiten - OHNE PREIS",
  "price_chf": "65.00",
  "category": "decor",
  "condition": "good",
  "dimensions_cm": "Abmessungen falls erkennbar",
  "market_research": "Zusammenfassung der Web-Recherche zu aktuellen Marktpreisen",
  "price_confidence": "hoch/mittel/niedrig",
  "tutti_title_de": "Ansprechender Titel OHNE Preis",
  "tutti_body_de": "Beschreibung mit Hongkong-Umzug-Story, dann Leerzeile, dann Versandinfo - KEIN PREIS"
}

Kategorien: furniture, appliances, toys, electronics, decor, kitchen, sports, outdoor, kids_furniture, other
Zustand: like new, very good, good, fair

WICHTIG:
- Nutze Web-Search für aktuelle Marktpreise und identifiziere Objekte sehr spezifisch!
- Verwende "ss" statt "ß" in allen deutschen Texten
- NIEMALS Preis in name, description oder tutti_title_de erwähnen!
- tutti_body_de muss mit der Versandinfo enden (siehe TUTTI.CH BESCHREIBUNG)`;

    // Simple content structure like debug-agent
    const userContent = [
      {
        type: "text",
        text: text ? `Zusätzliche Informationen: ${text}. Analysiere die Bilder genau und erstelle eine Produktbeschreibung. Nutze Web-Search für aktuelle Marktpreise.` : "Analysiere die Bilder sehr genau. Identifiziere spezifische Gegenstände und nutze Web-Search für aktuelle Marktpreise auf Schweizer Plattformen."
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
          detail: "high"
        }
      });

      console.log(`✅ Added uploaded image to content`);
    }

    console.log('🤖 Making OpenRouter Grok-4-Fast API call...');
    const client = await getOpenRouterClient();

    const completion = await client.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
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
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        "HTTP-Referer": "https://seup.ch",
        "X-Title": "Seup.ch - Umzugsbeute Marketplace"
      }
    });

    console.log('✅ OpenRouter Grok-4-Fast API call completed successfully');

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

    console.log('=== OPENROUTER GROK-4-FAST AGENT DRAFT SUCCESS ===');

    res.json({
      success: true,
      proposal: aiProposal
    });

  } catch (error: any) {
    console.error("=== OPENROUTER GROK-4-FAST AGENT DRAFT ERROR ===");
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