// Pickup times endpoint - specific dates for October 2025
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const now = new Date();
    const availableTimes: Array<{
      datetime: string;
      display: string;
      value: string;
      note?: string;
    }> = [];

    // Specific pickup dates for October 2025
    const pickupDates = [
      // Friday, October 3rd - evening only (last Friday available)
      { date: '2025-10-03', slots: ['17:00-18:00', '18:00-19:00'], day: 'Freitag' },

      // Saturday, October 4th
      { date: '2025-10-04', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Samstag' },

      // Sunday, October 5th
      { date: '2025-10-05', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Sonntag' },

      // Saturday, October 11th
      { date: '2025-10-11', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Samstag' },

      // Sunday, October 12th
      { date: '2025-10-12', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Sonntag' },

      // Saturday, October 18th
      { date: '2025-10-18', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Samstag' },

      // Sunday, October 19th
      { date: '2025-10-19', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Sonntag' },

      // Saturday, October 25th
      { date: '2025-10-25', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Samstag' },

      // Sunday, October 26th
      { date: '2025-10-26', slots: ['11:00-12:00', '17:00-18:00', '18:00-19:00'], day: 'Sonntag' },
    ];

    // Generate time slots for each date
    pickupDates.forEach(({ date, slots, day }) => {
      const [year, month, dayNum] = date.split('-').map(Number);

      slots.forEach(slot => {
        const [startTime] = slot.split('-');
        const [hours, minutes] = startTime.split(':').map(Number);

        const pickupTime = new Date(year, month - 1, dayNum, hours, minutes, 0, 0);

        // Only include future times
        if (pickupTime > now) {
          availableTimes.push({
            datetime: pickupTime.toISOString(),
            display: `${day}, ${dayNum}. Okt, ${slot} Uhr`,
            value: pickupTime.toISOString(),
          });
        }
      });
    });

    // Add WhatsApp coordination option as a special entry
    availableTimes.push({
      datetime: 'custom',
      display: '📱 Anderen Termin per WhatsApp vereinbaren (076 628 64 06)',
      value: 'whatsapp',
      note: 'Kontaktieren Sie uns per WhatsApp für individuelle Terminvereinbarung'
    });

    res.status(200).json(availableTimes);
  } catch (error) {
    console.error('Error fetching pickup times:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Abholzeiten' });
  }
}
