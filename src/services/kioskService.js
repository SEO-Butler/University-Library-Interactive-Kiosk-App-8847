import supabase from '../lib/supabase';

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from('announcements_kiosk')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
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

  return data;
}

export async function fetchFAQs() {
  const { data, error } = await supabase
    .from('faqs_kiosk')
    .select('*')
    .order('category');

  if (error) {
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

  return data;
}

export async function fetchQRLinks() {
  const { data, error } = await supabase
    .from('qr_links_kiosk')
    .select('*')
    .order('name');

  if (error) {
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

  return data;
}

export async function fetchLibraryFloors() {
  const { data, error } = await supabase
    .from('library_floors_kiosk')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching library floors:', error);
    return [
      { id: 1, name: 'Ground Floor' },
      { id: 2, name: 'Level 2' },
      { id: 3, name: 'Level 3' }
    ];
  }

  return data;
}

export async function fetchLibraryLocations() {
  const { data, error } = await supabase
    .from('library_locations_kiosk')
    .select('*')
    .order('floor_id');

  if (error) {
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

  return data;
}

export async function fetchKioskSettings() {
  const { data, error } = await supabase
    .from('kiosk_settings')
    .select('*');

  if (error) {
    console.error('Error fetching kiosk settings:', error);
    return null;
  }

  return data;
}

export async function updateKioskSettings(settingKey, settingValue) {
  const { data, error } = await supabase
    .from('kiosk_settings')
    .update({ setting_value: settingValue, updated_at: new Date() })
    .eq('setting_key', settingKey)
    .select();

  if (error) {
    console.error('Error updating kiosk settings:', error);
    return null;
  }

  return data;
}

// Admin functions
export async function addAnnouncement(announcement) {
  const { data, error } = await supabase
    .from('announcements_kiosk')
    .insert([announcement])
    .select();

  if (error) {
    console.error('Error adding announcement:', error);
    throw error;
  }

  return data;
}

export async function updateAnnouncement(id, announcement) {
  const { data, error } = await supabase
    .from('announcements_kiosk')
    .update(announcement)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }

  return data;
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements_kiosk')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }

  return true;
}

// Similar functions for FAQs, QR links, etc.
export async function addFAQ(faq) {
  const { data, error } = await supabase
    .from('faqs_kiosk')
    .insert([faq])
    .select();

  if (error) {
    console.error('Error adding FAQ:', error);
    throw error;
  }

  return data;
}

export async function updateFAQ(id, faq) {
  const { data, error } = await supabase
    .from('faqs_kiosk')
    .update(faq)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating FAQ:', error);
    throw error;
  }

  return data;
}

export async function deleteFAQ(id) {
  const { error } = await supabase
    .from('faqs_kiosk')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting FAQ:', error);
    throw error;
  }

  return true;
}

export async function addQRLink(link) {
  const { data, error } = await supabase
    .from('qr_links_kiosk')
    .insert([link])
    .select();

  if (error) {
    console.error('Error adding QR link:', error);
    throw error;
  }

  return data;
}

export async function updateQRLink(id, link) {
  const { data, error } = await supabase
    .from('qr_links_kiosk')
    .update(link)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating QR link:', error);
    throw error;
  }

  return data;
}

export async function deleteQRLink(id) {
  const { error } = await supabase
    .from('qr_links_kiosk')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting QR link:', error);
    throw error;
  }

  return true;
}