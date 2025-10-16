import { QRCodeSVG } from 'qrcode.react';

type FlyerTheme = 'furniture' | 'baby' | 'household' | 'lifestyle';

interface Product {
  name: string;
  price: string;
  imageUrl: string;
}

const themeConfig: Record<FlyerTheme, {
  title: string;
  subtitle: string;
  products: Product[];
  accentColor: string;
}> = {
  furniture: {
    title: 'Möbel & Wohnen',
    subtitle: 'Hochwertige Möbel und Pflanzen für Ihr Zuhause',
    accentColor: '#10b981', // emerald
    products: [
      { name: 'IKEA Ecksofa Grau', price: '350 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1758026215170-31njocg97w4.webp' },
      { name: 'Grosses weisses Kallax Regal', price: '180 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1760452764148-bb7a3d49b0ee1c6e.webp' },
      { name: 'Graues 2-Sitzer-Sofa', price: '150 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759302326045-790414de97fb1309.webp' },
      { name: 'Grosse Birkenfeige', price: '65 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759301231355-c51891dea4727f42.webp' },
      { name: 'Kaffeepflanze', price: '45 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759299790054-2b323f2af2dbf3f6.webp' },
      { name: 'Hölzerner Laufgitter', price: '40 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759305172076-93face335f499d6f.webp' },
    ]
  },
  baby: {
    title: 'Baby & Kinder',
    subtitle: 'Liebevoll genutzte Artikel für die Kleinen',
    accentColor: '#f59e0b', // amber
    products: [
      { name: 'Medela Freestyle Milchpumpe', price: '120 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759311748807-2e9916c23d4ed586.webp' },
      { name: 'Ergobaby Babytrage', price: '65 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759304818218-270ad9ef9a61f6f9.webp' },
      { name: 'Holz-Spielküche', price: '60 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759338422746-2ddc775dcb109aa6.webp' },
      { name: 'Schwangerschaftskissen', price: '35 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759317624214-467a4bcadf20e27a.webp' },
      { name: 'Baby Einstein Drums', price: '25 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759311695143-72b1df8ba69da9d9.webp' },
      { name: 'Baby-Schlafsack', price: '20 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759304876151-5cd389cab4f5e9c6.webp' },
    ]
  },
  household: {
    title: 'Haushalt & Technik',
    subtitle: 'Praktische Helfer für den Alltag',
    accentColor: '#3b82f6', // blue
    products: [
      { name: 'iRobot Roomba Saugroboter', price: '350 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882856127-sdnyrq67xch.webp' },
      { name: 'DJI Mavic 2 Drohne', price: '290 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759412629256-8e37a0193a5fde82.webp' },
      { name: 'Qeridoo Fahrradanhänger', price: '250 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1760452704110-8dcaf83bdfd86e00.webp' },
      { name: 'Braava M6 Wischroboter', price: '120 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759308027433-cb5e0ae02d313007.webp' },
      { name: 'Tefal OptiGrill', price: '85 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882373549-dmutv1zp2f.webp' },
      { name: 'Nespresso Vertuo', price: '75 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759329109464-13539b38f15e81ed.webp' },
    ]
  },
  lifestyle: {
    title: 'Deko & Lifestyle',
    subtitle: 'Schöne Dinge für ein gemütliches Zuhause',
    accentColor: '#ec4899', // pink
    products: [
      { name: 'Cricut Maker 3 Set', price: '500 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759657998251-fc4fdd2217c96a25.webp' },
      { name: 'Ast-Deckenlampe mit Efeu', price: '120 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759657940923-605023abc8f2c5b0.webp' },
      { name: 'Grosse Birkenfeige', price: '65 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759301231355-c51891dea4727f42.webp' },
      { name: 'Astronaut Holzlampe', price: '60 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759338883406-b587dafee36482f3.webp' },
      { name: 'Koala Nachtlampe', price: '60 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759338948917-9b772d19e92c8658.webp' },
      { name: 'Kaffeepflanze', price: '45 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759299790054-2b323f2af2dbf3f6.webp' },
    ]
  }
};

interface PrintableFlyerProps {
  theme: FlyerTheme;
}

export default function PrintableFlyer({ theme }: PrintableFlyerProps) {
  const config = themeConfig[theme];

  // Generate UTM-tracked URL for QR code
  // Use 'tech' for household theme for alternate tracking
  const utmCampaign = theme === 'household' ? 'tech' : theme;
  const qrUrl = `https://seup.ch?utm_source=flyer&utm_medium=qr&utm_campaign=${utmCampaign}`;

  return (
    <div className="print-flyer-container">
      {/* A5 Page */}
      <div className="flyer-page" style={{ '--accent-color': config.accentColor } as React.CSSProperties}>
        {/* Discount Sticker */}
        <div className="discount-sticker">
          10% Rabatt ab 2 Artikeln
        </div>

        {/* Header Section */}
        <div className="flyer-header">
          <div className="flyer-header-content">
            <div className="flyer-header-text">
              <div className="flyer-badge">Umzugsverkauf</div>
              <h1 className="flyer-title">Wir ziehen nach Hong Kong!</h1>
              <p className="flyer-intro">
                Unsere Familie zieht von Müllheim nach Asien und muss sich schweren Herzens
                von unserem gesamten Haushalt trennen. Alle Artikel sind gepflegt und in
                gutem Zustand – perfekt für ein neues Zuhause!
              </p>
            </div>
            <div className="flyer-family-photo">
              <img src="/family-hk.png" alt="Familie vor Hong Kong Skyline" />
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="flyer-theme">
          <h2 className="flyer-theme-title">{config.title}</h2>
          <p className="flyer-theme-subtitle">{config.subtitle}</p>
        </div>

        {/* Product Grid */}
        <div className="flyer-products">
          {config.products.map((product, idx) => (
            <div key={idx} className="flyer-product">
              <div className="flyer-product-image-wrapper">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="flyer-product-image"
                />
              </div>
              <div className="flyer-product-info">
                <p className="flyer-product-name">{product.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="flyer-cta">
          <div className="flyer-cta-left">
            <h3 className="flyer-cta-title">Alle Artikel online ansehen:</h3>
            <p className="flyer-cta-url">seup.ch</p>
            <p className="flyer-cta-details">
              • Über 50 weitere Artikel<br />
              • Direkt reservieren<br />
              • Abholung: Storenberg 9a, Müllheim
            </p>
          </div>
          <div className="flyer-cta-qr">
            <QRCodeSVG
              value={qrUrl}
              size={140}
              level="M"
              includeMargin={false}
            />
            <p className="flyer-cta-qr-label">QR-Code scannen</p>
          </div>
        </div>

        {/* WhatsApp Contact */}
        <div className="flyer-whatsapp">
          <p className="flyer-whatsapp-text">
            📱 <strong>Fragen oder Termin vereinbaren?</strong><br />
            WhatsApp: <span className="flyer-whatsapp-number">076 628 64 06</span>
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A5;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          html, body {
            width: 148mm;
            height: 210mm;
          }

          .print-flyer-container {
            page-break-after: always;
            margin: 0;
            padding: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }

        @media screen {
          .print-flyer-container {
            display: flex;
            justify-content: center;
            padding: 2rem;
            background: #f3f4f6;
            min-height: 100vh;
          }
        }

        .flyer-page {
          width: 148mm;
          height: 210mm;
          background: white;
          padding: 8mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          position: relative;
        }

        .flyer-header {
          margin-bottom: 3mm;
        }

        .flyer-header-content {
          display: flex;
          gap: 4mm;
          align-items: center;
        }

        .flyer-header-text {
          flex: 1;
        }

        .flyer-family-photo {
          width: 22mm;
          height: 22mm;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid var(--accent-color);
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          background: white;
        }

        @media print {
          .flyer-family-photo {
            box-shadow: none !important;
            background: white !important;
          }
        }

        .flyer-family-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 35%;
          background: white;
        }

        @media print {
          .flyer-family-photo img {
            background: white !important;
          }
        }

        .flyer-badge {
          display: inline-block;
          background: var(--accent-color);
          color: white;
          padding: 2mm 4mm;
          border-radius: 4mm;
          font-size: 9pt;
          font-weight: 600;
          margin-bottom: 2mm;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .flyer-title {
          font-size: 16pt;
          font-weight: 800;
          margin: 0 0 2mm 0;
          color: #111827;
          line-height: 1.2;
        }

        .flyer-intro {
          font-size: 7.5pt;
          color: #4b5563;
          margin: 0;
          line-height: 1.4;
        }

        .flyer-theme {
          border-top: 2px solid var(--accent-color);
          padding-top: 2mm;
          margin-bottom: 2mm;
        }

        .flyer-theme-title {
          font-size: 14pt;
          font-weight: 700;
          margin: 0 0 1mm 0;
          color: #111827;
        }

        .flyer-theme-subtitle {
          font-size: 8pt;
          color: #6b7280;
          margin: 0;
          font-style: italic;
        }

        .flyer-products {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2mm;
          margin-bottom: 2.5mm;
          align-content: start;
        }

        .flyer-product {
          display: flex;
          flex-direction: column;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          height: fit-content;
        }

        .flyer-product-image-wrapper {
          width: 100%;
          height: 22mm;
          overflow: hidden;
          background: #f9fafb;
        }

        .flyer-product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flyer-product-info {
          padding: 1mm;
          background: white;
          text-align: center;
          height: auto;
        }

        .flyer-product-name {
          font-size: 7.5pt;
          font-weight: 600;
          margin: 0;
          color: #111827;
          line-height: 1.15;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          width: 100%;
        }

        .flyer-cta {
          display: flex;
          gap: 5mm;
          padding: 4mm;
          background: #f9fafb;
          border-radius: 2mm;
          border: 2px solid var(--accent-color);
          margin-bottom: 2mm;
        }

        .flyer-cta-left {
          flex: 1;
        }

        .flyer-cta-title {
          font-size: 11pt;
          font-weight: 700;
          margin: 0 0 1.5mm 0;
          color: #111827;
        }

        .flyer-cta-url {
          font-size: 18pt;
          font-weight: 800;
          margin: 0 0 2.5mm 0;
          color: var(--accent-color);
        }

        .flyer-cta-details {
          font-size: 8.5pt;
          color: #4b5563;
          margin: 0;
          line-height: 1.6;
        }

        .flyer-cta-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5mm;
        }

        .flyer-cta-qr-label {
          font-size: 7.5pt;
          color: #6b7280;
          margin: 0;
          text-align: center;
          font-weight: 600;
        }

        .flyer-whatsapp {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          padding: 3.5mm;
          border-radius: 2mm;
          text-align: center;
        }

        .flyer-whatsapp-text {
          color: white;
          font-size: 10pt;
          margin: 0;
          line-height: 1.6;
        }

        .flyer-whatsapp-text strong {
          font-size: 11pt;
        }

        .flyer-whatsapp-number {
          font-size: 16pt;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .discount-sticker {
          position: absolute;
          top: 5mm;
          right: 5mm;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          padding: 3mm 5mm;
          border-radius: 50px;
          font-size: 9pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transform: rotate(3deg);
          z-index: 10;
          border: 2px solid white;
        }

        @media print {
          .discount-sticker {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
