import { useState } from 'react';
import PrintableFlyer from '@/components/PrintableFlyer';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

type FlyerTheme = 'furniture' | 'baby' | 'household';

export default function FlyerPrintPage() {
  const [selectedThemes, setSelectedThemes] = useState<FlyerTheme[]>(['furniture']);

  const themes: { value: FlyerTheme; label: string }[] = [
    { value: 'furniture', label: 'Möbel & Wohnen' },
    { value: 'baby', label: 'Baby & Kinder' },
    { value: 'household', label: 'Haushalt & Technik' },
  ];

  const toggleTheme = (theme: FlyerTheme) => {
    setSelectedThemes((current) =>
      current.includes(theme)
        ? current.filter((t) => t !== theme)
        : [...current, theme]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Screen-only controls */}
      <div className="print:hidden bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flyer Druckansicht</h1>
              <p className="text-sm text-gray-600 mt-1">
                Wähle die Themen aus, die du drucken möchtest
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="lg">
                <Printer className="w-4 h-4 mr-2" />
                Drucken
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => toggleTheme(theme.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedThemes.includes(theme.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Drucktipps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stelle sicher, dass "Hintergrundgrafiken drucken" aktiviert ist</li>
              <li>• Wähle A5-Format oder drucke 2 Flyer pro A4-Seite</li>
              <li>• Für beste Qualität: 300 DPI auf gutem Papier (z.B. 160g/m²)</li>
              <li>• Randlos drucken für professionelles Aussehen (optional)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print content */}
      <div className="print:p-0 py-8">
        {selectedThemes.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center py-12 print:hidden">
            <p className="text-gray-500">
              Wähle mindestens ein Thema aus, um die Flyer anzuzeigen
            </p>
          </div>
        ) : (
          selectedThemes.map((theme) => (
            <PrintableFlyer key={theme} theme={theme} />
          ))
        )}
      </div>
    </div>
  );
}
