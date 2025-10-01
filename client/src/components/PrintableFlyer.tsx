import { QRCodeSVG } from 'qrcode.react';

type FlyerTheme = 'furniture' | 'baby' | 'household';

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
      { name: 'Esstisch mit 4 Stühlen', price: '300 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882797343-zotkawj75h.webp' },
      { name: 'Holzregal 3 Ablagen', price: '45 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1758381059472-5dxdbvc13e7.webp' },
      { name: 'Gartenmöbel-Set', price: '250 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1758052561887-qa89o7jhisl.webp' },
      { name: 'Grosse Birkenfeige', price: '65 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759301231355-c51891dea4727f42.webp' },
      { name: 'Kaffeepflanze', price: '45 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/uploads/product-1759299790054-2b323f2af2dbf3f6.webp' },
    ]
  },
  baby: {
    title: 'Baby & Kinder',
    subtitle: 'Liebevoll genutzte Artikel für die Kleinen',
    accentColor: '#f59e0b', // amber
    products: [
      { name: 'Stokke Xplory Kinderwagen', price: '200 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757881077280-46cvhpc9pb1.webp' },
      { name: 'Weiße Kinderrutsche', price: '100 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757962503143-1hmsh6gb688.webp' },
      { name: 'Tuki Learning Tower', price: '90 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882720124-i2ol40gzmfk.webp' },
      { name: 'Babywippe Moji grau', price: '70 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757881710224-jp7euu2fkp.webp' },
      { name: 'IKEA Trofast Regal', price: '45 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1758381110019-gf63ezyg1xb.webp' },
      { name: 'Charlie & Lily Regal', price: '45 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1758381312384-4toknbcl7g.webp' },
    ]
  },
  household: {
    title: 'Haushalt & Technik',
    subtitle: 'Praktische Helfer für den Alltag',
    accentColor: '#3b82f6', // blue
    products: [
      { name: 'iRobot Roomba', price: '350 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882856127-sdnyrq67xch.webp' },
      { name: 'Salta Trampolin', price: '250 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1758050692245-zxwn2nhol4s.webp' },
      { name: 'iRobot Braava Wischroboter', price: '150 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882246761-837k2gztfyn.webp' },
      { name: 'Tefal OptiGrill', price: '85 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757882373549-dmutv1zp2f.webp' },
      { name: 'Kleintierkäfig', price: '200 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757944754633-jj0c6q9k2hj.webp' },
      { name: 'AniOne Kleintierstall', price: '40 CHF', imageUrl: 'https://skyttkazfonfzhbgtbus.supabase.co/storage/v1/object/public/product-images/product-1757878746837-wglu7xaijw.webp' },
    ]
  }
};

interface PrintableFlyerProps {
  theme: FlyerTheme;
}

export default function PrintableFlyer({ theme }: PrintableFlyerProps) {
  const config = themeConfig[theme];

  return (
    <div className="print-flyer-container">
      {/* A5 Page */}
      <div className="flyer-page" style={{ '--accent-color': config.accentColor } as React.CSSProperties}>
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
                <p className="flyer-product-price">{product.price}</p>
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
              • Abholung in Müllheim
            </p>
          </div>
          <div className="flyer-cta-qr">
            <QRCodeSVG
              value="https://seup.ch"
              size={120}
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
        }

        .flyer-family-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 35%;
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
          gap: 2.5mm;
          margin-bottom: 3mm;
          flex: 1;
        }

        .flyer-product {
          display: flex;
          flex-direction: column;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .flyer-product-image-wrapper {
          width: 100%;
          height: 25mm;
          overflow: hidden;
          background: #f9fafb;
        }

        .flyer-product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flyer-product-info {
          padding: 2mm;
          background: white;
        }

        .flyer-product-name {
          font-size: 7pt;
          font-weight: 600;
          margin: 0 0 1mm 0;
          color: #111827;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .flyer-product-price {
          font-size: 9pt;
          font-weight: 700;
          margin: 0;
          color: var(--accent-color);
        }

        .flyer-cta {
          display: flex;
          gap: 4mm;
          padding: 3mm;
          background: #f9fafb;
          border-radius: 2mm;
          border: 2px solid var(--accent-color);
          margin-bottom: 2mm;
        }

        .flyer-cta-left {
          flex: 1;
        }

        .flyer-cta-title {
          font-size: 10pt;
          font-weight: 700;
          margin: 0 0 1mm 0;
          color: #111827;
        }

        .flyer-cta-url {
          font-size: 16pt;
          font-weight: 800;
          margin: 0 0 2mm 0;
          color: var(--accent-color);
        }

        .flyer-cta-details {
          font-size: 7.5pt;
          color: #4b5563;
          margin: 0;
          line-height: 1.5;
        }

        .flyer-cta-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1mm;
        }

        .flyer-cta-qr-label {
          font-size: 6.5pt;
          color: #6b7280;
          margin: 0;
          text-align: center;
        }

        .flyer-whatsapp {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          padding: 2.5mm;
          border-radius: 2mm;
          text-align: center;
        }

        .flyer-whatsapp-text {
          color: white;
          font-size: 9pt;
          margin: 0;
          line-height: 1.5;
        }

        .flyer-whatsapp-text strong {
          font-size: 10pt;
        }

        .flyer-whatsapp-number {
          font-size: 14pt;
          font-weight: 800;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
