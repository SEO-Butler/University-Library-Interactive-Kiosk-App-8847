// Sample content so a fresh kiosk has something to show. Staff replace it in the CMS.
const announcements = [
  { title: 'Extended Opening Hours During Exams', content: 'The library stays open until midnight from Monday to Friday during the examination period. Group study rooms can be booked at the information desk.', type: 'info', priority: 'high', daysFromNow: 0 },
  { title: 'Research Skills Workshop', content: 'Learn how to search academic databases, manage references and avoid plagiarism. Open to all students. Meet in Training Room 2 on the first floor.', type: 'event', priority: 'medium', daysFromNow: 7 },
  { title: 'New Study Pods Available', content: 'Six new individual study pods with power sockets and adjustable lighting are now available on the second floor, next to the periodicals collection.', type: 'info', priority: 'medium', daysFromNow: -3 },
  { title: 'Book Club: Monthly Meeting', content: 'This month we are reading a contemporary Namibian novel. Everyone is welcome, whether you have finished the book or not. Refreshments provided.', type: 'event', priority: 'low', daysFromNow: 14 }
];

const faqs = [
  { category: 'General', question: 'What are the library opening hours?', answer: 'The library is open from 7:00 AM to 11:00 PM on weekdays and from 9:00 AM to 9:00 PM at weekends. Hours change during holidays; check the announcements screen.', sort_order: 1 },
  { category: 'General', question: 'How many books can I borrow?', answer: 'Undergraduate students may borrow up to 6 items for 14 days. Postgraduate students and staff may borrow up to 10 items for 28 days. Items can be renewed twice online unless another reader has reserved them.', sort_order: 2 },
  { category: 'Services', question: 'How do I book a group study room?', answer: 'Group study rooms can be booked up to 7 days in advance through the library website or at the information desk. Bookings are for a maximum of 3 hours per group per day.', sort_order: 1 },
  { category: 'Services', question: 'Can I print, copy and scan in the library?', answer: 'Yes. Printers, copiers and scanners are available on every floor. Printing is charged to your student account; scanning to email is free.', sort_order: 2 },
  { category: 'Technology', question: 'How do I connect to the WiFi?', answer: 'Select the university WiFi network and sign in with your student or staff credentials. Visitors can request a day pass at the information desk.', sort_order: 1 },
  { category: 'Technology', question: 'Are laptops available to borrow?', answer: 'Laptops can be borrowed for use inside the library for up to 4 hours from the technology desk on the first floor. A valid student card is required.', sort_order: 2 },
  { category: 'Policies', question: 'Is food allowed in the library?', answer: 'Drinks in covered containers are allowed everywhere except the special collections room. Food may only be eaten in the café area on the ground floor.', sort_order: 1 },
  { category: 'Policies', question: 'What happens if I return a book late?', answer: 'Overdue items are charged per day. Borrowing is suspended while fines are outstanding. Fines can be paid at the circulation desk.', sort_order: 2 }
];

const qrLinks = [
  { name: 'Library Catalogue', url: 'https://www.worldcat.org/', description: 'Search for books, journals and e-resources', sort_order: 1 },
  { name: 'Room Booking', url: 'https://www.nust.na/', description: 'Reserve a group study room from your phone', sort_order: 2 },
  { name: 'Research Guides', url: 'https://www.nust.na/library', description: 'Subject guides and referencing help', sort_order: 3 },
  { name: 'Ask a Librarian', url: 'https://www.nust.na/library', description: 'Chat, email or book a consultation', sort_order: 4 }
];

const floors = [
  {
    name: 'Ground Floor', sort_order: 0,
    locations: [
      { name: 'Main Entrance', type: 'entrance', x: 50, y: 92, directions: 'Enter from the main courtyard. Security gates are just inside the doors.' },
      { name: 'Information Desk', type: 'service', x: 50, y: 70, directions: 'Straight ahead as you come through the entrance gates.' },
      { name: 'Circulation Desk', type: 'service', x: 25, y: 65, directions: 'To the left of the information desk, beside the self-service machines.' },
      { name: 'Café', type: 'amenity', x: 80, y: 80, directions: 'Turn right after the entrance gates. The café is in the corner by the windows.' },
      { name: 'Newspapers & Magazines', type: 'collection', x: 20, y: 30, directions: 'Back left corner of the ground floor, past the circulation desk.' },
      { name: 'Computer Lab', type: 'technology', x: 75, y: 30, directions: 'Back right corner. Sign in with your student card.' }
    ]
  },
  {
    name: 'First Floor', sort_order: 1,
    locations: [
      { name: 'Technology Desk', type: 'service', x: 50, y: 75, directions: 'At the top of the main stairs, on your left.' },
      { name: 'Training Room 2', type: 'study', x: 20, y: 20, directions: 'Follow the corridor to the far left end of the floor.' },
      { name: 'Main Book Collection A–M', type: 'collection', x: 30, y: 50, directions: 'Shelving to the left of the stairs.' },
      { name: 'Main Book Collection N–Z', type: 'collection', x: 70, y: 50, directions: 'Shelving to the right of the stairs.' },
      { name: 'Group Study Rooms', type: 'study', x: 80, y: 20, directions: 'Far right end of the floor. Bookings are shown on the door panels.' }
    ]
  },
  {
    name: 'Second Floor', sort_order: 2,
    locations: [
      { name: 'Silent Study Area', type: 'study', x: 50, y: 30, directions: 'The whole central area of this floor is a silent zone.' },
      { name: 'Study Pods', type: 'study', x: 78, y: 60, directions: 'Right-hand side next to the periodicals.' },
      { name: 'Periodicals', type: 'collection', x: 78, y: 35, directions: 'Right-hand side of the floor, along the windows.' },
      { name: 'Special Collections', type: 'collection', x: 20, y: 60, directions: 'Left-hand side. Ask staff for access; bags must be left in the lockers.' },
      { name: 'Printing & Scanning', type: 'technology', x: 22, y: 85, directions: 'Near the lifts on the left.' }
    ]
  }
];

function isoDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

// Settings rows the kiosk expects. Re-created if they were ever removed.
export const DEFAULT_SETTINGS = {
  general: { idleTimeout: 300000, autoResetHome: true },
  site: {
    libraryName: 'University Library',
    welcomeMessage: 'Welcome! How can we help you today?',
    openingHours: '7:00 AM - 11:00 PM',
    wifiNetwork: 'University-WiFi',
    helpDeskName: 'Information Desk',
    helpDeskLocation: 'Ground Floor',
    helpPhone: 'Ext. 2150'
  }
};

export async function ensureDefaultSettings(pool) {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await pool.query(
      'INSERT INTO kiosk_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING',
      [key, JSON.stringify(value)]
    );
  }
}

export async function contentIsEmpty(pool) {
  const { rows } = await pool.query(
    `SELECT (SELECT count(*) FROM announcements) + (SELECT count(*) FROM faqs)
          + (SELECT count(*) FROM qr_links) + (SELECT count(*) FROM floors) AS total`
  );
  return Number(rows[0].total) === 0;
}

export async function seedSampleContent(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const a of announcements) {
      await client.query(
        'INSERT INTO announcements (title, content, type, priority, date) VALUES ($1, $2, $3, $4, $5)',
        [a.title, a.content, a.type, a.priority, isoDate(a.daysFromNow)]
      );
    }
    for (const f of faqs) {
      await client.query(
        'INSERT INTO faqs (category, question, answer, sort_order) VALUES ($1, $2, $3, $4)',
        [f.category, f.question, f.answer, f.sort_order]
      );
    }
    for (const q of qrLinks) {
      await client.query(
        'INSERT INTO qr_links (name, url, description, sort_order) VALUES ($1, $2, $3, $4)',
        [q.name, q.url, q.description, q.sort_order]
      );
    }
    for (const floor of floors) {
      const { rows } = await client.query(
        'INSERT INTO floors (name, sort_order) VALUES ($1, $2) RETURNING id',
        [floor.name, floor.sort_order]
      );
      let order = 0;
      for (const loc of floor.locations) {
        await client.query(
          `INSERT INTO locations (floor_id, name, type, x_position, y_position, directions, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [rows[0].id, loc.name, loc.type, loc.x, loc.y, loc.directions, order++]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
