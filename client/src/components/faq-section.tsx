import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Faq } from "@shared/schema";

interface FaqSectionProps {
  faqs: Faq[];
}

export default function FaqSection({ faqs }: FaqSectionProps) {
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set());

  const toggleFaq = (faqId: string) => {
    const newOpenFaqs = new Set(openFaqs);
    if (newOpenFaqs.has(faqId)) {
      newOpenFaqs.delete(faqId);
    } else {
      newOpenFaqs.add(faqId);
    }
    setOpenFaqs(newOpenFaqs);
  };

  return (
    <section className="mb-8" data-testid="faq-section">
      <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="faq-heading">
        Häufig gestellte Fragen
      </h2>
      
      <div className="space-y-3">
        {faqs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4" data-testid="no-faqs-message">
            Keine FAQs verfügbar.
          </p>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="bg-card rounded-lg border border-border" data-testid={`faq-item-${faq.id}`}>
              <Button
                variant="ghost"
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-4 text-left font-medium text-foreground flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors min-h-[44px]"
                data-testid={`faq-question-${faq.id}`}
              >
                <span>{faq.question}</span>
                {openFaqs.has(faq.id) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              {openFaqs.has(faq.id) && (
                <div className="px-4 pb-4 text-sm text-muted-foreground" data-testid={`faq-answer-${faq.id}`}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
