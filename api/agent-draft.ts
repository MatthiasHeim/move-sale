import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { agentProposalSchema } from '../shared/schema';

// Dynamic import functions to avoid module-level initialization
async function getOpenAI() {
  const OpenAI = await import("openai");
  return new OpenAI.default({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Auth check for admin
function requireAdminAuth(req: VercelRequest): boolean {
  // Check for API token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === process.env.API_TOKEN;
  }

  // Check for session-based auth (cookie)
  const sessionCookie = req.headers.cookie?.includes('auth-session=authenticated');
  return !!sessionCookie;
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
    const { text, image_urls } = req.body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json({ error: "At least one image URL is required" });
    }

    // Enhanced system prompt with storytelling for engaging listings
    const systemPrompt = `Du bist ein Experte für Secondhand-Möbel und hilfst einer Familie aus Müllheim Dorf, die im November nach Hongkong umzieht. Alle geliebten Möbel und Gegenstände müssen verkauft werden - nicht wegen Mängeln, sondern wegen des großen Umzugs.

FAMILIEN-KONTEXT FÜR STORYTELLING:
- Familie zieht im November 2024 nach Hongkong um (großer Lebenswandel)
- Alle Artikel sind geliebt und gut gepflegt - würden sonst behalten werden
- Schweren Herzens verkaufen, weil Umzug alles verändert
- Faire Preise für schnellen, stressfreien Verkauf
- Abholung vor Ort in Müllheim Dorf, Bar oder TWINT
- Kein Link, E-Mail oder Telefonnummer in Tutti Texten

KATEGORIEN (nur diese verwenden):
furniture, appliances, toys, electronics, decor, kitchen, sports, outdoor, kids_furniture, other

PREISGESTALTUNG MIT MARKTFORSCHUNG:
- WICHTIG: Führe eine Web-Suche durch für ähnliche Artikel auf Schweizer Plattformen
- Suche nach: "{Produktname} gebraucht Schweiz CHF Tutti Ricardo Anibis"
- Vergleiche gefundene Preise und berücksichtige Zustand
- Preis in CHF, auf 5 CHF runden, als String mit 2 Dezimalstellen (z.B. "120.00")
- Berücksichtige Marktpreise + Umzugsdruck (faire aber schnelle Preise)

ZUSTAND (nur diese verwenden):
like new, very good, good, fair

BESCHREIBUNGEN ERSTELLEN:
1. **description** (Website): 2-3 detaillierte Sätze. Beschreibe Nutzen, Besonderheiten, warum es wertvoll ist. Erwähne wie es der Familie gedient hat.

2. **tutti_title_de** (Tutti/Facebook): Ansprechender Titel OHNE Preis! Format: "Marke + Modell + Hauptmerkmal" (z.B. "IKEA Kallax Regal weiß 4x4 Fächer")

3. **tutti_body_de** (Tutti/Facebook): Storytelling-Ansatz mit dieser Struktur:
   - Eröffnung: "Da wir im November nach Hongkong umziehen, müssen wir schweren Herzens..."
   - Produktstory: Was macht es besonders, wie hat es uns gedient, warum ist es toll
   - Ehrliche Zustandsbeschreibung mit positiver Note
   - Emotionale Verbindung: "Würden wir gerne behalten, aber der Umzug lässt uns keine Wahl"
   - Praktische Details: Abholung Müllheim Dorf, Bezahlung, Preis am Ende

TON UND STIL:
- Warmherzig & persönlich (wie Gespräch mit Nachbarn)
- Storytelling-fokussiert (jeder Artikel hat eine Geschichte)
- Vertrauensbildend (ehrlich über Zustand, begeistert über Qualität)
- Emotional aber nicht übertrieben sentimental
- Schaffe Verbindung: "Wir geben unser Zuhause auf, aber Sie können es weiterlieben"

Analysiere die Bilder, führe Marktforschung durch und erstelle ein JSON-Objekt mit GENAU dieser Struktur:
{
  "name": "Produktname (z.B. 'IKEA Kallax Regal weiß')",
  "description": "2-3 detaillierte Sätze für Website. Beschreibe Nutzen, Besonderheiten und warum es wertvoll ist.",
  "price_chf": "120.00",
  "category": "furniture",
  "condition": "good",
  "dimensions_cm": "80x40x120 (BxTxH)" oder leer lassen wenn unsicher,
  "market_research": "Zusammenfassung der gefundenen Marktpreise und Begründung der Preisgestaltung",
  "price_confidence": "hoch/mittel/niedrig - Konfidenz basierend auf verfügbaren Marktdaten",
  "tutti_title_de": "Ansprechender Titel OHNE Preis (Marke + Modell + Merkmal)",
  "tutti_body_de": "Storytelling-Beschreibung mit Hongkong-Umzug, Produktstory, Zustand und emotionaler Verbindung. Preis am Ende erwähnen."
}

Verwende die Bilder als Hauptinformation und den Text als zusätzlichen Kontext. Nutze Web-Suche für aktuelle Marktpreise. Schaffe emotionale Verbindung ohne aufdringlich zu sein.`;

    // Prepare the messages for OpenAI
    const userContent: any[] = [
      {
        type: "text",
        text: text ? `Zusätzliche Informationen: ${text}` : "Erstelle eine Produktbeschreibung basierend auf den Bildern."
      }
    ];

    // Add images to the content (using base64 for reliability)
    for (const imageUrl of image_urls.slice(0, 4)) { // Limit to 4 images for API
      try {
        // Extract filename from URL
        const filename = imageUrl.split('/').pop();
        if (!filename) continue;

        const filepath = `/tmp/${filename}`;
        console.log(`📖 Converting image to base64: ${filepath}`);

        // Read image file and convert to base64
        const imageBuffer = readFileSync(filepath);
        const base64Image = imageBuffer.toString('base64');

        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/webp;base64,${base64Image}`,
            detail: "high"
          }
        });

        console.log(`✅ Added base64 image: ${filename} (${imageBuffer.length} bytes)`);
      } catch (err) {
        console.error(`❌ Failed to process image ${imageUrl}:`, err);
      }
    }

    const openai = await getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for reliable production performance
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
    });

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

    // Validate and clean up the proposal
    const validatedCategories = ["furniture", "appliances", "toys", "electronics", "decor", "kitchen", "sports", "outdoor", "kids_furniture", "other"];
    const validatedConditions = ["like new", "very good", "good", "fair"];

    // Ensure category is valid
    if (!validatedCategories.includes(aiProposal.category)) {
      aiProposal.category = "other";
    }

    // Ensure condition is valid
    if (!validatedConditions.includes(aiProposal.condition)) {
      aiProposal.condition = "good";
    }

    // Round price to nearest 5 CHF and format
    const price = parseFloat(aiProposal.price_chf || "0");
    const roundedPrice = Math.round(price / 5) * 5;
    aiProposal.price_chf = roundedPrice.toFixed(2);

    // Set cover image and gallery
    aiProposal.cover_image_url = image_urls[0];
    aiProposal.gallery_image_urls = image_urls;

    // Ensure cover image is in gallery
    if (!aiProposal.gallery_image_urls.includes(aiProposal.cover_image_url)) {
      aiProposal.gallery_image_urls = [aiProposal.cover_image_url, ...aiProposal.gallery_image_urls];
    }

    // Validate with Zod schema
    const validatedProposal = agentProposalSchema.parse(aiProposal);

    res.json({
      success: true,
      proposal: validatedProposal
    });

  } catch (error: any) {
    console.error("AI agent error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: "Invalid AI proposal format",
        details: error.errors
      });
    }
    res.status(500).json({ error: "AI processing failed", details: String(error) });
  }
}