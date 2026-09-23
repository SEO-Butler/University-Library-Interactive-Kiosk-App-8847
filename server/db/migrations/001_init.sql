-- Library kiosk schema. Content tables feed the kiosk; cms_* tables back the CMS login.

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE cms_users (
  id            serial PRIMARY KEY,
  username      text NOT NULL UNIQUE CHECK (username = lower(username) AND username ~ '^[a-z0-9._-]{3,32}$'),
  display_name  text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE TRIGGER cms_users_updated BEFORE UPDATE ON cms_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Server-side sessions. Only a SHA-256 of the cookie token is stored.
CREATE TABLE cms_sessions (
  token_hash   text PRIMARY KEY,
  user_id      integer NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  ip           text,
  user_agent   text
);
CREATE INDEX cms_sessions_user_idx ON cms_sessions (user_id);
CREATE INDEX cms_sessions_expires_idx ON cms_sessions (expires_at);

-- Files in the object store (floor plans, announcement images).
CREATE TABLE media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key    text NOT NULL UNIQUE,
  content_type  text NOT NULL,
  size_bytes    bigint NOT NULL CHECK (size_bytes >= 0),
  original_name text NOT NULL DEFAULT '',
  uploaded_by   integer REFERENCES cms_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE announcements (
  id         serial PRIMARY KEY,
  title      text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  content    text NOT NULL CHECK (length(content) BETWEEN 1 AND 5000),
  type       text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'event')),
  date       date NOT NULL DEFAULT current_date,
  priority   text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  image_id   uuid REFERENCES media(id) ON DELETE SET NULL,
  published  boolean NOT NULL DEFAULT true,
  -- Hidden from the kiosk after this day (inclusive). NULL = never expires.
  expires_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_kiosk_idx ON announcements (published, date DESC);
CREATE TRIGGER announcements_updated BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE faqs (
  id         serial PRIMARY KEY,
  category   text NOT NULL DEFAULT 'General' CHECK (length(category) BETWEEN 1 AND 60),
  question   text NOT NULL CHECK (length(question) BETWEEN 1 AND 300),
  answer     text NOT NULL CHECK (length(answer) BETWEEN 1 AND 5000),
  sort_order integer NOT NULL DEFAULT 0,
  published  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER faqs_updated BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE qr_links (
  id          serial PRIMARY KEY,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  url         text NOT NULL CHECK (url ~* '^https://'),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 300),
  sort_order  integer NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER qr_links_updated BEFORE UPDATE ON qr_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE floors (
  id           serial PRIMARY KEY,
  name         text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  sort_order   integer NOT NULL DEFAULT 0,
  map_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  published    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER floors_updated BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE locations (
  id         serial PRIMARY KEY,
  floor_id   integer NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  type       text NOT NULL DEFAULT 'service'
             CHECK (type IN ('entrance', 'service', 'amenity', 'collection', 'technology', 'study')),
  -- Percent of the floor plan's width / height, measured from the top-left corner.
  x_position numeric(5,2) NOT NULL CHECK (x_position BETWEEN 0 AND 100),
  y_position numeric(5,2) NOT NULL CHECK (y_position BETWEEN 0 AND 100),
  directions text NOT NULL DEFAULT '' CHECK (length(directions) <= 1000),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX locations_floor_idx ON locations (floor_id);
CREATE TRIGGER locations_updated BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE kiosk_settings (
  setting_key   text PRIMARY KEY,
  setting_value jsonb NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    integer REFERENCES cms_users(id) ON DELETE SET NULL
);

INSERT INTO kiosk_settings (setting_key, setting_value) VALUES
  ('general', '{"idleTimeout": 300000, "autoResetHome": true}'),
  ('site', '{
    "libraryName": "University Library",
    "welcomeMessage": "Welcome! How can we help you today?",
    "openingHours": "7:00 AM - 11:00 PM",
    "wifiNetwork": "University-WiFi",
    "helpDeskName": "Information Desk",
    "helpDeskLocation": "Ground Floor",
    "helpPhone": "Ext. 2150"
  }');

CREATE TABLE audit_log (
  id        bigserial PRIMARY KEY,
  user_id   integer REFERENCES cms_users(id) ON DELETE SET NULL,
  username  text,
  action    text NOT NULL,
  entity    text NOT NULL,
  entity_id text,
  details   jsonb,
  ip        text,
  at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_at_idx ON audit_log (at DESC);
