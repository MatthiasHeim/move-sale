// Simple FAQs endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Return basic FAQs for now
    const faqs = [
      {
        id: "1",
        question: "Wie kann ich Möbel reservieren?",
        answer: "Klicken Sie einfach auf das gewünschte Möbelstück und wählen Sie einen Abholtermin aus."
      },
      {
        id: "2",
        question: "Wann kann ich die Möbel abholen?",
        answer: "Abholung ist möglich: Mo-Fr 17:00-19:00 Uhr, Sa-So 10:00-16:00 Uhr."
      },
      {
        id: "3",
        question: "Sind die Preise verhandelbar?",
        answer: "Die Preise sind fair kalkuliert für einen schnellen Verkauf vor unserem Umzug."
      }
    ];

    res.json(faqs);
  } catch (error) {
    console.error('FAQs API error:', error);
    res.status(500).json({
      error: "Failed to load FAQs",
      details: error.message
    });
  }
}