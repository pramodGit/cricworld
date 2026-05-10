-- ═══════════════════════════════════════════════════
-- SCHEDULE FEATURE — DB MIGRATION
-- Run these in order in MySQL Workbench
-- ═══════════════════════════════════════════════════

-- 1. SERIES table
CREATE TABLE IF NOT EXISTS series (
  id           VARCHAR(100) PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  category     ENUM('international','league','domestic','women','all') NOT NULL DEFAULT 'international',
  match_type   ENUM('T20','ODI','Test','T10','Other') DEFAULT NULL,
  start_date   DATE DEFAULT NULL,
  end_date     DATE DEFAULT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. VENUES table
CREATE TABLE IF NOT EXISTS venues (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(150) NOT NULL,
  city    VARCHAR(100) DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL
);

-- 3. TEAMS table (for logo_url, proper names)
CREATE TABLE IF NOT EXISTS teams (
  id         VARCHAR(20) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  short_name VARCHAR(10)  DEFAULT NULL,
  category   ENUM('international','ipl','domestic','women') DEFAULT 'international',
  logo_url   VARCHAR(300) DEFAULT NULL
);

-- 4. Add columns to existing matches table
ALTER TABLE matches
  ADD COLUMN series_id    VARCHAR(100) DEFAULT NULL AFTER id,
  ADD COLUMN venue_id     INT          DEFAULT NULL AFTER series_id,
  ADD COLUMN team1_id     VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN team2_id     VARCHAR(20)  DEFAULT NULL,
  ADD COLUMN match_number VARCHAR(50)  DEFAULT NULL;

-- 5. Foreign keys (add after data is inserted)
ALTER TABLE matches
  ADD CONSTRAINT fk_series  FOREIGN KEY (series_id) REFERENCES series(id),
  ADD CONSTRAINT fk_venue   FOREIGN KEY (venue_id)  REFERENCES venues(id),
  ADD CONSTRAINT fk_team1   FOREIGN KEY (team1_id)  REFERENCES teams(id),
  ADD CONSTRAINT fk_team2   FOREIGN KEY (team2_id)  REFERENCES teams(id);

-- ═══════════════════════════════════════════════════
-- SAMPLE DATA — insert to test the schedule page
-- ═══════════════════════════════════════════════════

-- Series
INSERT IGNORE INTO series (id, name, category, match_type, start_date, end_date) VALUES
('pak-ban-2026',  'Pakistan tour of Bangladesh, 2026', 'international', 'Test', '2026-05-08', '2026-06-01'),
('ipl-2026',      'Indian Premier League 2026',        'league',        'T20',  '2026-03-22', '2026-05-25'),
('icc-t20-eap',   'ICC Men\'s T20 World Cup EAP Qualifier 2026', 'international', 'T20', '2026-05-07', '2026-05-14');

-- Venues
INSERT IGNORE INTO venues (id, name, city, country) VALUES
(1, 'Shere Bangla National Stadium', 'Dhaka',     'Bangladesh'),
(2, 'Korogi Sports Park',            'Nisshin',    'Japan'),
(3, 'M. Chinnaswamy Stadium',        'Bengaluru',  'India');

-- Teams
INSERT IGNORE INTO teams (id, name, short_name, category) VALUES
('BAN', 'Bangladesh',  'BAN', 'international'),
('PAK', 'Pakistan',    'PAK', 'international'),
('IND', 'India',       'IND', 'international'),
('RCB', 'Royal Challengers Bengaluru', 'RCB', 'ipl'),
('GT',  'Gujarat Titans', 'GT', 'ipl');