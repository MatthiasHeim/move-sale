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
      { name: 'IKEA Ecksofa Grau', price: '350 CHF', imageUrl: '/uploads/prod_1759413319944_770db51e-0.webp' },
      { name: 'Esstisch mit 4 Stühlen', price: '300 CHF', imageUrl: '/uploads/a827f59e-4669-42d5-99ab-3dd81a75ab31-0.webp' },
      { name: 'Graues 2-Sitzer-Sofa', price: '150 CHF', imageUrl: '/uploads/prod_1759302486557_789128c1-0.webp' },
      { name: 'Gartenmöbel-Set', price: '250 CHF', imageUrl: '/uploads/38245247-3327-435f-856a-155524c94dff-0.webp' },
      { name: 'Grosse Birkenfeige', price: '65 CHF', imageUrl: '/uploads/prod_1759301502508_0baf3a3d-0.webp' },
      { name: 'Kaffeepflanze', price: '45 CHF', imageUrl: '/uploads/prod_1759299834072_cb4fa94d-0.webp' },
    ]
  },
  baby: {
    title: 'Baby & Kinder',
    subtitle: 'Liebevoll genutzte Artikel für die Kleinen',
    accentColor: '#f59e0b', // amber
    products: [
      { name: 'Moji Hochstuhl Set', price: '220 CHF', imageUrl: '/uploads/prod_1759336051072_82846420-0.webp' },
      { name: 'Stokke Tripp Trapp', price: '150 CHF', imageUrl: '/uploads/prod_1759336425636_72892795-0.webp' },
      { name: 'Medela Milchpumpe', price: '120 CHF', imageUrl: '/uploads/prod_1759312799661_4a158286-0.webp' },
      { name: 'Weiße Kinderrutsche', price: '100 CHF', imageUrl: '/uploads/98ca3d5b-8571-43b9-8655-c16515b54d67-0.webp' },
      { name: 'Holz-Spielküche', price: '85 CHF', imageUrl: '/uploads/prod_1759338510696_c2339bc5-0.webp' },
      { name: 'Lovevery Spielset', price: '80 CHF', imageUrl: '/uploads/prod_1759305158389_16c93cd1-0.webp' },
    ]
  },
  household: {
    title: 'Haushalt & Technik',
    subtitle: 'Praktische Helfer für den Alltag',
    accentColor: '#3b82f6', // blue
    products: [
      { name: 'DJI Mavic 2 Drohne', price: '550 CHF', imageUrl: '/uploads/prod_1759412764502_1519ae5d-0.webp' },
      { name: 'iRobot Roomba', price: '350 CHF', imageUrl: '/uploads/c4977bc4-bd51-4ace-a09e-e15dc2f888fd-0.webp' },
      { name: 'Fotostudio-Set Godox', price: '250 CHF', imageUrl: '/uploads/prod_1759413319944_770db51e-0.webp' },
      { name: 'Salta Trampolin', price: '250 CHF', imageUrl: '/uploads/3ed73c20-88aa-4011-b31e-3c4d407f304b-0.webp' },
      { name: 'Braava M6 Wischroboter', price: '120 CHF', imageUrl: '/uploads/prod_1759308148198_9fa6e5f5-0.webp' },
      { name: 'Meerschweinchen-Gehege', price: '120 CHF', imageUrl: '/uploads/prod_1759307971448_a3a0a80a-0.webp' },
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
