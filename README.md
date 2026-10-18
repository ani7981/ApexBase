# AERO-OPS: Air Combat Command Tactical Sortie & Ordnance Management System
> **DBMS Mini-Project & Formal Assessment Suite**  
> **Database Technology Selected:** Neo4j (Graph Database)  
> **Lab Demonstration Date:** October 20

---

## 1. Executive Summary & Database Selection Justification

### Why a Graph Database (Neo4j) Over Other Database Categories?

The database specification for this system models an **Air Force Combined Air Operations Center (CAOC)**. It features deep recursive command hierarchies, multi-way flight aggregations, strict subclass constraints (both disjoint and overlapping), weak entities, and resource allocation.

We evaluated the allowed modern database categories against our specific workload requirements:

| Category & Example DB | Fit for Air Force Sortie System | Architectural Limitation for this Schema |
| :--- | :--- | :--- |
| **Document DB** *(e.g., MongoDB)* | Poor *(Excluded by lab guidelines)* | Redundant nesting; cannot natively traverse recursive command hierarchies or handle multi-way hyperedge aggregations without multiple lookups and application-level joins. |
| **Column-Family** *(e.g., Apache Cassandra, ScyllaDB)* | Poor | Optimized for high-throughput write-heavy time-series logs; does not support ad-hoc recursive path queries, multi-entity transactions, or relationship integrity. |
| **Vector Database** *(e.g., Milvus, Chroma, Qdrant)* | Not Applicable | Designed for high-dimensional semantic vector similarity search (embeddings), not structured operational relational networks. |
| **Time-Series DB** *(e.g., InfluxDB, TimescaleDB)* | Partial | Excellent for sensor telemetry, but unable to represent complex EER entities, disjoint/overlapping hierarchies, or ternary relationships. |
| **Cloud-Native / NewSQL** *(e.g., CockroachDB, TiDB)* | Moderate | Handles standard relational tables, but deep recursive hierarchy queries (`Reports_to`) require slow, convoluted recursive CTEs (`WITH RECURSIVE`). Multi-table joins across 5 entities for a single sortie degrade performance. |
| **Graph Database: Neo4j** *(SELECTED)* | **Optimal (10/10)** | **Natively maps every element of the EER diagram into nodes, labels, and first-class directional relationships with zero-join overhead.** |

---

## 2. Element-by-Element EER Schema Mapping to Neo4j

### A. Recursive Relationship: `Squadron Reports_to Squadron` (1:N)
* **EER Definition:** Unary/recursive relationship where one superior Commander squadron commands $N$ subordinate squadrons.
* **Relational Problem:** Requires self-referencing foreign keys and recursive Common Table Expressions (`WITH RECURSIVE`) that scale with $O(N \cdot \text{depth})$ join cost.
* **Neo4j Implementation:** Directed relationship `(sub:Squadron)-[:REPORTS_TO]->(cmd:Squadron)`. Cypher allows arbitrary-depth traversals in a single statement:
  ```cypher
  MATCH path = (sub:Squadron)-[:REPORTS_TO*1..5]->(hq:Squadron)
  WHERE NOT (hq)-[:REPORTS_TO]->()
  RETURN sub.callsign, [n in nodes(path) | n.callsign] AS chain;
  ```

### B. Disjoint EER Subclasses: `Personnel` $\rightarrow$ `Pilot` vs `Technician` (`d`)
* **EER Definition:** A member of Personnel must be a Pilot OR a Technician, but cannot be both.
* **Neo4j Implementation:** Nodes possess a base label `:Personnel` and a disjoint role label `:Pilot` or `:Technician`.
  * `Pilot` adds `flight_rating` and `total_flight_hours`.
  * `Technician` adds `clearance_lvl` and `specialty`.
  * Composite `Name` branches into `fname` and `lname`.
  * Multivalued `contact_no` is stored as a native array property `contact_no: ["+1-555-0101", "+1-555-0102"]`.

### C. Overlapping EER Subclasses: `Mission` $\rightarrow$ `Combat_mission` and `Training_mission` (`o`)
* **EER Definition:** A mission can be Combat, Training, or **both** simultaneously.
* **Relational Problem:** In SQL, overlapping subclasses require either multiple nullable columns, bitmasks, or three separate bridge tables.
* **Neo4j Implementation:** Multi-labeling natively represents overlapping sets:
  * Pure Combat: `(:Mission:Combat_mission)`
  * Pure Training: `(:Mission:Training_mission)`
  * Joint Exercise (Both): `(:Mission:Combat_mission:Training_mission)`

### D. Weak Entity & Identifying Relationship: `Maintenance_log Requires Aircraft`
* **EER Definition:** `Maintenance_log` cannot exist without parent `Aircraft`. `log_date` serves as partial discriminator.
* **Neo4j Implementation:** Modeled as `:MaintenanceLog` bound via identifying directed edge:
  `(:Aircraft)-[:REQUIRES]->(:MaintenanceLog {log_date, issue, severity, technician_id, resolved})`.

### E. Ternary Manifest & Aggregation Block (`Uses_loadout`)
* **EER Definition:** Manifest links `Pilot`, `Aircraft`, and `Mission` in a 3-way ternary relationship. The aggregation block wraps this instance into a higher-level entity that connects $M:N$ to `Munition` via `Uses_loadout`.
* **Neo4j Implementation:** Modeled as an aggregated hyperedge node `:FlightManifest` with 3 incoming/outgoing relationship edges:
  * `(p:Pilot)-[:OPERATES]->(fm:FlightManifest)`
  * `(fm:FlightManifest)-[:USES_AIRFRAME]->(a:Aircraft)`
  * `(fm:FlightManifest)-[:ASSIGNED_TO_MISSION]->(m:Mission)`
  * `(fm:FlightManifest)-[:LOADED_WITH {quantity: 4}]->(mu:Munition)`

---

## 3. Technology Stack

* **Database Engine:** Neo4j 5 Community Edition (running via Docker container on ports `7474` and `7687`).
* **Backend:** Python 3.13 + FastAPI + official `neo4j` Bolt Driver + Pydantic validation.
* **Frontend:** React 19 + Vite 8 + Tailwind CSS + Lucide Icons styled in a bold **Dark Neobrutalism** aesthetic (stark solid black borders, hard offset drop shadows, high-contrast neon accents `#00FF66`, `#FFE600`, `#FF3366`, `#00E5FF`, and tactile pressable buttons).

---

## 4. Quick Start & Execution Guide

### 1. Start the Database Container
```bash
docker compose up -d
```
Neo4j Browser UI is accessible at: [http://localhost:7474](http://localhost:7474)  
* Username: `neo4j`  
* Password: `tacticalpassword123`

### 2. Start the Backend API
```bash
backend/venv/bin/uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000
```
FastAPI Swagger Documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Start the Tactical Frontend Dashboard
```bash
cd frontend
npm run dev
```
Dashboard is live at: [http://localhost:5173](http://localhost:5173)

---

## 5. Technology-Specific Queries for Lab Demonstration

### Query 1: Recursive Chain of Command Traversal
```cypher
MATCH path = (sub:Squadron)-[:REPORTS_TO*1..5]->(hq:Squadron)
WHERE NOT (hq)-[:REPORTS_TO]->()
RETURN 
    sub.sqd_id AS subordinate,
    sub.callsign AS subordinate_callsign,
    [node in nodes(path) | node.callsign] AS hierarchy_path,
    length(path) AS command_depth
ORDER BY command_depth DESC;
```

### Query 2: Airframe Grounding Blast-Radius Impact
```cypher
MATCH (a:Aircraft {tail_no: "AF-A10-202"})
OPTIONAL MATCH (fm:FlightManifest)-[:USES_AIRFRAME]->(a)
OPTIONAL MATCH (p:Pilot)-[:OPERATES]->(fm)
OPTIONAL MATCH (fm)-[:ASSIGNED_TO_MISSION]->(m:Mission)
OPTIONAL MATCH (a)-[:REQUIRES]->(l:MaintenanceLog)
RETURN 
    a.tail_no AS grounded_tail_no,
    collect(DISTINCT {
        sortie: fm.sortie_code,
        status: fm.status,
        pilot: p.callsign,
        mission: m.code_name
    }) AS compromised_sorties,
    collect(DISTINCT l.issue) AS faults;
```

### Query 3: Munition Expenditure Matrix by EER Mission Classification
```cypher
MATCH (fm:FlightManifest)-[:ASSIGNED_TO_MISSION]->(m:Mission)
MATCH (fm)-[l:LOADED_WITH]->(mu:Munition)
RETURN 
    CASE 
        WHEN 'Combat_mission' IN labels(m) AND 'Training_mission' IN labels(m) THEN 'Joint Combat-Training'
        WHEN 'Combat_mission' IN labels(m) THEN 'Combat Mission'
        ELSE 'Training Mission'
    END AS mission_classification,
    mu.munition_id AS munition_id,
    mu.type AS munition_name,
    sum(l.quantity) AS total_expended
ORDER BY mission_classification, total_expended DESC;
```
