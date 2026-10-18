// ==============================================================================
// AERO-OPS SEED DATA: REALISTIC MILITARY AIR COMBAT COMMAND DATASET
// Idiomatic Cypher with MERGE and MATCH for bulletproof graph linkage
// ==============================================================================

// Clear existing tactical data
MATCH (n) DETACH DELETE n;

// --- 1. SQUADRONS ---
CREATE (:Squadron {
    sqd_id: "SQD-HQ",
    callsign: "Air Combat Command HQ",
    specialization: "Strategic Air Command & Joint Operations"
});
CREATE (:Squadron {
    sqd_id: "SQD-101",
    callsign: "Vipers",
    specialization: "Air Superiority & Interception"
});
CREATE (:Squadron {
    sqd_id: "SQD-102",
    callsign: "Reapers",
    specialization: "Precision Ground Strike & CAS"
});
CREATE (:Squadron {
    sqd_id: "SQD-103",
    callsign: "Shadows",
    specialization: "Electronic Warfare & SEAD"
});
CREATE (:Squadron {
    sqd_id: "SQD-104",
    callsign: "Hawkeyes",
    specialization: "Tactical Reconnaissance & Battle Damage Assessment"
});

// Recursive Reports_to (Subordinate -> Commander)
MATCH (s101:Squadron {sqd_id: "SQD-101"}), (hq:Squadron {sqd_id: "SQD-HQ"}) CREATE (s101)-[:REPORTS_TO]->(hq);
MATCH (s102:Squadron {sqd_id: "SQD-102"}), (hq:Squadron {sqd_id: "SQD-HQ"}) CREATE (s102)-[:REPORTS_TO]->(hq);
MATCH (s103:Squadron {sqd_id: "SQD-103"}), (s101:Squadron {sqd_id: "SQD-101"}) CREATE (s103)-[:REPORTS_TO]->(s101);
MATCH (s104:Squadron {sqd_id: "SQD-104"}), (s102:Squadron {sqd_id: "SQD-102"}) CREATE (s104)-[:REPORTS_TO]->(s102);

// --- 2. PERSONNEL: PILOTS (DISJOINT SUBCLASS) ---
CREATE (:Personnel:Pilot {
    service_id: "SVC-P01",
    fname: "Marcus",
    lname: "Vance",
    callsign: "Viper-Lead",
    total_flight_hours: 1420.5,
    contact_no: ["+1-555-0101", "+1-555-0102"],
    flight_rating: "A1 - Combat Ace",
    rank: "Major"
});
CREATE (:Personnel:Pilot {
    service_id: "SVC-P02",
    fname: "Elena",
    lname: "Rostova",
    callsign: "Valkyrie",
    total_flight_hours: 985.0,
    contact_no: ["+1-555-0103"],
    flight_rating: "A1 - Combat Ace",
    rank: "Captain"
});
CREATE (:Personnel:Pilot {
    service_id: "SVC-P03",
    fname: "James",
    lname: "Cole",
    callsign: "Ghost",
    total_flight_hours: 650.0,
    contact_no: ["+1-555-0104", "+1-555-0105"],
    flight_rating: "A2 - Senior Aviator",
    rank: "Captain"
});
CREATE (:Personnel:Pilot {
    service_id: "SVC-P04",
    fname: "Sarah",
    lname: "Lin",
    callsign: "Apex",
    total_flight_hours: 420.0,
    contact_no: ["+1-555-0106"],
    flight_rating: "B1 - Operational Pilot",
    rank: "Lieutenant"
});
CREATE (:Personnel:Pilot {
    service_id: "SVC-P05",
    fname: "Devon",
    lname: "Hayes",
    callsign: "Specter",
    total_flight_hours: 890.0,
    contact_no: ["+1-555-0107"],
    flight_rating: "A2 - Senior Aviator",
    rank: "Captain"
});

// --- PERSONNEL: TECHNICIANS (DISJOINT SUBCLASS) ---
CREATE (:Personnel:Technician {
    service_id: "SVC-T01",
    fname: "Frank",
    lname: "Miller",
    total_flight_hours: 0.0,
    contact_no: ["+1-555-0201"],
    clearance_lvl: "Top Secret / SCI",
    specialty: "Avionics & AESA Radar",
    rank: "Master Sergeant"
});
CREATE (:Personnel:Technician {
    service_id: "SVC-T02",
    fname: "Amina",
    lname: "Mansoor",
    total_flight_hours: 0.0,
    contact_no: ["+1-555-0202", "+1-555-0203"],
    clearance_lvl: "Top Secret",
    specialty: "Turbofan Propulsion & Hydraulics",
    rank: "Technical Sergeant"
});
CREATE (:Personnel:Technician {
    service_id: "SVC-T03",
    fname: "Liam",
    lname: "O'Connor",
    total_flight_hours: 0.0,
    contact_no: ["+1-555-0204"],
    clearance_lvl: "Secret",
    specialty: "Weapons Hardpoints & Armament",
    rank: "Staff Sergeant"
});
CREATE (:Personnel:Technician {
    service_id: "SVC-T04",
    fname: "Chen",
    lname: "Wei",
    total_flight_hours: 0.0,
    contact_no: ["+1-555-0205"],
    clearance_lvl: "Top Secret / SCI",
    specialty: "Electronic Warfare Countermeasures",
    rank: "Master Sergeant"
});

// Squadron Employs Personnel
MATCH (s:Squadron {sqd_id: "SQD-101"}), (p:Personnel {service_id: "SVC-P01"}) CREATE (s)-[:EMPLOYS]->(p);
MATCH (s:Squadron {sqd_id: "SQD-101"}), (p:Personnel {service_id: "SVC-P02"}) CREATE (s)-[:EMPLOYS]->(p);
MATCH (s:Squadron {sqd_id: "SQD-101"}), (p:Personnel {service_id: "SVC-T01"}) CREATE (s)-[:EMPLOYS]->(p);
MATCH (s:Squadron {sqd_id: "SQD-101"}), (p:Personnel {service_id: "SVC-T02"}) CREATE (s)-[:EMPLOYS]->(p);

MATCH (s:Squadron {sqd_id: "SQD-102"}), (p:Personnel {service_id: "SVC-P03"}) CREATE (s)-[:EMPLOYS]->(p);
MATCH (s:Squadron {sqd_id: "SQD-102"}), (p:Personnel {service_id: "SVC-P04"}) CREATE (s)-[:EMPLOYS]->(p);
MATCH (s:Squadron {sqd_id: "SQD-102"}), (p:Personnel {service_id: "SVC-T03"}) CREATE (s)-[:EMPLOYS]->(p);

MATCH (s:Squadron {sqd_id: "SQD-103"}), (p:Personnel {service_id: "SVC-P05"}) CREATE (s)-[:EMPLOYS]->(p);
MATCH (s:Squadron {sqd_id: "SQD-103"}), (p:Personnel {service_id: "SVC-T04"}) CREATE (s)-[:EMPLOYS]->(p);

// --- 3. AIRCRAFT ---
CREATE (:Aircraft { tail_no: "AF-F15-101", model: "F-15EX Eagle II", status: "READY" });
CREATE (:Aircraft { tail_no: "AF-F15-102", model: "F-15EX Eagle II", status: "READY" });
CREATE (:Aircraft { tail_no: "AF-F35-103", model: "F-35A Lightning II", status: "IN_FLIGHT" });
CREATE (:Aircraft { tail_no: "AF-A10-201", model: "A-10C Thunderbolt II", status: "READY" });
CREATE (:Aircraft { tail_no: "AF-A10-202", model: "A-10C Thunderbolt II", status: "MAINTENANCE" });
CREATE (:Aircraft { tail_no: "AF-EA18-301", model: "EA-18G Growler", status: "READY" });
CREATE (:Aircraft { tail_no: "AF-MQ9-401", model: "MQ-9A Reaper", status: "READY" });
CREATE (:Aircraft { tail_no: "AF-F16-105", model: "F-16V Viper", status: "RESERVE" });

// Squadron Commands Aircraft
MATCH (s:Squadron {sqd_id: "SQD-101"}), (a:Aircraft {tail_no: "AF-F15-101"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-101"}), (a:Aircraft {tail_no: "AF-F15-102"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-101"}), (a:Aircraft {tail_no: "AF-F35-103"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-101"}), (a:Aircraft {tail_no: "AF-F16-105"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-102"}), (a:Aircraft {tail_no: "AF-A10-201"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-102"}), (a:Aircraft {tail_no: "AF-A10-202"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-103"}), (a:Aircraft {tail_no: "AF-EA18-301"}) CREATE (s)-[:COMMANDS]->(a);
MATCH (s:Squadron {sqd_id: "SQD-104"}), (a:Aircraft {tail_no: "AF-MQ9-401"}) CREATE (s)-[:COMMANDS]->(a);

// --- 4. WEAK ENTITY: MAINTENANCE LOGS (REQUIRES IDENTIFYING RELATIONSHIP) ---
CREATE (l1:MaintenanceLog {
    log_id: "LOG-AF-A10-202-20261012-01",
    log_date: "2026-10-12 14:00:00",
    issue: "Hydraulic actuator seal leak detected on left flap assembly during pre-flight check.",
    severity: "CRITICAL",
    technician_service_id: "SVC-T02",
    resolved: false
});
CREATE (l2:MaintenanceLog {
    log_id: "LOG-AF-F15-101-20261010-01",
    log_date: "2026-10-10 09:30:00",
    issue: "APG-82 AESA radar calibration and electronic beam steering diagnostics complete.",
    severity: "ROUTINE",
    technician_service_id: "SVC-T01",
    resolved: true
});
CREATE (l3:MaintenanceLog {
    log_id: "LOG-AF-EA18-301-20261014-01",
    log_date: "2026-10-14 11:15:00",
    issue: "ALQ-99 jamming pod receiver thermal sensor reset and waveguide check.",
    severity: "MINOR",
    technician_service_id: "SVC-T04",
    resolved: true
});

MATCH (a:Aircraft {tail_no: "AF-A10-202"}), (l:MaintenanceLog {log_id: "LOG-AF-A10-202-20261012-01"}) CREATE (a)-[:REQUIRES]->(l);
MATCH (a:Aircraft {tail_no: "AF-F15-101"}), (l:MaintenanceLog {log_id: "LOG-AF-F15-101-20261010-01"}) CREATE (a)-[:REQUIRES]->(l);
MATCH (a:Aircraft {tail_no: "AF-EA18-301"}), (l:MaintenanceLog {log_id: "LOG-AF-EA18-301-20261014-01"}) CREATE (a)-[:REQUIRES]->(l);

// --- 5. MISSIONS (OVERLAPPING EER SUBCLASSES) ---
CREATE (:Mission:Combat_mission {
    mission_id: "MSN-C-01",
    code_name: "Operation Northern Aegis",
    objective: "Combat Air Patrol & Airspace Denial against hostile incursions",
    threat_level: "HIGH",
    theater: "Sector 4 North Border"
});
CREATE (:Mission:Combat_mission {
    mission_id: "MSN-C-02",
    code_name: "Operation Iron Strike",
    objective: "Precision stand-off strike against reinforced command bunker",
    threat_level: "CRITICAL",
    theater: "Southern Redoubt B"
});
CREATE (:Mission:Training_mission {
    mission_id: "MSN-T-01",
    code_name: "Exercise Red Falcon",
    objective: "BVR Tactical Intercept syllabus for senior wing aviators",
    threat_level: "LOW",
    theater: "W-105 Restricted Airspace"
});
CREATE (:Mission:Training_mission {
    mission_id: "MSN-T-02",
    code_name: "Exercise Night Prowler",
    objective: "All-weather low-altitude terrain masking navigation certification",
    threat_level: "LOW",
    theater: "Black Rock Range"
});
// OVERLAPPING: Combat + Training simultaneously!
CREATE (:Mission:Combat_mission:Training_mission {
    mission_id: "MSN-CT-03",
    code_name: "Operation Shadow Crucible",
    objective: "Live-fire electronic warfare defense suppression with combat trainee evaluation",
    threat_level: "MEDIUM",
    theater: "Littoral Zone Bravo"
});

// --- 6. MUNITIONS INVENTORY ---
CREATE (:Munition { munition_id: "MUN-AIM-120D", type: "BVR Active Radar Air-to-Air Missile", stock: 64 });
CREATE (:Munition { munition_id: "MUN-AIM-9X", type: "Within-Visual-Range Infrared High-Off-Boresight Missile", stock: 88 });
CREATE (:Munition { munition_id: "MUN-GBU-38", type: "JDAM 500lb GPS Precision Guided Bomb", stock: 42 });
CREATE (:Munition { munition_id: "MUN-GBU-39", type: "Small Diameter Bomb (SDB) Precision Glide Munition", stock: 120 });
CREATE (:Munition { munition_id: "MUN-AGM-88G", type: "Advanced Anti-Radiation Guided Missile (AARGM-ER)", stock: 24 });
CREATE (:Munition { munition_id: "MUN-30MM-HEI", type: "30mm High-Explosive Armor-Piercing Cannon Ammunition", stock: 3500 });

// --- 7. TERNARY RELATIONSHIP & AGGREGATION BLOCK: FLIGHT MANIFESTS ---
CREATE (:FlightManifest {
    manifest_id: "MAN-2026-001",
    sortie_code: "VIPER-01-FLIGHT",
    departure_time: "2026-10-15 06:30:00",
    status: "SCHEDULED"
});
CREATE (:FlightManifest {
    manifest_id: "MAN-2026-002",
    sortie_code: "VALKYRIE-02-FLIGHT",
    departure_time: "2026-10-15 07:15:00",
    status: "AIRBORNE"
});
CREATE (:FlightManifest {
    manifest_id: "MAN-2026-003",
    sortie_code: "HOG-03-CRUCIBLE",
    departure_time: "2026-10-15 13:00:00",
    status: "SCHEDULED"
});
CREATE (:FlightManifest {
    manifest_id: "MAN-2026-004",
    sortie_code: "SHADOW-04-TRAINING",
    departure_time: "2026-10-14 15:45:00",
    status: "COMPLETED"
});

// Link Manifest 1 (Viper 01)
MATCH (p:Pilot {service_id: "SVC-P01"}), (fm:FlightManifest {manifest_id: "MAN-2026-001"}) CREATE (p)-[:OPERATES]->(fm);
MATCH (a:Aircraft {tail_no: "AF-F15-101"}), (fm:FlightManifest {manifest_id: "MAN-2026-001"}) CREATE (fm)-[:USES_AIRFRAME]->(a);
MATCH (m:Mission {mission_id: "MSN-C-01"}), (fm:FlightManifest {manifest_id: "MAN-2026-001"}) CREATE (fm)-[:ASSIGNED_TO_MISSION]->(m);
MATCH (mu:Munition {munition_id: "MUN-AIM-120D"}), (fm:FlightManifest {manifest_id: "MAN-2026-001"}) CREATE (fm)-[:LOADED_WITH {quantity: 4}]->(mu);
MATCH (mu:Munition {munition_id: "MUN-AIM-9X"}), (fm:FlightManifest {manifest_id: "MAN-2026-001"}) CREATE (fm)-[:LOADED_WITH {quantity: 2}]->(mu);

// Link Manifest 2 (Valkyrie 02)
MATCH (p:Pilot {service_id: "SVC-P02"}), (fm:FlightManifest {manifest_id: "MAN-2026-002"}) CREATE (p)-[:OPERATES]->(fm);
MATCH (a:Aircraft {tail_no: "AF-F35-103"}), (fm:FlightManifest {manifest_id: "MAN-2026-002"}) CREATE (fm)-[:USES_AIRFRAME]->(a);
MATCH (m:Mission {mission_id: "MSN-C-01"}), (fm:FlightManifest {manifest_id: "MAN-2026-002"}) CREATE (fm)-[:ASSIGNED_TO_MISSION]->(m);
MATCH (mu:Munition {munition_id: "MUN-AIM-120D"}), (fm:FlightManifest {manifest_id: "MAN-2026-002"}) CREATE (fm)-[:LOADED_WITH {quantity: 4}]->(mu);

// Link Manifest 3 (Hog 03)
MATCH (p:Pilot {service_id: "SVC-P03"}), (fm:FlightManifest {manifest_id: "MAN-2026-003"}) CREATE (p)-[:OPERATES]->(fm);
MATCH (a:Aircraft {tail_no: "AF-A10-201"}), (fm:FlightManifest {manifest_id: "MAN-2026-003"}) CREATE (fm)-[:USES_AIRFRAME]->(a);
MATCH (m:Mission {mission_id: "MSN-CT-03"}), (fm:FlightManifest {manifest_id: "MAN-2026-003"}) CREATE (fm)-[:ASSIGNED_TO_MISSION]->(m);
MATCH (mu:Munition {munition_id: "MUN-GBU-38"}), (fm:FlightManifest {manifest_id: "MAN-2026-003"}) CREATE (fm)-[:LOADED_WITH {quantity: 4}]->(mu);
MATCH (mu:Munition {munition_id: "MUN-30MM-HEI"}), (fm:FlightManifest {manifest_id: "MAN-2026-003"}) CREATE (fm)-[:LOADED_WITH {quantity: 600}]->(mu);

// Link Manifest 4 (Shadow 04)
MATCH (p:Pilot {service_id: "SVC-P05"}), (fm:FlightManifest {manifest_id: "MAN-2026-004"}) CREATE (p)-[:OPERATES]->(fm);
MATCH (a:Aircraft {tail_no: "AF-EA18-301"}), (fm:FlightManifest {manifest_id: "MAN-2026-004"}) CREATE (fm)-[:USES_AIRFRAME]->(a);
MATCH (m:Mission {mission_id: "MSN-T-01"}), (fm:FlightManifest {manifest_id: "MAN-2026-004"}) CREATE (fm)-[:ASSIGNED_TO_MISSION]->(m);
MATCH (mu:Munition {munition_id: "MUN-AGM-88G"}), (fm:FlightManifest {manifest_id: "MAN-2026-004"}) CREATE (fm)-[:LOADED_WITH {quantity: 2}]->(mu);
MATCH (mu:Munition {munition_id: "MUN-AIM-120D"}), (fm:FlightManifest {manifest_id: "MAN-2026-004"}) CREATE (fm)-[:LOADED_WITH {quantity: 2}]->(mu);
