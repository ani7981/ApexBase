import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from database import db_client

app = FastAPI(
    title="ApexBase: Tactical Air Combat Command C2 System API",
    description="Tactical Sortie Management & EER Military Database implemented on Neo4j Graph Database",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Pydantic Request Models
# ------------------------------------------------------------------------------
class SquadronCreate(BaseModel):
    sqd_id: str
    callsign: str
    specialization: str
    commander_sqd_id: Optional[str] = None

class PilotCreate(BaseModel):
    service_id: str
    fname: str
    lname: str
    callsign: Optional[str] = None
    rank: str = "Captain"
    total_flight_hours: float = 0.0
    flight_rating: str = "B1 - Operational Pilot"
    contact_no: List[str] = Field(default_factory=list)
    sqd_id: str

class TechnicianCreate(BaseModel):
    service_id: str
    fname: str
    lname: str
    rank: str = "Staff Sergeant"
    clearance_lvl: str = "Secret"
    specialty: str = "Avionics"
    contact_no: List[str] = Field(default_factory=list)
    sqd_id: str

class AircraftCreate(BaseModel):
    tail_no: str
    model: str
    status: str = "READY"
    sqd_id: str

class MaintenanceLogCreate(BaseModel):
    log_date: str
    issue: str
    severity: str = "ROUTINE"
    technician_service_id: str
    resolved: bool = False

class MissionCreate(BaseModel):
    mission_id: str
    code_name: str
    objective: str
    theater: str
    threat_level: str = "MEDIUM"
    is_combat: bool = False
    is_training: bool = False

class MunitionItem(BaseModel):
    munition_id: str
    quantity: int

class ManifestCreate(BaseModel):
    manifest_id: str
    sortie_code: str
    departure_time: str
    pilot_service_id: str
    aircraft_tail_no: str
    mission_id: str
    loadout: List[MunitionItem] = Field(default_factory=list)

class CypherQueryRequest(BaseModel):
    query: str

# ------------------------------------------------------------------------------
# System & Health Endpoints
# ------------------------------------------------------------------------------
@app.get("/api/status")
def get_system_status():
    try:
        counts = db_client.query("""
            MATCH (n)
            OPTIONAL MATCH (s:Squadron)
            OPTIONAL MATCH (p:Personnel)
            OPTIONAL MATCH (plt:Pilot)
            OPTIONAL MATCH (tch:Technician)
            OPTIONAL MATCH (a:Aircraft)
            OPTIONAL MATCH (m:Mission)
            OPTIONAL MATCH (mu:Munition)
            OPTIONAL MATCH (fm:FlightManifest)
            RETURN 
                count(DISTINCT n) AS total_nodes,
                count(DISTINCT s) AS squadrons,
                count(DISTINCT p) AS personnel,
                count(DISTINCT plt) AS pilots,
                count(DISTINCT tch) AS technicians,
                count(DISTINCT a) AS aircraft,
                count(DISTINCT m) AS missions,
                count(DISTINCT mu) AS munitions,
                count(DISTINCT fm) AS manifests
        """)
        return {
            "status": "ONLINE",
            "database": "Neo4j Graph Database 5.x",
            "defcon": 3,
            "metrics": counts[0] if counts else {}
        }
    except Exception as e:
        return {"status": "DEGRADED", "error": str(e)}

@app.post("/api/system/init-schema")
def init_schema():
    try:
        schema_path = os.path.join(os.path.dirname(__file__), "..", "database", "schema.cypher")
        with open(schema_path, "r") as f:
            content = f.read()
        db_client.execute_script(content)
        return {"message": "Schema constraints and indexes initialized successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/seed")
def seed_database():
    try:
        seed_path = os.path.join(os.path.dirname(__file__), "..", "database", "seed_data.cypher")
        with open(seed_path, "r") as f:
            content = f.read()
        db_client.execute_script(content)
        return {"message": "Military tactical dataset seeded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/reset")
def reset_database():
    try:
        db_client.query("MATCH (n) DETACH DELETE n")
        return {"message": "Database cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------------------------
# 1. Squadron Endpoints (Recursive Reports_to, Commands, Employs)
# ------------------------------------------------------------------------------
@app.get("/api/squadrons")
def get_squadrons():
    cypher = """
        MATCH (s:Squadron)
        OPTIONAL MATCH (s)-[:REPORTS_TO]->(cmd:Squadron)
        OPTIONAL MATCH (s)-[:COMMANDS]->(a:Aircraft)
        OPTIONAL MATCH (s)-[:EMPLOYS]->(p:Personnel)
        RETURN 
            s.sqd_id AS sqd_id,
            s.callsign AS callsign,
            s.specialization AS specialization,
            cmd.sqd_id AS commander_sqd_id,
            cmd.callsign AS commander_callsign,
            count(DISTINCT a) AS aircraft_count,
            count(DISTINCT p) AS personnel_count
        ORDER BY s.sqd_id
    """
    return db_client.query(cypher)

@app.get("/api/squadrons/hierarchy")
def get_squadron_hierarchy():
    # Recursive variable-length path traversal
    cypher = """
        MATCH (sub:Squadron)
        OPTIONAL MATCH path = (sub)-[:REPORTS_TO*1..5]->(cmd:Squadron)
        RETURN 
            sub.sqd_id AS subordinate_id,
            sub.callsign AS subordinate_callsign,
            [n in nodes(path) | {id: n.sqd_id, callsign: n.callsign}] AS chain_of_command
    """
    return db_client.query(cypher)

@app.post("/api/squadrons")
def create_squadron(data: SquadronCreate):
    cypher = """
        MERGE (s:Squadron {sqd_id: $sqd_id})
        SET s.callsign = $callsign, s.specialization = $specialization
    """
    db_client.query(cypher, data.model_dump())
    if data.commander_sqd_id:
        link_cypher = """
            MATCH (s:Squadron {sqd_id: $sqd_id})
            MATCH (cmd:Squadron {sqd_id: $commander_sqd_id})
            MERGE (s)-[:REPORTS_TO]->(cmd)
        """
        db_client.query(link_cypher, {"sqd_id": data.sqd_id, "commander_sqd_id": data.commander_sqd_id})
    return {"message": f"Squadron {data.sqd_id} commissioned."}

# ------------------------------------------------------------------------------
# 2. Personnel Endpoints (Disjoint Subclasses: Pilot vs Technician)
# ------------------------------------------------------------------------------
@app.get("/api/personnel")
def get_personnel(role: Optional[str] = Query(None, description="all, pilot, or technician")):
    label_filter = ""
    if role == "pilot":
        label_filter = ":Pilot"
    elif role == "technician":
        label_filter = ":Technician"
    
    cypher = f"""
        MATCH (p:Personnel{label_filter})
        OPTIONAL MATCH (s:Squadron)-[:EMPLOYS]->(p)
        RETURN 
            p.service_id AS service_id,
            p.fname AS fname,
            p.lname AS lname,
            p.fname + ' ' + p.lname AS full_name,
            p.callsign AS callsign,
            p.rank AS rank,
            p.total_flight_hours AS total_flight_hours,
            p.contact_no AS contact_no,
            p.flight_rating AS flight_rating,
            p.clearance_lvl AS clearance_lvl,
            p.specialty AS specialty,
            CASE 
                WHEN 'Pilot' IN labels(p) THEN 'Pilot'
                WHEN 'Technician' IN labels(p) THEN 'Technician'
                ELSE 'Personnel'
            END AS role,
            s.sqd_id AS sqd_id,
            s.callsign AS squadron_callsign
        ORDER BY p.service_id
    """
    return db_client.query(cypher)

@app.post("/api/personnel/pilot")
def create_pilot(data: PilotCreate):
    cypher = """
        MATCH (s:Squadron {sqd_id: $sqd_id})
        CREATE (p:Personnel:Pilot {
            service_id: $service_id,
            fname: $fname,
            lname: $lname,
            callsign: $callsign,
            rank: $rank,
            total_flight_hours: $total_flight_hours,
            flight_rating: $flight_rating,
            contact_no: $contact_no
        })
        CREATE (s)-[:EMPLOYS]->(p)
        RETURN p.service_id AS id
    """
    res = db_client.query(cypher, data.model_dump())
    if not res:
        raise HTTPException(status_code=400, detail="Squadron not found or pilot could not be created.")
    return {"message": f"Pilot {data.service_id} created and assigned to {data.sqd_id}."}

@app.post("/api/personnel/technician")
def create_technician(data: TechnicianCreate):
    cypher = """
        MATCH (s:Squadron {sqd_id: $sqd_id})
        CREATE (t:Personnel:Technician {
            service_id: $service_id,
            fname: $fname,
            lname: $lname,
            rank: $rank,
            clearance_lvl: $clearance_lvl,
            specialty: $specialty,
            total_flight_hours: 0.0,
            contact_no: $contact_no
        })
        CREATE (s)-[:EMPLOYS]->(t)
        RETURN t.service_id AS id
    """
    res = db_client.query(cypher, data.model_dump())
    if not res:
        raise HTTPException(status_code=400, detail="Squadron not found or technician could not be created.")
    return {"message": f"Technician {data.service_id} assigned to {data.sqd_id}."}

@app.post("/api/personnel/{service_id}/contact")
def add_contact_number(service_id: str, contact_no: str):
    cypher = """
        MATCH (p:Personnel {service_id: $service_id})
        SET p.contact_no = coalesce(p.contact_no, []) + [$contact_no]
        RETURN p.service_id AS id, p.contact_no AS contacts
    """
    res = db_client.query(cypher, {"service_id": service_id, "contact_no": contact_no})
    if not res:
        raise HTTPException(status_code=404, detail="Personnel not found.")
    return res[0]

# ------------------------------------------------------------------------------
# 3. Aircraft & Maintenance Logs (Weak Entity with Partial Key log_date)
# ------------------------------------------------------------------------------
@app.get("/api/aircraft")
def get_aircraft():
    cypher = """
        MATCH (a:Aircraft)
        OPTIONAL MATCH (s:Squadron)-[:COMMANDS]->(a)
        OPTIONAL MATCH (a)-[:REQUIRES]->(l:MaintenanceLog)
        RETURN 
            a.tail_no AS tail_no,
            a.model AS model,
            a.status AS status,
            s.sqd_id AS sqd_id,
            s.callsign AS squadron_callsign,
            count(l) AS maintenance_count,
            count(CASE WHEN l.resolved = false THEN 1 END) AS active_issues
        ORDER BY a.tail_no
    """
    return db_client.query(cypher)

@app.post("/api/aircraft")
def create_aircraft(data: AircraftCreate):
    cypher = """
        MATCH (s:Squadron {sqd_id: $sqd_id})
        CREATE (a:Aircraft {
            tail_no: $tail_no,
            model: $model,
            status: $status
        })
        CREATE (s)-[:COMMANDS]->(a)
        RETURN a.tail_no AS id
    """
    res = db_client.query(cypher, data.model_dump())
    if not res:
        raise HTTPException(status_code=400, detail="Squadron not found or aircraft already exists.")
    return {"message": f"Aircraft {data.tail_no} inducted into fleet."}

@app.patch("/api/aircraft/{tail_no}/status")
def update_aircraft_status(tail_no: str, status: str):
    valid_statuses = ["READY", "IN_FLIGHT", "MAINTENANCE", "RESERVE"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    cypher = """
        MATCH (a:Aircraft {tail_no: $tail_no})
        SET a.status = $status
        RETURN a.tail_no AS tail_no, a.status AS status
    """
    res = db_client.query(cypher, {"tail_no": tail_no, "status": status})
    if not res:
        raise HTTPException(status_code=404, detail="Aircraft not found.")
    return res[0]

@app.get("/api/aircraft/{tail_no}/logs")
def get_aircraft_logs(tail_no: str):
    cypher = """
        MATCH (a:Aircraft {tail_no: $tail_no})-[:REQUIRES]->(l:MaintenanceLog)
        OPTIONAL MATCH (t:Technician {service_id: l.technician_service_id})
        RETURN 
            l.log_id AS log_id,
            l.log_date AS log_date,
            l.issue AS issue,
            l.severity AS severity,
            l.resolved AS resolved,
            l.technician_service_id AS technician_id,
            t.fname + ' ' + t.lname AS technician_name
        ORDER BY l.log_date DESC
    """
    return db_client.query(cypher, {"tail_no": tail_no})

@app.post("/api/aircraft/{tail_no}/logs")
def add_maintenance_log(tail_no: str, data: MaintenanceLogCreate):
    log_id = f"LOG-{tail_no}-{data.log_date.replace(' ', '-').replace(':', '')}"
    cypher = """
        MATCH (a:Aircraft {tail_no: $tail_no})
        CREATE (l:MaintenanceLog {
            log_id: $log_id,
            log_date: $log_date,
            issue: $issue,
            severity: $severity,
            technician_service_id: $technician_service_id,
            resolved: $resolved
        })
        CREATE (a)-[:REQUIRES]->(l)
        SET a.status = CASE WHEN $resolved = false THEN 'MAINTENANCE' ELSE a.status END
        RETURN l.log_id AS id
    """
    params = data.model_dump()
    params["tail_no"] = tail_no
    params["log_id"] = log_id
    res = db_client.query(cypher, params)
    if not res:
        raise HTTPException(status_code=404, detail="Aircraft not found.")
    return {"message": f"Maintenance log {log_id} recorded for aircraft {tail_no}."}

# ------------------------------------------------------------------------------
# 4. Missions (Overlapping EER Subclasses: Combat, Training, Both)
# ------------------------------------------------------------------------------
@app.get("/api/missions")
def get_missions():
    cypher = """
        MATCH (m:Mission)
        OPTIONAL MATCH (fm:FlightManifest)-[:ASSIGNED_TO_MISSION]->(m)
        RETURN 
            m.mission_id AS mission_id,
            m.code_name AS code_name,
            m.objective AS objective,
            m.threat_level AS threat_level,
            m.theater AS theater,
            'Combat_mission' IN labels(m) AS is_combat,
            'Training_mission' IN labels(m) AS is_training,
            labels(m) AS labels,
            count(fm) AS sortie_count
        ORDER BY m.mission_id
    """
    return db_client.query(cypher)

@app.post("/api/missions")
def create_mission(data: MissionCreate):
    if not data.is_combat and not data.is_training:
        raise HTTPException(status_code=400, detail="Mission must be at least Combat, Training, or both.")
    
    labels = ["Mission"]
    if data.is_combat:
        labels.append("Combat_mission")
    if data.is_training:
        labels.append("Training_mission")
    
    label_str = ":" + ":".join(labels)
    cypher = f"""
        CREATE (m{label_str} {{
            mission_id: $mission_id,
            code_name: $code_name,
            objective: $objective,
            threat_level: $threat_level,
            theater: $theater
        }})
        RETURN m.mission_id AS id
    """
    res = db_client.query(cypher, data.model_dump())
    return {"message": f"Mission {data.mission_id} registered with labels {labels}."}

# ------------------------------------------------------------------------------
# 5. Munitions Armory
# ------------------------------------------------------------------------------
@app.get("/api/munitions")
def get_munitions():
    cypher = """
        MATCH (mu:Munition)
        OPTIONAL MATCH (fm:FlightManifest)-[rel:LOADED_WITH]->(mu)
        RETURN 
            mu.munition_id AS munition_id,
            mu.type AS type,
            mu.stock AS stock,
            coalesce(sum(rel.quantity), 0) AS allocated_in_manifests
        ORDER BY mu.munition_id
    """
    return db_client.query(cypher)

@app.patch("/api/munitions/{munition_id}/stock")
def update_munition_stock(munition_id: str, delta: int):
    cypher = """
        MATCH (mu:Munition {munition_id: $munition_id})
        SET mu.stock = mu.stock + $delta
        RETURN mu.munition_id AS munition_id, mu.stock AS current_stock
    """
    res = db_client.query(cypher, {"munition_id": munition_id, "delta": delta})
    if not res:
        raise HTTPException(status_code=404, detail="Munition not found.")
    return res[0]

# ------------------------------------------------------------------------------
# 6. Sortie Manifest (Ternary Relationship + Aggregation + Uses_loadout)
# ------------------------------------------------------------------------------
@app.get("/api/manifests")
def get_manifests():
    cypher = """
        MATCH (fm:FlightManifest)
        OPTIONAL MATCH (p:Pilot)-[:OPERATES]->(fm)
        OPTIONAL MATCH (fm)-[:USES_AIRFRAME]->(a:Aircraft)
        OPTIONAL MATCH (fm)-[:ASSIGNED_TO_MISSION]->(m:Mission)
        OPTIONAL MATCH (fm)-[l:LOADED_WITH]->(mu:Munition)
        WITH fm, p, a, m, collect({munition_id: mu.munition_id, type: mu.type, quantity: l.quantity}) AS loadout
        RETURN 
            fm.manifest_id AS manifest_id,
            fm.sortie_code AS sortie_code,
            fm.departure_time AS departure_time,
            fm.status AS status,
            p.service_id AS pilot_id,
            p.fname + ' ' + p.lname AS pilot_name,
            p.callsign AS pilot_callsign,
            a.tail_no AS tail_no,
            a.model AS aircraft_model,
            m.mission_id AS mission_id,
            m.code_name AS mission_name,
            'Combat_mission' IN labels(m) AS is_combat,
            'Training_mission' IN labels(m) AS is_training,
            loadout
        ORDER BY fm.departure_time DESC
    """
    return db_client.query(cypher)

@app.post("/api/manifests")
def create_manifest(data: ManifestCreate):
    # 1. Check Aircraft Status
    ac_check = db_client.query("""
        MATCH (a:Aircraft {tail_no: $tail_no})
        RETURN a.status AS status
    """, {"tail_no": data.aircraft_tail_no})
    if not ac_check:
        raise HTTPException(status_code=404, detail="Aircraft airframe not found.")
    if ac_check[0]["status"] != "READY":
        raise HTTPException(status_code=400, detail=f"Aircraft {data.aircraft_tail_no} is currently {ac_check[0]['status']}, not READY.")

    # 2. Check Pilot Exists
    pilot_check = db_client.query("""
        MATCH (p:Pilot {service_id: $service_id})
        RETURN p.service_id AS id
    """, {"service_id": data.pilot_service_id})
    if not pilot_check:
        raise HTTPException(status_code=404, detail="Pilot not found.")

    # 3. Check Munition Stock
    for item in data.loadout:
        m_check = db_client.query("""
            MATCH (mu:Munition {munition_id: $munition_id})
            RETURN mu.stock AS stock
        """, {"munition_id": item.munition_id})
        if not m_check:
            raise HTTPException(status_code=404, detail=f"Munition {item.munition_id} not found.")
        if m_check[0]["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.munition_id}. Available: {m_check[0]['stock']}, Requested: {item.quantity}")

    # 4. Create FlightManifest node (Aggregation Block) and link Ternary relationships
    create_cypher = """
        MATCH (p:Pilot {service_id: $pilot_id})
        MATCH (a:Aircraft {tail_no: $tail_no})
        MATCH (m:Mission {mission_id: $mission_id})
        CREATE (fm:FlightManifest {
            manifest_id: $manifest_id,
            sortie_code: $sortie_code,
            departure_time: $departure_time,
            status: 'SCHEDULED'
        })
        CREATE (p)-[:OPERATES]->(fm)
        CREATE (fm)-[:USES_AIRFRAME]->(a)
        CREATE (fm)-[:ASSIGNED_TO_MISSION]->(m)
        SET a.status = 'IN_FLIGHT'
        RETURN fm.manifest_id AS id
    """
    res = db_client.query(create_cypher, {
        "manifest_id": data.manifest_id,
        "sortie_code": data.sortie_code,
        "departure_time": data.departure_time,
        "pilot_id": data.pilot_service_id,
        "tail_no": data.aircraft_tail_no,
        "mission_id": data.mission_id
    })

    # 5. Connect Munitions (Uses_loadout M:N relationship) and decrement armory stock
    for item in data.loadout:
        loadout_cypher = """
            MATCH (fm:FlightManifest {manifest_id: $manifest_id})
            MATCH (mu:Munition {munition_id: $munition_id})
            CREATE (fm)-[:LOADED_WITH {quantity: $qty}]->(mu)
            SET mu.stock = mu.stock - $qty
        """
        db_client.query(loadout_cypher, {
            "manifest_id": data.manifest_id,
            "munition_id": item.munition_id,
            "qty": item.quantity
        })

    return {"message": f"Sortie Manifest {data.manifest_id} approved and dispatched!"}

@app.patch("/api/manifests/{manifest_id}/status")
def update_manifest_status(manifest_id: str, status: str):
    cypher = """
        MATCH (fm:FlightManifest {manifest_id: $manifest_id})
        SET fm.status = $status
        WITH fm
        OPTIONAL MATCH (fm)-[:USES_AIRFRAME]->(a:Aircraft)
        SET a.status = CASE 
            WHEN $status = 'COMPLETED' THEN 'READY' 
            WHEN $status = 'ABORTED' THEN 'MAINTENANCE'
            ELSE a.status 
        END
        RETURN fm.manifest_id AS manifest_id, fm.status AS status
    """
    res = db_client.query(cypher, {"manifest_id": manifest_id, "status": status})
    if not res:
        raise HTTPException(status_code=404, detail="Manifest not found.")
    return res[0]

# ------------------------------------------------------------------------------
# 7. Technology-Specific Demonstration Queries & Sandbox
# ------------------------------------------------------------------------------
@app.get("/api/queries/chain-of-command")
def query_chain_of_command():
    cypher = """
        MATCH path = (sub:Squadron)-[:REPORTS_TO*1..5]->(hq:Squadron)
        WHERE NOT (hq)-[:REPORTS_TO]->()
        RETURN 
            sub.sqd_id AS subordinate,
            sub.callsign AS subordinate_callsign,
            [node in nodes(path) | node.callsign] AS hierarchy_path,
            length(path) AS command_depth
        ORDER BY command_depth DESC
    """
    return db_client.query(cypher)

@app.get("/api/queries/readiness-impact")
def query_readiness_impact(tail_no: str = Query("AF-A10-202")):
    # "What missions and sorties are compromised by grounding aircraft X?"
    cypher = """
        MATCH (a:Aircraft {tail_no: $tail_no})
        OPTIONAL MATCH (fm:FlightManifest)-[:USES_AIRFRAME]->(a)
        OPTIONAL MATCH (p:Pilot)-[:OPERATES]->(fm)
        OPTIONAL MATCH (fm)-[:ASSIGNED_TO_MISSION]->(m:Mission)
        OPTIONAL MATCH (a)-[:REQUIRES]->(l:MaintenanceLog)
        RETURN 
            a.tail_no AS tail_no,
            a.model AS model,
            a.status AS current_status,
            collect(DISTINCT {
                manifest_id: fm.manifest_id,
                status: fm.status,
                sortie_code: fm.sortie_code,
                pilot: p.callsign,
                mission: m.code_name
            }) AS affected_sorties,
            collect(DISTINCT {
                log_id: l.log_id,
                date: l.log_date,
                issue: l.issue,
                severity: l.severity
            }) AS maintenance_logs
    """
    return db_client.query(cypher, {"tail_no": tail_no})

@app.get("/api/queries/munition-expenditure")
def query_munition_expenditure():
    cypher = """
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
        ORDER BY mission_classification, total_expended DESC
    """
    return db_client.query(cypher)

@app.post("/api/queries/cypher")
def run_custom_cypher(req: CypherQueryRequest):
    try:
        results = db_client.query(req.query)
        return {"success": True, "count": len(results), "records": results}
    except Exception as e:
        return {"success": False, "error": str(e)}
