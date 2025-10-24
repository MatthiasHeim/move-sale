import { useState } from 'react';
import PrintableFlyer from '@/components/PrintableFlyer';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

type FlyerTheme = 'furniture' | 'baby' | 'household' | 'lifestyle';

export default function FlyerPrintPage() {
  const [selectedThemes, setSelectedThemes] = useState<FlyerTheme[]>(['furniture']);
  const [layoutMode, setLayoutMode] = useState<'a5' | 'a4-2up'>('a5');

  const themes: { value: FlyerTheme; label: string }[] = [
    { value: 'furniture', label: 'Möbel & Wohnen' },
    { value: 'baby', label: 'Baby & Kinder' },
    { value: 'household', label: 'Haushalt & Technik' },
    { value: 'lifestyle', label: 'Deko & Lifestyle' },
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

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Drucklayout:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setLayoutMode('a5')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  layoutMode === 'a5'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-green-700 hover:bg-green-100 border border-green-300'
                }`}
              >
                A5 (1 Flyer pro Seite)
              </button>
              <button
                onClick={() => setLayoutMode('a4-2up')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  layoutMode === 'a4-2up'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-green-700 hover:bg-green-100 border border-green-300'
                }`}
              >
                A4 (2 Flyer pro Seite)
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Drucktipps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stelle sicher, dass "Hintergrundgrafiken drucken" aktiviert ist</li>
              <li>• {layoutMode === 'a5' ? 'Wähle A5-Format im Druckdialog' : 'Wähle A4-Format im Druckdialog'}</li>
              <li>• Für beste Qualität: 300 DPI auf gutem Papier (z.B. 160g/m²)</li>
              <li>• {layoutMode === 'a5' ? 'Randlos drucken für professionelles Aussehen (optional)' : 'Mit oder ohne Rand drucken - Layout passt sich an'}</li>
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
        ) : layoutMode === 'a4-2up' ? (
          // A4 2-up layout: pair flyers together
          <>
            {Array.from({ length: Math.ceil(selectedThemes.length / 2) }, (_, i) => {
              const theme1 = selectedThemes[i * 2];
              const theme2 = selectedThemes[i * 2 + 1];
              return (
                <div key={`pair-${i}`} className="a4-page-container">
                  <PrintableFlyer theme={theme1} />
                  {theme2 && <PrintableFlyer theme={theme2} />}
                </div>
              );
            })}
            <style>{`
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 0;
                }
                .a4-page-container {
                  display: flex;
                  width: 297mm;
                  height: 210mm;
                  page-break-after: always;
                }
                .a4-page-container > div {
                  flex: 1;
                }
              }
              @media screen {
                .a4-page-container {
                  display: flex;
                  gap: 2rem;
                  margin-bottom: 2rem;
                  justify-content: center;
                }
              }
            `}</style>
          </>
        ) : (
          selectedThemes.map((theme) => (
            <PrintableFlyer key={theme} theme={theme} />
          ))
        )}
      </div>
    </div>
  );
}
