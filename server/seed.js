import { run, count } from './db.js';

export function seedDatabase() {
  // Seed announcements
  if (count('announcements_kiosk') === 0) {
    run('INSERT INTO announcements_kiosk (title, content, type, date, priority) VALUES (?, ?, ?, ?, ?)',
      ['New Study Rooms Available', 'Book your private study space on Level 3. Now with whiteboard and charging stations.', 'info', '2024-01-15', 'high']);
    run('INSERT INTO announcements_kiosk (title, content, type, date, priority) VALUES (?, ?, ?, ?, ?)',
      ['Digital Archive Workshop', 'Learn to access our digital collections. Every Friday at 2 PM in the Computer Lab.', 'event', '2024-01-20', 'medium']);
    console.log('Seeded announcements_kiosk');
  }

  // Seed FAQs
  if (count('faqs_kiosk') === 0) {
    run('INSERT INTO faqs_kiosk (category, question, answer) VALUES (?, ?, ?)',
      ['General', 'What are the library opening hours?', 'Monday-Friday: 7:00 AM - 11:00 PM, Saturday-Sunday: 9:00 AM - 9:00 PM. Extended hours during exam periods.']);
    run('INSERT INTO faqs_kiosk (category, question, answer) VALUES (?, ?, ?)',
      ['Technology', 'How do I connect to the WiFi?', 'Connect to "University-WiFi" network using your student ID and password. Guest access available at the front desk.']);
    run('INSERT INTO faqs_kiosk (category, question, answer) VALUES (?, ?, ?)',
      ['Services', 'How do I book a study room?', 'Use the online booking system or visit the front desk. Rooms can be booked up to 7 days in advance.']);
    run('INSERT INTO faqs_kiosk (category, question, answer) VALUES (?, ?, ?)',
      ['Technology', 'Where can I print documents?', 'Printing stations are available on each floor. Use your student card or purchase a print card at the front desk.']);
    console.log('Seeded faqs_kiosk');
  }

  // Seed QR links
  if (count('qr_links_kiosk') === 0) {
    run('INSERT INTO qr_links_kiosk (name, url, description) VALUES (?, ?, ?)',
      ['Library Catalog', 'https://library.university.edu/catalog', 'Search our book and digital collections']);
    run('INSERT INTO qr_links_kiosk (name, url, description) VALUES (?, ?, ?)',
      ['Study Room Booking', 'https://library.university.edu/booking', 'Reserve your study space online']);
    run('INSERT INTO qr_links_kiosk (name, url, description) VALUES (?, ?, ?)',
      ['Digital Resources', 'https://library.university.edu/digital', 'Access databases and e-books']);
    console.log('Seeded qr_links_kiosk');
  }

  // Seed floors
  if (count('library_floors_kiosk') === 0) {
    run('INSERT INTO library_floors_kiosk (id, name) VALUES (?, ?)', [1, 'Ground Floor']);
    run('INSERT INTO library_floors_kiosk (id, name) VALUES (?, ?)', [2, 'Level 2']);
    run('INSERT INTO library_floors_kiosk (id, name) VALUES (?, ?)', [3, 'Level 3']);
    console.log('Seeded library_floors_kiosk');
  }

  // Seed locations
  if (count('library_locations_kiosk') === 0) {
    run('INSERT INTO library_locations_kiosk (location_id, floor_id, name, type, x_position, y_position, directions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['entrance', 1, 'Main Entrance', 'entrance', 50, 80, 'Located at the front of the building.']);
    run('INSERT INTO library_locations_kiosk (location_id, floor_id, name, type, x_position, y_position, directions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['info-desk', 1, 'Information Desk', 'service', 30, 60, 'From the main entrance, walk straight ahead for 20 meters. The Information Desk will be on your left.']);
    console.log('Seeded library_locations_kiosk');
  }

  // Seed settings
  if (count('kiosk_settings') === 0) {
    const now = new Date().toISOString();
    run('INSERT INTO kiosk_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)',
      ['accessibility', JSON.stringify({ highContrast: false, largeText: false, audioEnabled: false }), now]);
    run('INSERT INTO kiosk_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)',
      ['general', JSON.stringify({ idleTimeout: 300000, autoResetHome: true, kioskMode: true, language: 'en' }), now]);
    console.log('Seeded kiosk_settings');
  }

  console.log('Database seeding complete.');
}
