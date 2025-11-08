// Pickup times endpoint - specific dates for November 2025
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

    // Specific pickup dates for November 2025 (last few days before move)
    const pickupDates = [
      // Saturday, November 8th - 11:00 to 14:00
      { date: '2025-11-08', slots: ['11:00-12:00', '12:00-13:00', '13:00-14:00'], day: 'Samstag' },

      // Sunday, November 9th - 13:00 to 18:00
      { date: '2025-11-09', slots: ['13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'], day: 'Sonntag' },

      // Monday, November 10th - 15:00 to 17:00
      { date: '2025-11-10', slots: ['15:00-16:00', '16:00-17:00'], day: 'Montag' },

      // Wednesday, November 12th - whole day (9:00 to 20:00)
      { date: '2025-11-12', slots: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'], day: 'Mittwoch' },
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
            display: `${day}, ${dayNum}. Nov, ${slot} Uhr`,
            value: pickupTime.toISOString(),
          });
        }
      });
    });

    // Add WhatsApp coordination option as a special entry
    availableTimes.push({
      datetime: 'custom',
      display: '📱 Anderen Termin per WhatsApp (076 628 64 06)',
      value: 'whatsapp',
      note: 'Kontaktieren Sie uns per WhatsApp für individuelle Terminvereinbarung'
    });

    res.status(200).json(availableTimes);
  } catch (error) {
    console.error('Error fetching pickup times:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Abholzeiten' });
  }
}
