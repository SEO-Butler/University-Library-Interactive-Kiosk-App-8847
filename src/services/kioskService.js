const API_BASE = '/api';

export async function fetchAnnouncements() {
  try {
    const res = await fetch(`${API_BASE}/announcements`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [
      {
        id: 1,
        title: 'New Study Rooms Available',
        content: 'Book your private study space on Level 3. Now with whiteboard and charging stations.',
        type: 'info',
        date: '2024-01-15',
        priority: 'high'
      },
      {
        id: 2,
        title: 'Digital Archive Workshop',
        content: 'Learn to access our digital collections. Every Friday at 2 PM in the Computer Lab.',
        type: 'event',
        date: '2024-01-20',
        priority: 'medium'
      }
    ];
  }
}

export async function fetchFAQs() {
  try {
    const res = await fetch(`${API_BASE}/faqs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [
      {
        id: 1,
        category: 'General',
        question: 'What are the library opening hours?',
        answer: 'Monday-Friday: 7:00 AM - 11:00 PM, Saturday-Sunday: 9:00 AM - 9:00 PM. Extended hours during exam periods.'
      },
      {
        id: 2,
        category: 'Technology',
        question: 'How do I connect to the WiFi?',
        answer: 'Connect to "University-WiFi" network using your student ID and password. Guest access available at the front desk.'
      },
      {
        id: 3,
        category: 'Services',
        question: 'How do I book a study room?',
        answer: 'Use the online booking system or visit the front desk. Rooms can be booked up to 7 days in advance.'
      },
      {
        id: 4,
        category: 'Technology',
        question: 'Where can I print documents?',
        answer: 'Printing stations are available on each floor. Use your student card or purchase a print card at the front desk.'
      }
    ];
  }
}

export async function fetchQRLinks() {
  try {
    const res = await fetch(`${API_BASE}/qr-links`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching QR links:', error);
    return [
      {
        id: 1,
        name: 'Library Catalog',
        url: 'https://library.university.edu/catalog',
        description: 'Search our book and digital collections'
      },
      {
        id: 2,
        name: 'Study Room Booking',
        url: 'https://library.university.edu/booking',
        description: 'Reserve your study space online'
      },
      {
        id: 3,
        name: 'Digital Resources',
        url: 'https://library.university.edu/digital',
        description: 'Access databases and e-books'
      }
    ];
  }
}

export async function fetchLibraryFloors() {
  try {
    const res = await fetch(`${API_BASE}/floors`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching library floors:', error);
    return [
      { id: 1, name: 'Ground Floor' },
      { id: 2, name: 'Level 2' },
      { id: 3, name: 'Level 3' }
    ];
  }
}

export async function fetchLibraryLocations() {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching library locations:', error);
    return [
      {
        location_id: 'entrance',
        floor_id: 1,
        name: 'Main Entrance',
        type: 'entrance',
        x_position: 50,
        y_position: 80,
        directions: 'Located at the front of the building.'
      },
      {
        location_id: 'info-desk',
        floor_id: 1,
        name: 'Information Desk',
        type: 'service',
        x_position: 30,
        y_position: 60,
        directions: 'From the main entrance, walk straight ahead for 20 meters. The Information Desk will be on your left.'
      }
    ];
  }
}

export async function fetchKioskSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching kiosk settings:', error);
    return null;
  }
}

export async function updateKioskSettings(settingKey, settingValue) {
  try {
    const res = await fetch(`${API_BASE}/settings/${settingKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setting_value: settingValue })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error updating kiosk settings:', error);
    return null;
  }
}

// Admin functions
export async function addAnnouncement(announcement) {
  const res = await fetch(`${API_BASE}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(announcement)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function updateAnnouncement(id, announcement) {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(announcement)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteAnnouncement(id) {
  const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

export async function addFAQ(faq) {
  const res = await fetch(`${API_BASE}/faqs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faq)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function updateFAQ(id, faq) {
  const res = await fetch(`${API_BASE}/faqs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faq)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteFAQ(id) {
  const res = await fetch(`${API_BASE}/faqs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

export async function addQRLink(link) {
  const res = await fetch(`${API_BASE}/qr-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(link)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function updateQRLink(id, link) {
  const res = await fetch(`${API_BASE}/qr-links/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(link)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteQRLink(id) {
  const res = await fetch(`${API_BASE}/qr-links/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}
