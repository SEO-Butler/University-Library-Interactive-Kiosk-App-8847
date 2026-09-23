import supabase from '../lib/supabase';

// Requests fail after this long so a flaky network can't leave pages spinning.
const REQUEST_TIMEOUT_MS = 8000;

// Read helpers throw on failure. The caller keeps the last good content
// instead of silently swapping in placeholder data.
async function selectAll(table, orderColumn, options) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order(orderColumn, options)
    .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));

  if (error) {
    console.error(`Error fetching ${table}:`, error);
    throw error;
  }

  return data ?? [];
}

export function fetchAnnouncements() {
  return selectAll('announcements_kiosk', 'date', { ascending: false });
}

export function fetchFAQs() {
  return selectAll('faqs_kiosk', 'category');
}

export function fetchQRLinks() {
  return selectAll('qr_links_kiosk', 'name');
}

export function fetchLibraryFloors() {
  return selectAll('library_floors_kiosk', 'id');
}

export function fetchLibraryLocations() {
  return selectAll('library_locations_kiosk', 'floor_id');
}

export function fetchKioskSettings() {
  return selectAll('kiosk_settings', 'setting_key');
}

export async function updateKioskSettings(settingKey, settingValue) {
  const { data, error } = await supabase
    .from('kiosk_settings')
    .update({ setting_value: settingValue, updated_at: new Date() })
    .eq('setting_key', settingKey)
    .select()
    .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));

  if (error) {
    console.error('Error updating kiosk settings:', error);
    throw error;
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
