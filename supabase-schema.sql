-- =====================================================
-- CENTRO DE CONVENCIONES TINOCO - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'otro',
  name TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '18:00',
  guests INTEGER NOT NULL DEFAULT 50,
  decoration_color TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'cotizacion' CHECK (status IN ('confirmado', 'cotizacion')),
  amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advances (adelantos) table
CREATE TABLE IF NOT EXISTS advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by date and venue
CREATE INDEX idx_events_date_venue ON events(date, venue);
CREATE INDEX idx_advances_event_id ON advances(event_id);

-- Function to enforce max 1 confirmed per venue per day
CREATE OR REPLACE FUNCTION check_confirmed_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmado' THEN
    IF EXISTS (
      SELECT 1 FROM events
      WHERE date = NEW.date
        AND venue = NEW.venue
        AND status = 'confirmado'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Solo se permite 1 evento confirmado por espacio por día';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_confirmed_limit
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_confirmed_limit();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Enable Row Level Security (allow all for now — add auth later)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations (public access)
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on advances" ON advances FOR ALL USING (true) WITH CHECK (true);
