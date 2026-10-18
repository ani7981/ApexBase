// ==============================================================================
// AERO-OPS: MILITARY AIR COMMAND & SORTIE MANAGEMENT SYSTEM
// NEO4J GRAPH DATABASE SCHEMA & CONSTRAINTS
// ==============================================================================

// --- 1. UNIQUENESS CONSTRAINTS ---
CREATE CONSTRAINT unique_squadron_id IF NOT EXISTS 
FOR (s:Squadron) REQUIRE s.sqd_id IS UNIQUE;

CREATE CONSTRAINT unique_personnel_id IF NOT EXISTS 
FOR (p:Personnel) REQUIRE p.service_id IS UNIQUE;

CREATE CONSTRAINT unique_aircraft_tail IF NOT EXISTS 
FOR (a:Aircraft) REQUIRE a.tail_no IS UNIQUE;

CREATE CONSTRAINT unique_mission_id IF NOT EXISTS 
FOR (m:Mission) REQUIRE m.mission_id IS UNIQUE;

CREATE CONSTRAINT unique_munition_id IF NOT EXISTS 
FOR (mu:Munition) REQUIRE mu.munition_id IS UNIQUE;

CREATE CONSTRAINT unique_manifest_id IF NOT EXISTS 
FOR (fm:FlightManifest) REQUIRE fm.manifest_id IS UNIQUE;

CREATE CONSTRAINT unique_log_id IF NOT EXISTS 
FOR (l:MaintenanceLog) REQUIRE l.log_id IS UNIQUE;

// --- 2. INDEXES FOR PERFORMANCE ---
CREATE INDEX idx_aircraft_status IF NOT EXISTS FOR (a:Aircraft) ON (a.status);
CREATE INDEX idx_pilot_rating IF NOT EXISTS FOR (p:Pilot) ON (p.flight_rating);
CREATE INDEX idx_munition_type IF NOT EXISTS FOR (mu:Munition) ON (mu.type);
CREATE INDEX idx_manifest_status IF NOT EXISTS FOR (fm:FlightManifest) ON (fm.status);
