import React, { useState, useEffect } from 'react';
import { 
  Shield, Crosshair, Plane, Users, Wrench, 
  Terminal, AlertTriangle, CheckCircle2, RefreshCw, 
  ChevronRight, Plus, Radio, AlertOctagon, Layers, Zap,
  Info, Compass
} from 'lucide-react';
import FighterJetIntro from './components/FighterJetIntro';
import InteractiveTour from './components/InteractiveTour';

// Plain English Tooltip Helper
function Tooltip({ text, children, isNeo }) {
  return (
    <span className="group relative inline-flex items-center cursor-help">
      {children}
      <span className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 p-2 text-[11px] font-normal leading-normal ${
        isNeo 
          ? 'bg-black text-[#00ff66] border-2 border-white/60 shadow-[3px_3px_0px_#000]' 
          : 'rounded-md bg-slate-900 text-slate-100 border border-slate-700 shadow-xl'
      }`}>
        {text}
      </span>
    </span>
  );
}

export default function App() {
  // Visual Theme: Dark Neobrutalism (Fixed)
  const isNeo = true;

  // Fighter Jet Takeoff Intro State
  const [showIntro, setShowIntro] = useState(true);

  // Tour / Guide State
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

  // First-time visitor banner trigger (shows prompt banner instead of sudden popup)
  const handleIntroComplete = () => {
    setShowIntro(false);
    const tourCompleted = localStorage.getItem('apexbase_tour_completed');
    if (!tourCompleted) {
      setShowTourPrompt(true);
    }
  };

  const handleStartTour = () => {
    setShowTourPrompt(false);
    setShowTour(true);
    setTourStep(0);
  };

  const handleDismissPrompt = () => {
    localStorage.setItem('apexbase_tour_completed', 'true');
    setShowTourPrompt(false);
  };

  const handleCloseTour = () => {
    localStorage.setItem('apexbase_tour_completed', 'true');
    setShowTour(false);
  };

  const [activeTab, setActiveTab] = useState('manifests');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Entities Data
  const [squadrons, setSquadrons] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftLogs, setAircraftLogs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [munitions, setMunitions] = useState([]);
  const [manifests, setManifests] = useState([]);

  // Filters
  const [personnelFilter, setPersonnelFilter] = useState('all');
  const [aircraftFilter, setAircraftFilter] = useState('ALL');
  
  // New Sortie Manifest Form
  const [newManifest, setNewManifest] = useState({
    manifest_id: `MAN-2026-${Math.floor(100 + Math.random() * 900)}`,
    sortie_code: '',
    departure_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    pilot_service_id: '',
    aircraft_tail_no: '',
    mission_id: '',
    loadout: []
  });

  // New Maintenance Log Form
  const [newLog, setNewLog] = useState({
    log_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    issue: '',
    severity: 'ROUTINE',
    technician_service_id: '',
    resolved: false
  });

  // Cypher Console
  const [cypherQuery, setCypherQuery] = useState('MATCH (s:Squadron)-[:COMMANDS]->(a:Aircraft) RETURN s.callsign, collect(a.tail_no) AS fleet');
  const [cypherResult, setCypherResult] = useState(null);
  const [cypherLoading, setCypherLoading] = useState(false);

  // Quick Query Results
  const [activeQueryTitle, setActiveQueryTitle] = useState('');
  const [activeQueryResult, setActiveQueryResult] = useState(null);

  // Toast Helper
  const showToast = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all initial data
  const refreshAllData = async () => {
    try {
      setLoading(true);
      const [stRes, sqRes, hiRes, peRes, acRes, miRes, muRes, maRes] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/squadrons').then(r => r.json()),
        fetch('/api/squadrons/hierarchy').then(r => r.json()),
        fetch('/api/personnel').then(r => r.json()),
        fetch('/api/aircraft').then(r => r.json()),
        fetch('/api/missions').then(r => r.json()),
        fetch('/api/munitions').then(r => r.json()),
        fetch('/api/manifests').then(r => r.json())
      ]);
      setStatus(stRes);
      setSquadrons(sqRes || []);
      setHierarchy(hiRes || []);
      setPersonnel(peRes || []);
      setAircraft(acRes || []);
      setMissions(miRes || []);
      setMunitions(muRes || []);
      setManifests(maRes || []);
      if (acRes && acRes.length > 0 && !selectedAircraft) {
        setSelectedAircraft(acRes[0]);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to connect to ApexBase backend C2 service", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Fetch logs when selected aircraft changes
  useEffect(() => {
    if (selectedAircraft) {
      fetch(`/api/aircraft/${selectedAircraft.tail_no}/logs`)
        .then(r => r.json())
        .then(data => setAircraftLogs(data || []))
        .catch(console.error);
    }
  }, [selectedAircraft]);

  // Seeder Action
  const handleSeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/seed', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || "Database seeded successfully");
      await refreshAllData();
    } catch (e) {
      showToast("Seeding failed: " + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Reset Action
  const handleReset = async () => {
    if (!window.confirm("CONFIRMATION REQUIRED: Clear entire Neo4j database graph?")) return;
    try {
      setLoading(true);
      await fetch('/api/system/reset', { method: 'POST' });
      showToast("Database wiped clean.");
      await refreshAllData();
    } catch (e) {
      showToast("Reset failed: " + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Add Contact Number
  const handleAddContact = async (service_id) => {
    const contact = prompt("Enter new emergency contact frequency / number:");
    if (!contact) return;
    try {
      const res = await fetch(`/api/personnel/${service_id}/contact?contact_no=${encodeURIComponent(contact)}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to add contact");
      showToast(`Contact frequency registered for ${service_id}`);
      refreshAllData();
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Update Aircraft Status
  const handleUpdateAircraftStatus = async (tail_no, newStatus) => {
    try {
      const res = await fetch(`/api/aircraft/${tail_no}/status?status=${newStatus}`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Status update failed");
      showToast(`Airframe ${tail_no} reassigned to ${newStatus}`);
      refreshAllData();
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Submit New Maintenance Log
  const handleCreateMaintenanceLog = async (e) => {
    e.preventDefault();
    if (!selectedAircraft) return;
    try {
      const res = await fetch(`/api/aircraft/${selectedAircraft.tail_no}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to log maintenance");
      showToast(data.message);
      setNewLog({
        log_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        issue: '',
        severity: 'ROUTINE',
        technician_service_id: '',
        resolved: false
      });
      refreshAllData();
      const logs = await fetch(`/api/aircraft/${selectedAircraft.tail_no}/logs`).then(r => r.json());
      setAircraftLogs(logs || []);
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Add Munition Item to Sortie Loadout
  const handleAddMunitionToLoadout = (munition_id, quantity) => {
    if (!munition_id || quantity <= 0) return;
    setNewManifest(prev => {
      const existing = prev.loadout.find(i => i.munition_id === munition_id);
      if (existing) {
        return {
          ...prev,
          loadout: prev.loadout.map(i => i.munition_id === munition_id ? { ...i, quantity: i.quantity + quantity } : i)
        };
      }
      return {
        ...prev,
        loadout: [...prev.loadout, { munition_id, quantity }]
      };
    });
  };

  const handleRemoveMunitionFromLoadout = (munition_id) => {
    setNewManifest(prev => ({
      ...prev,
      loadout: prev.loadout.filter(i => i.munition_id !== munition_id)
    }));
  };

  // Dispatch Sortie
  const handleDispatchSortie = async (e) => {
    e.preventDefault();
    if (!newManifest.pilot_service_id || !newManifest.aircraft_tail_no || !newManifest.mission_id) {
      showToast("Please select Pilot, Airframe, and Target Mission.", true);
      return;
    }
    try {
      const res = await fetch('/api/manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManifest)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to dispatch sortie");
      showToast(data.message);
      setNewManifest({
        manifest_id: `MAN-2026-${Math.floor(100 + Math.random() * 900)}`,
        sortie_code: '',
        departure_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        pilot_service_id: '',
        aircraft_tail_no: '',
        mission_id: '',
        loadout: []
      });
      refreshAllData();
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Update Manifest Status
  const handleUpdateManifestStatus = async (manifest_id, newStatus) => {
    try {
      const res = await fetch(`/api/manifests/${manifest_id}/status?status=${newStatus}`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Status update failed");
      showToast(`Sortie ${manifest_id} status updated to ${newStatus}`);
      refreshAllData();
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Adjust Munition Stock
  const handleAdjustStock = async (munition_id, delta) => {
    try {
      const res = await fetch(`/api/munitions/${munition_id}/stock?delta=${delta}`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Failed to adjust stock");
      showToast(`Munition ${munition_id} stock updated.`);
      refreshAllData();
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Run Custom Cypher
  const handleRunCypher = async (queryText = cypherQuery) => {
    try {
      setCypherLoading(true);
      const res = await fetch('/api/queries/cypher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data = await res.json();
      setCypherResult(data);
    } catch (e) {
      setCypherResult({ success: false, error: e.message });
    } finally {
      setCypherLoading(false);
    }
  };

  // Execute Pre-built Tactical Queries
  const runPresetQuery = async (type) => {
    try {
      setLoading(true);
      if (type === 'chain') {
        setActiveQueryTitle("Hierarchical Chain of Command Traversal (Recursive Reports_to*1..5)");
        const res = await fetch('/api/queries/chain-of-command').then(r => r.json());
        setActiveQueryResult(res);
      } else if (type === 'impact') {
        setActiveQueryTitle("Readiness Impact Matrix (Grounding Aircraft AF-A10-202)");
        const res = await fetch('/api/queries/readiness-impact?tail_no=AF-A10-202').then(r => r.json());
        setActiveQueryResult(res);
      } else if (type === 'expenditure') {
        setActiveQueryTitle("Munitions Expenditure by Mission Classification (Combat vs Training)");
        const res = await fetch('/api/queries/munition-expenditure').then(r => r.json());
        setActiveQueryResult(res);
      }
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const navTabs = [
    { id: 'manifests', label: '01 SORTIE DISPATCHER', icon: Plane },
    { id: 'hierarchy', label: '02 COMMAND HIERARCHY', icon: Layers },
    { id: 'roster', label: '03 PERSONNEL ROSTER', icon: Users },
    { id: 'fleet', label: '04 FLEET & LOGS', icon: Wrench },
    { id: 'armory', label: '05 MUNITIONS ARMORY', icon: Shield },
    { id: 'console', label: '06 GRAPH INTEL CONSOLE', icon: Terminal },
  ];

  // Guided Walkthrough Steps that dynamically move through the website
  const tourSteps = [
    {
      target: '[data-tour="brand"]',
      title: "ApexBase Tactical C2 Center",
      subtitle: "SYSTEM OVERVIEW // STEP 01",
      content: (
        <p>
          Welcome Commander! <strong>ApexBase</strong> is the Air Combat Command operations management system. It schedules combat sorties, manages pilot & technician rosters, oversees fleet maintenance, and balances munitions armory inventory powered by a high-speed <strong>Neo4j graph database</strong>.
        </p>
      ),
      tip: "Use the Next button or arrow keys (→ / ←) on your keyboard to navigate through the live stations.",
      placement: 'bottom'
    },
    {
      target: '[data-tour="header-actions"]',
      title: "Operations Toolbar & Controls",
      subtitle: "TOP TOOLBAR // STEP 02",
      content: (
        <p>
          Use the top toolbar to replay the Fighter Jet intro, launch the Interactive Guide, or manually populate demo data with the <strong className="text-[#ffe600]">Seed Demo</strong> button. (Everything is manual; no data is seeded without your click!)
        </p>
      ),
      tip: "You can restart this interactive walkthrough anytime by clicking the 'Interactive Guide' button.",
      placement: 'bottom'
    },
    {
      target: '[data-tour="telemetry-bar"]',
      title: "Live Airbase Telemetry HUD",
      subtitle: "REAL-TIME METRICS // STEP 03",
      content: (
        <p>
          Status metrics pulled live from Neo4j. Monitor total registered <strong>Squadrons</strong>, flight-ready <strong>Airframes</strong>, active <strong>Pilots vs Technicians</strong>, running <strong>Sorties</strong>, and underlying <strong>Neo4j graph nodes</strong>. These numbers update in real time as missions are launched.
        </p>
      ),
      placement: 'bottom'
    },
    {
      target: '[data-tour="nav-tabs"]',
      title: "Tactical Navigation Deck",
      subtitle: "6 MODULES // STEP 04",
      content: (
        <p>
          These 6 modules map directly to our DBMS EER schema: <strong>Sortie Dispatcher</strong>, <strong>Command Hierarchy</strong>, <strong>Personnel Roster</strong>, <strong>Fleet & Logs</strong>, <strong>Munitions Armory</strong>, and <strong>Graph Intel Console</strong>. Let's inspect each station!
        </p>
      ),
      placement: 'bottom'
    },
    {
      tab: 'manifests',
      target: '[data-tour="dispatch-form"]',
      title: "Sortie Dispatch Engine",
      subtitle: "MODULE 01 // TERNARY DISPATCH",
      content: (
        <p>
          A <strong className="text-[#00ff66]">Sortie</strong> is one individual military flight made by one aircraft. Assemble your flight here: choose a flight callsign, pick a mission, assign an active Pilot, select an airworthy Jet (must have <strong>READY</strong> status), and configure missile loadout.
        </p>
      ),
      tip: "In DBMS terms, this is a Ternary Relationship (Pilot + Aircraft + Mission) aggregated with Munitions (M:N) via an associative hyperedge node.",
      placement: 'right'
    },
    {
      tab: 'manifests',
      target: '[data-tour="sortie-ledger"]',
      title: "Live Sortie Operations Ledger",
      subtitle: "MODULE 01 // SORTIE TRACKING",
      content: (
        <p>
          All dispatched flights appear here in real-time. Flight controllers can monitor flight progress, inspect assigned pilot and aircraft tail numbers, and click the status buttons to transition flights (<strong>Airborne</strong>, <strong>Returned</strong>, <strong>Completed</strong>, or <strong>Aborted</strong>).
        </p>
      ),
      placement: 'left'
    },
    {
      tab: 'hierarchy',
      target: '[data-tour="hierarchy-section"]',
      title: "Recursive Command Hierarchy",
      subtitle: "MODULE 02 // UNARY 1:N RECURSION",
      content: (
        <p>
          Visualizes the squadron chain of command. In relational SQL, recursive queries require expensive Common Table Expressions (<code className="text-[#00e5ff]">WITH RECURSIVE</code>). In Neo4j, Cypher traverses the <code className="text-[#00e5ff]">'(:Squadron)-[:REPORTS_TO*1..5]-&gt;(:Squadron)'</code> path in single graph hops with zero join overhead.
        </p>
      ),
      tip: "Look at the echelon path tags: every subordinate squadron traces directly up to Supreme HQ.",
      placement: 'bottom'
    },
    {
      tab: 'roster',
      target: '[data-tour="roster-section"]',
      title: "Personnel Directory (Disjoint Subclasses)",
      subtitle: "MODULE 03 // DISJOINT ROLES",
      content: (
        <p>
          Personnel follow strict disjoint specialization ('d'): a member is either a <strong>Pilot</strong> (with flight rating & cumulative flight hours) OR a <strong>Technician</strong> (with security clearance & repair specialty). Multivalued emergency contact numbers are also managed here.
        </p>
      ),
      placement: 'bottom'
    },
    {
      tab: 'fleet',
      target: '[data-tour="fleet-section"]',
      title: "Fleet Hangar & Maintenance Logs",
      subtitle: "MODULE 04 // WEAK ENTITY IDENTIFICATION",
      content: (
        <p>
          Inspect every hangar airframe. When an aircraft suffers equipment failure, technicians submit a <strong>Maintenance Log</strong> (modeled as a weak entity identified by the parent Aircraft tail number). Airframes marked <strong>MAINTENANCE</strong> cannot be dispatched on sorties!
        </p>
      ),
      placement: 'bottom'
    },
    {
      tab: 'armory',
      target: '[data-tour="armory-section"]',
      title: "Munitions Armory (Weapons Depletion)",
      subtitle: "MODULE 05 // USES_LOADOUT M:N",
      content: (
        <p>
          Tracks the missile magazine (AIM-120D AMRAAM, AGM-65 Maverick, JDAM bombs). When a sortie is authorized, munitions are deducted from stock. Technicians can use the '+10' or '+50' buttons to restock supply crates.
        </p>
      ),
      placement: 'bottom'
    },
    {
      tab: 'console',
      target: '[data-tour="console-section"]',
      title: "Graph Intel & Cypher Demonstrations",
      subtitle: "MODULE 06 // CYPHER TERMINAL",
      content: (
        <p>
          The analytical powerhouse of Neo4j. Click any of the 3 cards highlighted below to run instant graph intel reports (Grounding Blast-Radius impact, Chain-of-Command paths, or Munition Expenditure). You are now fully briefed, Commander!
        </p>
      ),
      tip: "Click 'Launch & Explore' to take full command of ApexBase!",
      placement: 'bottom'
    }
  ];

  return (
    <div className={`min-h-screen text-slate-100 font-mono pb-20 transition-colors duration-200 ${
      isNeo 
        ? 'bg-[#0d0f17] neo-grid-bg selection:bg-[#00ff66] selection:text-black' 
        : 'bg-[#080c14] subtle-grid-bg selection:bg-emerald-500 selection:text-black'
    }`}>
      {/* Starting Animation (ApexBase heading -> Jet Takeoff -> Website fades in) */}
      {showIntro && <FighterJetIntro onComplete={handleIntroComplete} />}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-all ${
          isNeo
            ? `border-2 border-black shadow-neo-black ${notification.isError ? 'bg-[#ff3366] text-white' : 'bg-[#00ff66] text-black'}`
            : `rounded-lg shadow-xl border backdrop-blur-md ${notification.isError ? 'bg-rose-950/90 text-rose-200 border-rose-800' : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'}`
        }`}>
          {notification.isError ? <AlertOctagon className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Interactive Step-by-Step Guided Walkthrough (Moves through the website with spotlight & dialog boxes) */}
      <InteractiveTour
        isOpen={showTour}
        steps={tourSteps}
        currentStep={tourStep}
        onStepChange={setTourStep}
        onClose={handleCloseTour}
        onTabChange={setActiveTab}
        isNeo={isNeo}
      />

      {/* Top Application Bar */}
      <header className={`border-b sticky top-0 z-40 transition-colors ${
        isNeo 
          ? 'bg-[#141724] border-black border-b-2' 
          : 'bg-[#0d131f]/90 border-slate-800/80 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Branding */}
            <div className="flex items-center gap-3" data-tour="brand">
              <div className={`w-9 h-9 flex items-center justify-center ${
                isNeo 
                  ? 'bg-[#00ff66] text-black border-2 border-black shadow-neo-black' 
                  : 'rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              }`}>
                <Crosshair className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white tracking-tight uppercase">ApexBase</span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold hidden sm:block">Tactical Air Fleet & Sortie Operations Command</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2" data-tour="header-actions">
              
              {/* JET INTRO BUTTON */}
              <button
                onClick={() => setShowIntro(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase cursor-pointer ${
                  isNeo 
                    ? 'bg-[#00ff66] text-black border-2 border-black shadow-neo-black neo-pressable' 
                    : 'rounded-md text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800 transition-colors'
                }`}
                title="Replay Cinematic Fighter Jet Launch Animation"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Jet Intro</span>
              </button>

              {/* HOW IT WORKS / INTERACTIVE TOUR BUTTON */}
              <button
                onClick={() => { setShowTour(true); setTourStep(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase cursor-pointer ${
                  isNeo 
                    ? 'bg-[#00e5ff] text-black border-2 border-black shadow-neo-black neo-pressable' 
                    : 'rounded-md text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800 transition-colors'
                }`}
                title="Start the interactive step-by-step walkthrough"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Interactive Guide</span>
              </button>

              <button 
                onClick={handleSeed}
                disabled={loading}
                title="Populate demo planes, pilots, and munitions"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase cursor-pointer ${
                  isNeo 
                    ? 'bg-[#ffe600] text-black border-2 border-black shadow-neo-black neo-pressable' 
                    : 'rounded-md text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-colors'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Seed Demo</span>
              </button>
              <button 
                onClick={handleReset}
                disabled={loading}
                title="Wipe database graph"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase cursor-pointer ${
                  isNeo 
                    ? 'bg-[#ff3366] text-white border-2 border-black shadow-neo-black neo-pressable' 
                    : 'rounded-md text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/60 transition-colors'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset DB</span>
              </button>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div 
            data-tour="telemetry-bar"
            className={`grid grid-cols-2 sm:grid-cols-5 gap-2.5 py-2.5 border-t ${
              isNeo ? 'border-black' : 'border-slate-800/60'
            }`}
          >
            <Tooltip text="Number of military squadrons registered in base operations" isNeo={isNeo}>
              <div className={`w-full px-3 py-2 flex flex-col justify-between ${
                isNeo ? 'bg-[#181b2a] border-2 border-black shadow-neo-black' : 'bg-[#0b0f19] border border-slate-800/80 rounded-md'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase font-black">Squadrons</span>
                <span className={`text-base font-black ${isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}`}>
                  {status?.metrics?.squadrons ?? 5}
                </span>
              </div>
            </Tooltip>

            <Tooltip text="Total fighter jets & bombers stationed at the airbase" isNeo={isNeo}>
              <div className={`w-full px-3 py-2 flex flex-col justify-between ${
                isNeo ? 'bg-[#181b2a] border-2 border-black shadow-neo-black' : 'bg-[#0b0f19] border border-slate-800/80 rounded-md'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase font-black">Fleet Airframes</span>
                <span className={`text-base font-black ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`}>
                  {status?.metrics?.aircraft ?? 8}
                </span>
              </div>
            </Tooltip>

            <Tooltip text="Active Flight Pilots versus Ground Maintenance Technicians" isNeo={isNeo}>
              <div className={`w-full px-3 py-2 flex flex-col justify-between ${
                isNeo ? 'bg-[#181b2a] border-2 border-black shadow-neo-black' : 'bg-[#0b0f19] border border-slate-800/80 rounded-md'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase font-black">Pilots / Techs</span>
                <span className={`text-base font-black ${isNeo ? 'text-[#ffe600]' : 'text-amber-400'}`}>
                  {status?.metrics?.pilots ?? 5} <span className="text-slate-500 font-normal">/</span> {status?.metrics?.technicians ?? 4}
                </span>
              </div>
            </Tooltip>

            <Tooltip text="Single flights planned, airborne, or completed in the system" isNeo={isNeo}>
              <div className={`w-full px-3 py-2 flex flex-col justify-between ${
                isNeo ? 'bg-[#181b2a] border-2 border-black shadow-neo-black' : 'bg-[#0b0f19] border border-slate-800/80 rounded-md'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase font-black">Total Sorties</span>
                <span className={`text-base font-black ${isNeo ? 'text-[#ff3366]' : 'text-indigo-400'}`}>
                  {status?.metrics?.manifests ?? 4}
                </span>
              </div>
            </Tooltip>

            <Tooltip text="Graph nodes stored inside the Neo4j database engine" isNeo={isNeo}>
              <div className={`w-full px-3 py-2 col-span-2 sm:col-span-1 flex flex-col justify-between ${
                isNeo ? 'bg-[#181b2a] border-2 border-black shadow-neo-black' : 'bg-[#0b0f19] border border-slate-800/80 rounded-md'
              }`}>
                <span className="text-[10px] text-slate-400 uppercase font-black">Neo4j Nodes</span>
                <span className="text-base font-black text-white">{status?.metrics?.total_nodes ?? 40}</span>
              </div>
            </Tooltip>
          </div>

          {/* Navigation Bar */}
          <nav 
            data-tour="nav-tabs"
            className="flex items-center gap-1.5 overflow-x-auto py-2 -mb-px"
          >
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase whitespace-nowrap cursor-pointer transition-all ${
                    isNeo
                      ? `border-2 border-black neo-pressable ${isSelected ? 'bg-[#00ff66] text-black shadow-neo-black' : 'bg-[#181b2a] text-slate-300 shadow-[2px_2px_0px_#000] hover:bg-[#222538]'}`
                      : `rounded-md ${isSelected ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* First-Time Visitor Guide Invitation Banner */}
        {showTourPrompt && !showTour && (
          <div className={`mb-6 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
            isNeo 
              ? 'bg-[#151726] border-2 border-[#00e5ff] shadow-[4px_4px_0px_#000]' 
              : 'bg-cyan-950/40 border border-cyan-800 rounded-lg'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                isNeo ? 'bg-[#00e5ff] text-black border border-black' : 'rounded bg-cyan-500/20 text-cyan-400'
              }`}>
                <Compass className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-white text-xs uppercase block tracking-wider">First Time at ApexBase?</span>
                <p className="text-slate-300 text-[11px] font-sans">
                  Take a 1-minute interactive guided walkthrough across the fighter operations stations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleStartTour}
                className={`px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer ${
                  isNeo 
                    ? 'bg-[#00ff66] text-black border-2 border-black shadow-[2px_2px_0px_#000] neo-pressable' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded'
                }`}
              >
                Start Interactive Guide <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                onClick={handleDismissPrompt}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 1: SORTIE DISPATCHER
           ===================================================================== */}
        {activeTab === 'manifests' && (
          <div className="space-y-5">
            {/* Module Overview Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
              isNeo ? 'border-black' : 'border-slate-800/80'
            }`}>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Plane className={`w-4 h-4 ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`} />
                  Sortie Dispatcher
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  Assemble and authorize operational flights by pairing available jets, qualified pilots, and weapons.
                </p>
              </div>
            </div>

            {/* Beginner Explanation Banner */}
            <div className={`p-3 text-xs font-bold flex items-start gap-2.5 ${
              isNeo ? 'bg-[#151726] border-2 border-black shadow-[2px_2px_0px_#000]' : 'bg-[#0e1422] border border-slate-800 rounded-md'
            }`}>
              <Info className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#00ff66] uppercase font-black mr-1">In Simple Terms:</span>
                A <strong>Sortie</strong> is one individual flight made by a military plane. Use the form on the left to pick an objective, a certified pilot, an airworthy jet (must be <strong>READY</strong>), and missiles, then click <strong>Authorize & Dispatch</strong> to take off!
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form */}
              <div className="lg:col-span-5 space-y-4">
                <div 
                  data-tour="dispatch-form"
                  className={`p-5 ${
                    isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
                  }`}
                >
                  <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
                    isNeo ? 'border-black' : 'border-slate-800'
                  }`}>
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isNeo ? 'text-[#00ff66]' : 'text-emerald-400'
                    }`}>
                      <Crosshair className="w-3.5 h-3.5 stroke-[3]" /> Assemble Sortie Manifest
                    </span>
                    <Tooltip text="Auto-generated unique tracking ID for this flight instance" isNeo={isNeo}>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
                        isNeo ? 'bg-black text-[#00e5ff] border border-slate-700' : 'rounded bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {newManifest.manifest_id}
                      </span>
                    </Tooltip>
                  </div>

                  <form onSubmit={handleDispatchSortie} className="space-y-4 text-xs font-bold">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 uppercase">Sortie Callsign / Identifier</label>
                        <Tooltip text="A human-readable radio callsign for this specific flight (e.g. VIPER-09)" isNeo={isNeo}>
                          <span className="text-[10px] text-slate-500 underline cursor-help">What's this?</span>
                        </Tooltip>
                      </div>
                      <input 
                        type="text" 
                        placeholder="e.g. VIPER-09-INTERCEPT"
                        value={newManifest.sortie_code}
                        onChange={e => setNewManifest({ ...newManifest, sortie_code: e.target.value })}
                        required
                        className={`w-full px-3 py-2 text-white placeholder-slate-500 outline-none ${
                          isNeo ? 'bg-[#090b12] border-2 border-black focus:border-[#00ff66]' : 'rounded bg-[#0a0d16] border border-slate-700/80 focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 uppercase">Target Mission</label>
                        <Tooltip text="The overarching military objective (Combat, Training, or Joint both)" isNeo={isNeo}>
                          <span className="text-[10px] text-slate-500 underline cursor-help">Objective type</span>
                        </Tooltip>
                      </div>
                      <select 
                        value={newManifest.mission_id}
                        onChange={e => setNewManifest({ ...newManifest, mission_id: e.target.value })}
                        required
                        className={`w-full px-3 py-2 text-white outline-none ${
                          isNeo ? 'bg-[#090b12] border-2 border-black focus:border-[#00ff66]' : 'rounded bg-[#0a0d16] border border-slate-700/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">-- Select Mission --</option>
                        {missions.map(m => (
                          <option key={m.mission_id} value={m.mission_id}>
                            {m.mission_id}: {m.code_name} [{m.is_combat && m.is_training ? 'Combat + Training' : m.is_combat ? 'Combat' : 'Training'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-300 uppercase">Assigned Pilot</label>
                          <Tooltip text="Qualified personnel member with verified flight hours" isNeo={isNeo}>
                            <span className="text-[10px] text-slate-500 underline cursor-help">Pilot</span>
                          </Tooltip>
                        </div>
                        <select 
                          value={newManifest.pilot_service_id}
                          onChange={e => setNewManifest({ ...newManifest, pilot_service_id: e.target.value })}
                          required
                          className={`w-full px-3 py-2 text-white outline-none ${
                            isNeo ? 'bg-[#090b12] border-2 border-black focus:border-[#00ff66]' : 'rounded bg-[#0a0d16] border border-slate-700/80 focus:border-emerald-500'
                          }`}
                        >
                          <option value="">-- Select Pilot --</option>
                          {personnel.filter(p => p.role === 'Pilot').map(p => (
                            <option key={p.service_id} value={p.service_id}>
                              {p.callsign || p.full_name} ({p.flight_rating?.slice(0, 2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-300 uppercase">Airframe (READY Only)</label>
                          <Tooltip text="Only jets marked READY can fly. MAINTENANCE and IN_FLIGHT planes are locked." isNeo={isNeo}>
                            <span className="text-[10px] text-slate-500 underline cursor-help">Status check</span>
                          </Tooltip>
                        </div>
                        <select 
                          value={newManifest.aircraft_tail_no}
                          onChange={e => setNewManifest({ ...newManifest, aircraft_tail_no: e.target.value })}
                          required
                          className={`w-full px-3 py-2 text-white outline-none ${
                            isNeo ? 'bg-[#090b12] border-2 border-black focus:border-[#00ff66]' : 'rounded bg-[#0a0d16] border border-slate-700/80 focus:border-emerald-500'
                          }`}
                        >
                          <option value="">-- Select Airframe --</option>
                          {aircraft.map(a => (
                            <option 
                              key={a.tail_no} 
                              value={a.tail_no}
                              disabled={a.status !== 'READY'}
                            >
                              {a.tail_no} - {a.model} ({a.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Munitions Loadout Selection */}
                    <div className={`pt-3 border-t ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 uppercase text-xs flex items-center gap-1.5 font-bold">
                          <Shield className={`w-3.5 h-3.5 ${isNeo ? 'text-[#ffe600]' : 'text-amber-400'}`} />
                          Weapons Hardpoints
                        </span>
                        <Tooltip text="Weapons loaded on the jet wings. Stock is decremented in real-time." isNeo={isNeo}>
                          <span className="text-[10px] text-slate-400 font-bold underline cursor-help">Live Armory Check</span>
                        </Tooltip>
                      </div>

                      <div className="space-y-2">
                        {newManifest.loadout.map(item => {
                          const mun = munitions.find(m => m.munition_id === item.munition_id);
                          return (
                            <div key={item.munition_id} className={`flex items-center justify-between px-3 py-2 ${
                              isNeo ? 'bg-[#090b12] border-2 border-black shadow-[2px_2px_0px_#000]' : 'rounded bg-[#0b0e18] border border-slate-800'
                            }`}>
                              <div>
                                <span className={`font-black ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`}>{item.munition_id}</span>
                                <span className="text-[11px] text-slate-400 ml-2">({mun?.type})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black ${isNeo ? 'text-[#ffe600]' : 'text-amber-300'}`}>Qty: {item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMunitionFromLoadout(item.munition_id)}
                                  className="w-5 h-5 flex items-center justify-center font-black text-rose-400 hover:text-white cursor-pointer"
                                  title="Remove weapon"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Hardpoint Controls */}
                        <div className="flex gap-2 mt-2">
                          <select 
                            id="add-mun-id"
                            className={`flex-1 px-2.5 py-1.5 text-xs text-white outline-none font-bold ${
                              isNeo ? 'bg-[#090b12] border-2 border-black' : 'rounded bg-[#0a0d16] border border-slate-700/80'
                            }`}
                          >
                            {munitions.map(m => (
                              <option key={m.munition_id} value={m.munition_id}>
                                {m.munition_id} (Avail: {m.stock})
                              </option>
                            ))}
                          </select>
                          <input 
                            type="number" 
                            id="add-mun-qty" 
                            defaultValue="2" 
                            min="1" 
                            max="50"
                            className={`w-16 px-2 py-1.5 text-white text-center text-xs font-black outline-none ${
                              isNeo ? 'bg-[#090b12] border-2 border-black' : 'rounded bg-[#0a0d16] border border-slate-700/80'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const selId = document.getElementById('add-mun-id').value;
                              const selQty = parseInt(document.getElementById('add-mun-qty').value, 10);
                              handleAddMunitionToLoadout(selId, selQty);
                            }}
                            className={`px-3 py-1.5 text-xs font-black uppercase cursor-pointer ${
                              isNeo ? 'bg-[#ffe600] text-black border-2 border-black shadow-[2px_2px_0px_#000] neo-pressable' : 'rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full mt-4 py-2.5 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                        isNeo
                          ? 'bg-[#00ff66] text-black border-2 border-black shadow-neo-black neo-pressable'
                          : 'rounded-md bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg shadow-emerald-950/40'
                      }`}
                    >
                      <Plane className="w-4 h-4" />
                      Authorize & Dispatch Sortie
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Active Sortie Manifests */}
              <div className="lg:col-span-7 space-y-3" data-tour="sortie-ledger">
                <div className="flex items-center justify-between text-xs font-black text-slate-300 pb-1">
                  <span className="flex items-center gap-2 uppercase">
                    <Zap className={`w-4 h-4 ${isNeo ? 'text-[#ffe600]' : 'text-amber-400'}`} /> 
                    Live Sortie Ledger ({manifests.length})
                  </span>
                  <Tooltip text="Click the action buttons below to update flight progress (e.g. Returned or Aborted)" isNeo={isNeo}>
                    <span className="text-[10px] text-slate-400 underline cursor-help">Status Guide</span>
                  </Tooltip>
                </div>

                <div className="space-y-3">
                  {manifests.map(fm => (
                    <div key={fm.manifest_id} className={`p-4 space-y-3 ${
                      isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
                    }`}>
                      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${
                        isNeo ? 'border-black' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-base">{fm.sortie_code}</span>
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 ${
                            isNeo ? 'bg-[#00e5ff] text-black border border-black' : 'rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/50'
                          }`}>
                            {fm.manifest_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            isNeo 
                              ? `border border-black ${fm.status === 'AIRBORNE' ? 'bg-[#ff3366] text-white' : fm.status === 'SCHEDULED' ? 'bg-[#ffe600] text-black' : fm.status === 'COMPLETED' ? 'bg-[#00ff66] text-black' : 'bg-slate-700 text-white'}`
                              : `rounded ${fm.status === 'AIRBORNE' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : fm.status === 'SCHEDULED' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : fm.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`
                          }`}>
                            {fm.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{fm.departure_time}</span>
                        </div>
                      </div>

                      {/* Manifest Ternary Connections */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold">
                        <div className={`p-2.5 ${isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'}`}>
                          <span className={`text-[10px] uppercase block font-black ${isNeo ? 'text-[#00e5ff]' : 'text-slate-400'}`}>Assigned Pilot</span>
                          <span className="text-slate-100">{fm.pilot_callsign || fm.pilot_name}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">{fm.pilot_id}</span>
                        </div>
                        <div className={`p-2.5 ${isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'}`}>
                          <span className={`text-[10px] uppercase block font-black ${isNeo ? 'text-[#00ff66]' : 'text-slate-400'}`}>Airframe</span>
                          <span className="text-slate-100">{fm.tail_no}</span>
                          <span className="block text-[10px] text-slate-500 truncate">{fm.aircraft_model}</span>
                        </div>
                        <div className={`p-2.5 ${isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'}`}>
                          <span className={`text-[10px] uppercase block font-black ${isNeo ? 'text-[#ffe600]' : 'text-slate-400'}`}>Mission</span>
                          <span className="text-slate-100 truncate block">{fm.mission_name}</span>
                          <span className={`text-[10px] ${isNeo ? 'text-[#00e5ff]' : 'text-emerald-400'}`}>
                            {fm.is_combat && fm.is_training ? 'Combat + Training' : fm.is_combat ? 'Combat' : 'Training'}
                          </span>
                        </div>
                      </div>

                      {/* Munition Loadout */}
                      <div className={`p-2.5 ${isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'}`}>
                        <span className="text-[10px] text-slate-400 uppercase block font-black mb-1.5">
                          Weapons Loadout ({fm.loadout?.length || 0} Types)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {fm.loadout && fm.loadout.length > 0 ? (
                            fm.loadout.map((ld, i) => (
                              <span key={i} className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] ${
                                isNeo ? 'bg-[#1b1e2e] border border-black text-white font-bold' : 'rounded bg-slate-900 border border-slate-800'
                              }`}>
                                <span className={`font-black ${isNeo ? 'text-[#00ff66]' : 'text-amber-400'}`}>{ld.quantity}×</span>
                                <span className="text-slate-300">{ld.munition_id}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No munitions attached (Recon / Ferry)</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {fm.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleUpdateManifestStatus(fm.manifest_id, 'AIRBORNE')}
                            className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                              isNeo ? 'bg-[#ff3366] text-white border-2 border-black shadow-[2px_2px_0px_#000] neo-pressable' : 'rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                            }`}
                          >
                            Mark Airborne
                          </button>
                        )}
                        {fm.status === 'AIRBORNE' && (
                          <button
                            onClick={() => handleUpdateManifestStatus(fm.manifest_id, 'COMPLETED')}
                            className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                              isNeo ? 'bg-[#00ff66] text-black border-2 border-black shadow-[2px_2px_0px_#000] neo-pressable' : 'rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                            }`}
                          >
                            Sortie Returned (Complete)
                          </button>
                        )}
                        {fm.status !== 'ABORTED' && fm.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateManifestStatus(fm.manifest_id, 'ABORTED')}
                            className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                              isNeo ? 'bg-[#222536] text-slate-300 border border-black hover:text-white neo-pressable' : 'rounded text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800'
                            }`}
                          >
                            Abort Sortie
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {manifests.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs italic font-bold">
                      No active sorties in ledger. Use the assembly form on the left to launch a sortie.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: COMMAND HIERARCHY
           ===================================================================== */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-5">
            {/* Header */}
            <div 
              data-tour="hierarchy-section"
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
                isNeo ? 'border-black' : 'border-slate-800/80'
              }`}
            >
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className={`w-4 h-4 ${isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}`} />
                  Command Hierarchy
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  Organizational chart showing how squadrons report up to higher headquarters.
                </p>
              </div>
            </div>

            {/* Beginner Explanation Banner */}
            <div className={`p-3 text-xs font-bold flex items-start gap-2.5 ${
              isNeo ? 'bg-[#151726] border-2 border-black shadow-[2px_2px_0px_#000]' : 'bg-[#0e1422] border border-slate-800 rounded-md'
            }`}>
              <Info className="w-4 h-4 text-[#00e5ff] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#00e5ff] uppercase font-black mr-1">In Simple Terms:</span>
                Just like a company has managers and executives, an airbase has squadrons that answer to commanders. This screen uses graph path traversal to trace any subordinate squadron directly up to <strong>Supreme HQ</strong>.
              </div>
            </div>

            {/* Hierarchy Tree */}
            <div 
              data-tour="hierarchy-tree"
              className={`p-5 space-y-4 ${
                isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
              }`}
            >
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}`} /> Recursive Chain of Command Paths
              </h3>
              
              <div className="space-y-2.5">
                {hierarchy.map((item, idx) => (
                  <div key={idx} className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isNeo ? 'bg-[#090b12] border-2 border-black shadow-[2px_2px_0px_#000]' : 'rounded-md bg-[#0b0e18] border border-slate-800/80'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono font-black px-2 py-0.5 ${
                        isNeo ? 'bg-[#00e5ff] text-black border border-black' : 'rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/50'
                      }`}>
                        {item.subordinate_id}
                      </span>
                      <span className="text-white font-black">{item.subordinate_callsign}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-slate-400 font-bold">
                      <span className="text-[10px] uppercase text-slate-500 mr-1">Echelon Path:</span>
                      {item.chain_of_command && item.chain_of_command.length > 0 ? (
                        item.chain_of_command.map((node, i) => (
                          <React.Fragment key={node.id}>
                            <span className={isNeo ? 'text-[#00ff66] font-black' : 'text-emerald-400 font-semibold'}>{node.callsign}</span>
                            {i < item.chain_of_command.length - 1 && (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600 stroke-[3]" />
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                          isNeo ? 'bg-[#00ff66] text-black border border-black' : 'rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          Supreme HQ (Root Node)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Squadron Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold">
              {squadrons.map(s => (
                <div key={s.sqd_id} className={`p-4 space-y-3 ${
                  isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
                }`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                    <span className={`font-mono font-black ${isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}`}>{s.sqd_id}</span>
                    <span className="text-white font-black">{s.callsign}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Specialization</span>
                    <span className="text-slate-300">{s.specialization}</span>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${isNeo ? 'border-black' : 'border-slate-800/60'}`}>
                    <div className={`p-2 ${isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800'}`}>
                      <span className="block text-[10px] text-slate-500 uppercase font-black">Airframes</span>
                      <span className={`text-base font-black ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`}>{s.aircraft_count}</span>
                    </div>
                    <div className={`p-2 ${isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800'}`}>
                      <span className="block text-[10px] text-slate-500 uppercase font-black">Personnel</span>
                      <span className={`text-base font-black ${isNeo ? 'text-[#ffe600]' : 'text-amber-400'}`}>{s.personnel_count}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    Commander: <strong className="text-slate-200">{s.commander_callsign || 'None (Supreme HQ)'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: PERSONNEL ROSTER
           ===================================================================== */}
        {activeTab === 'roster' && (
          <div className="space-y-5">
            {/* Header */}
            <div 
              data-tour="roster-section"
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
                isNeo ? 'border-black' : 'border-slate-800/80'
              }`}
            >
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className={`w-4 h-4 ${isNeo ? 'text-[#ffe600]' : 'text-amber-400'}`} />
                  Personnel Roster
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  Base directory of certified pilots and ground maintenance technicians.
                </p>
              </div>
              
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5">
                {['all', 'pilot', 'technician'].map(f => (
                  <button
                    key={f}
                    onClick={() => setPersonnelFilter(f)}
                    className={`px-3 py-1 text-xs font-black uppercase cursor-pointer transition-colors ${
                      isNeo
                        ? `border-2 border-black neo-pressable ${personnelFilter === f ? 'bg-[#ffe600] text-black shadow-[2px_2px_0px_#000]' : 'bg-[#181b2a] text-slate-300'}`
                        : `rounded ${personnelFilter === f ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'}`
                    }`}
                  >
                    {f === 'all' ? 'All Roles' : f + 's'}
                  </button>
                ))}
              </div>
            </div>

            {/* Beginner Explanation Banner */}
            <div className={`p-3 text-xs font-bold flex items-start gap-2.5 ${
              isNeo ? 'bg-[#151726] border-2 border-black shadow-[2px_2px_0px_#000]' : 'bg-[#0e1422] border border-slate-800 rounded-md'
            }`}>
              <Info className="w-4 h-4 text-[#ffe600] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#ffe600] uppercase font-black mr-1">In Simple Terms:</span>
                Every member on base has a specific role: <strong>Pilots</strong> fly missions (tracked by flight ratings & hours), while <strong>Technicians</strong> maintain the jets (tracked by security clearances & engineering specialties). You can also click "+ Add" to save emergency contact numbers.
              </div>
            </div>

            {/* Personnel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold" data-tour="roster-grid">
              {personnel
                .filter(p => personnelFilter === 'all' || p.role.toLowerCase() === personnelFilter)
                .map(p => (
                  <div key={p.service_id} className={`p-4 space-y-3 ${
                    isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
                  }`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                      <div>
                        <span className="font-black text-white text-sm block">{p.full_name}</span>
                        {p.callsign && <span className={isNeo ? 'text-[#00e5ff] text-xs' : 'text-cyan-400 text-xs'}>"{p.callsign}"</span>}
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                        isNeo 
                          ? `border border-black ${p.role === 'Pilot' ? 'bg-[#00e5ff] text-black' : 'bg-[#ffe600] text-black'}`
                          : `rounded ${p.role === 'Pilot' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`
                      }`}>
                        {p.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-black">Service ID</span>
                        <span className="text-slate-300 font-mono">{p.service_id}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-black">Rank</span>
                        <span className="text-slate-300">{p.rank}</span>
                      </div>
                    </div>

                    {/* Disjoint Subclass Specific Stats */}
                    {p.role === 'Pilot' ? (
                      <div className={`p-2.5 space-y-1 text-[11px] ${
                        isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'
                      }`}>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Flight Rating:</span>
                          <span className={isNeo ? 'text-[#00ff66] font-black' : 'text-emerald-400 font-semibold'}>{p.flight_rating}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Flight Hours:</span>
                          <span className={isNeo ? 'text-[#00e5ff] font-black' : 'text-cyan-400 font-semibold'}>{p.total_flight_hours} hrs</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-2.5 space-y-1 text-[11px] ${
                        isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'
                      }`}>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Clearance:</span>
                          <span className={isNeo ? 'text-[#ffe600] font-black' : 'text-amber-400 font-semibold'}>{p.clearance_lvl}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Specialty:</span>
                          <span className="text-slate-200 truncate ml-2 font-black">{p.specialty}</span>
                        </div>
                      </div>
                    )}

                    {/* Multivalued Contact Numbers */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-black">
                          Contact Channels ({p.contact_no?.length || 0})
                        </span>
                        <button
                          onClick={() => handleAddContact(p.service_id)}
                          className={`text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer ${
                            isNeo ? 'bg-[#00ff66] text-black px-1.5 py-0.5 border border-black neo-pressable' : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.contact_no && p.contact_no.map((c, i) => (
                          <span key={i} className={`px-2 py-0.5 text-[10px] font-mono ${
                            isNeo ? 'bg-[#090b12] border border-black text-slate-200' : 'rounded bg-slate-900 border border-slate-800 text-slate-300'
                          }`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`pt-2 text-[11px] text-slate-400 border-t ${isNeo ? 'border-black' : 'border-slate-800/80'}`}>
                      Squadron: <span className="text-white font-black">{p.squadron_callsign || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: FLEET & LOGS
           ===================================================================== */}
        {activeTab === 'fleet' && (
          <div className="space-y-5">
            {/* Header */}
            <div 
              data-tour="fleet-section"
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
                isNeo ? 'border-black' : 'border-slate-800/80'
              }`}
            >
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Wrench className={`w-4 h-4 ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`} />
                  Fleet & Maintenance Ledger
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  Aircraft hangar: monitor jet status and technician repair histories.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', 'READY', 'IN_FLIGHT', 'MAINTENANCE', 'RESERVE'].map(st => (
                  <button
                    key={st}
                    onClick={() => setAircraftFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase cursor-pointer transition-colors ${
                      isNeo 
                        ? `border-2 border-black neo-pressable ${aircraftFilter === st ? 'bg-[#00ff66] text-black shadow-[2px_2px_0px_#000]' : 'bg-[#181b2a] text-slate-300'}`
                        : `rounded ${aircraftFilter === st ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'}`
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Beginner Explanation Banner */}
            <div className={`p-3 text-xs font-bold flex items-start gap-2.5 ${
              isNeo ? 'bg-[#151726] border-2 border-black shadow-[2px_2px_0px_#000]' : 'bg-[#0e1422] border border-slate-800 rounded-md'
            }`}>
              <Info className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#00ff66] uppercase font-black mr-1">In Simple Terms:</span>
                Think of this as the aircraft repair garage. Planes must be <strong>READY</strong> before they can fly. Click any plane on the left to see its mechanic history on the right, or quickly change its status (e.g. send it into <strong>MAINTENANCE</strong>).
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-tour="fleet-grid">
              
              {/* Left Column: Aircraft List */}
              <div className="lg:col-span-7 space-y-3 text-xs font-bold">
                {aircraft
                  .filter(a => aircraftFilter === 'ALL' || a.status === aircraftFilter)
                  .map(a => {
                    const isSelected = selectedAircraft?.tail_no === a.tail_no;
                    return (
                      <div 
                        key={a.tail_no}
                        onClick={() => setSelectedAircraft(a)}
                        className={`p-4 transition-all cursor-pointer ${
                          isNeo 
                            ? `border-2 border-black shadow-neo-black neo-pressable ${isSelected ? 'bg-[#1c2033] border-[#00ff66] shadow-neo-green' : 'bg-[#151726]'}`
                            : `rounded-lg bg-[#0f1422] border ${isSelected ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/30 bg-[#121929]' : 'border-slate-800/80 hover:border-slate-700'}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono">{a.tail_no}</span>
                            <span className="text-slate-400 text-xs">// {a.model}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            isNeo 
                              ? `border border-black ${a.status === 'READY' ? 'bg-[#00ff66] text-black' : a.status === 'IN_FLIGHT' ? 'bg-[#ff3366] text-white' : a.status === 'MAINTENANCE' ? 'bg-[#ffe600] text-black' : 'bg-slate-700 text-white'}`
                              : `rounded ${a.status === 'READY' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : a.status === 'IN_FLIGHT' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : a.status === 'MAINTENANCE' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-slate-700/30 text-slate-300 border border-slate-700'}`
                          }`}>
                            {a.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Squadron: <strong className="text-slate-200">{a.squadron_callsign}</strong></span>
                          <span>Logs: <strong className={isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}>{a.maintenance_count}</strong> ({a.active_issues} active)</span>
                        </div>

                        {/* Status Quick Modifier Buttons */}
                        <div className={`mt-3 pt-2.5 flex items-center justify-end gap-1.5 border-t ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                          {['READY', 'MAINTENANCE', 'RESERVE'].map(sBtn => (
                            <button
                              key={sBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateAircraftStatus(a.tail_no, sBtn);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-black uppercase cursor-pointer transition-colors ${
                                isNeo
                                  ? `border border-black neo-pressable ${a.status === sBtn ? 'bg-[#00ff66] text-black shadow-[2px_2px_0px_#000]' : 'bg-[#090b12] text-slate-300'}`
                                  : `rounded ${a.status === sBtn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'}`
                              }`}
                            >
                              Set {sBtn}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Right Column: Maintenance History */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`p-5 text-xs font-bold ${
                  isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
                }`}>
                  <div className={`pb-3 mb-4 border-b ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isNeo ? 'text-[#ffe600]' : 'text-amber-400'
                    }`}>
                      <Wrench className="w-3.5 h-3.5 stroke-[3]" /> Maintenance History
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      Target Airframe: <strong className={`font-mono text-sm ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`}>{selectedAircraft?.tail_no || 'None Selected'}</strong>
                    </span>
                  </div>

                  {/* Add Maintenance Log Form */}
                  <form onSubmit={handleCreateMaintenanceLog} className={`space-y-3 mb-5 p-3.5 ${
                    isNeo ? 'bg-[#090b12] border-2 border-black shadow-[2px_2px_0px_#000]' : 'rounded-md bg-[#0b0e18] border border-slate-800'
                  }`}>
                    <span className={`text-[11px] font-black uppercase block ${isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}`}>
                      + Append Discrepancy Entry
                    </span>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Log Date / Timestamp"
                        value={newLog.log_date}
                        onChange={e => setNewLog({ ...newLog, log_date: e.target.value })}
                        required
                        className={`w-full px-2.5 py-1.5 text-xs text-white outline-none font-bold ${
                          isNeo ? 'bg-[#151726] border border-black' : 'rounded bg-[#0a0d16] border border-slate-700/80'
                        }`}
                      />
                    </div>
                    <div>
                      <textarea 
                        rows="2"
                        placeholder="Technical Fault / Discrepancy Details"
                        value={newLog.issue}
                        onChange={e => setNewLog({ ...newLog, issue: e.target.value })}
                        required
                        className={`w-full px-2.5 py-1.5 text-xs text-white outline-none font-bold ${
                          isNeo ? 'bg-[#151726] border border-black' : 'rounded bg-[#0a0d16] border border-slate-700/80'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={newLog.severity}
                        onChange={e => setNewLog({ ...newLog, severity: e.target.value })}
                        className={`px-2 py-1.5 text-xs text-white outline-none font-bold ${
                          isNeo ? 'bg-[#151726] border border-black' : 'rounded bg-[#0a0d16] border border-slate-700/80'
                        }`}
                      >
                        <option value="ROUTINE">ROUTINE</option>
                        <option value="MINOR">MINOR</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <select 
                        value={newLog.technician_service_id}
                        onChange={e => setNewLog({ ...newLog, technician_service_id: e.target.value })}
                        required
                        className={`px-2 py-1.5 text-xs text-white outline-none font-bold ${
                          isNeo ? 'bg-[#151726] border border-black' : 'rounded bg-[#0a0d16] border border-slate-700/80'
                        }`}
                      >
                        <option value="">-- Technician --</option>
                        {personnel.filter(p => p.role === 'Technician').map(t => (
                          <option key={t.service_id} value={t.service_id}>
                            {t.full_name} ({t.service_id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className={`w-full py-1.5 font-black uppercase text-[11px] cursor-pointer ${
                        isNeo ? 'bg-[#ffe600] text-black border-2 border-black shadow-neo-black neo-pressable' : 'rounded bg-amber-600 hover:bg-amber-500 text-black'
                      }`}
                    >
                      Record Maintenance Entry
                    </button>
                  </form>

                  {/* Logs List */}
                  <div className="space-y-2.5">
                    {aircraftLogs.map(log => (
                      <div key={log.log_id} className={`p-3 space-y-1.5 text-xs ${
                        isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-300 font-bold">{log.log_date}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                            isNeo 
                              ? `border border-black ${log.severity === 'CRITICAL' ? 'bg-[#ff3366] text-white' : 'bg-[#ffe600] text-black'}`
                              : `rounded ${log.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`
                          }`}>
                            {log.severity}
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs font-bold">{log.issue}</p>
                        <div className={`flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t ${
                          isNeo ? 'border-black' : 'border-slate-800'
                        }`}>
                          <span>Signed: <strong className={isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}>{log.technician_name || log.technician_id}</strong></span>
                          <span className={log.resolved ? (isNeo ? 'text-[#00ff66] font-black' : 'text-emerald-400 font-semibold') : (isNeo ? 'text-[#ffe600] font-black' : 'text-amber-400 font-semibold')}>
                            {log.resolved ? 'RESOLVED' : 'ACTIVE DISCREPANCY'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {aircraftLogs.length === 0 && (
                      <div className="text-slate-500 text-center py-6 italic text-xs font-bold">
                        No maintenance logs recorded for airframe {selectedAircraft?.tail_no}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: MUNITIONS ARMORY
           ===================================================================== */}
        {activeTab === 'armory' && (
          <div className="space-y-5">
            {/* Header */}
            <div 
              data-tour="armory-section"
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
                isNeo ? 'border-black' : 'border-slate-800/80'
              }`}
            >
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${isNeo ? 'text-[#00e5ff]' : 'text-indigo-400'}`} />
                  Munitions Armory
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  Weapon warehouse: track missile stocks and see what is currently in flight.
                </p>
              </div>
            </div>

            {/* Beginner Explanation Banner */}
            <div className={`p-3 text-xs font-bold flex items-start gap-2.5 ${
              isNeo ? 'bg-[#151726] border-2 border-black shadow-[2px_2px_0px_#000]' : 'bg-[#0e1422] border border-slate-800 rounded-md'
            }`}>
              <Info className="w-4 h-4 text-[#00e5ff] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#00e5ff] uppercase font-black mr-1">In Simple Terms:</span>
                This is the armory inventory. When you dispatch a sortie with missiles, the stock here drops automatically. You can use the <strong>+10</strong> or <strong>+50</strong> buttons to simulate deliveries and restock weapons.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold" data-tour="armory-grid">
              {munitions.map(mu => (
                <div key={mu.munition_id} className={`p-4 space-y-3 ${
                  isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'bg-[#0f1422] border border-slate-800/80 rounded-lg'
                }`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                    <span className="font-mono font-black text-white text-sm">{mu.munition_id}</span>
                    <span className={`px-2 py-0.5 text-xs font-black uppercase ${
                      isNeo ? 'bg-[#00ff66] text-black border border-black' : 'rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      Stock: {mu.stock}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-black">Classification</span>
                    <span className="text-slate-200">{mu.type}</span>
                  </div>

                  <div className={`p-2.5 flex justify-between items-center text-[11px] ${
                    isNeo ? 'bg-[#090b12] border border-black' : 'rounded bg-[#0b0e18] border border-slate-800/80'
                  }`}>
                    <span className="text-slate-400">Allocated in Active Sorties:</span>
                    <span className={isNeo ? 'text-[#ffe600] font-black' : 'text-amber-400 font-bold'}>{mu.allocated_in_manifests || 0}</span>
                  </div>

                  <div className={`pt-2 flex items-center justify-end gap-1.5 border-t ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                    <button
                      onClick={() => handleAdjustStock(mu.munition_id, 10)}
                      className={`px-2.5 py-1 text-[11px] font-black cursor-pointer ${
                        isNeo ? 'bg-[#222538] text-slate-200 border border-black neo-pressable' : 'rounded text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleAdjustStock(mu.munition_id, 50)}
                      className={`px-2.5 py-1 text-[11px] font-black cursor-pointer ${
                        isNeo ? 'bg-[#00ff66] text-black border-2 border-black neo-pressable' : 'rounded text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800'
                      }`}
                    >
                      +50 Restock
                    </button>
                    <button
                      onClick={() => handleAdjustStock(mu.munition_id, -5)}
                      className={`px-2.5 py-1 text-[11px] font-black cursor-pointer ${
                        isNeo ? 'bg-[#ff3366] text-white border-2 border-black neo-pressable' : 'rounded text-rose-300 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800'
                      }`}
                    >
                      -5 Write-off
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 6: GRAPH INTEL CONSOLE
           ===================================================================== */}
        {activeTab === 'console' && (
          <div className="space-y-5">
            {/* Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
              isNeo ? 'border-black' : 'border-slate-800/80'
            }`}>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className={`w-4 h-4 ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`} />
                  Graph Intelligence Console
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  The database brain: run live Cypher queries and test graph traversal algorithms.
                </p>
              </div>
            </div>

            {/* Beginner Explanation Banner */}
            <div className={`p-3 text-xs font-bold flex items-start gap-2.5 ${
              isNeo ? 'bg-[#151726] border-2 border-black shadow-[2px_2px_0px_#000]' : 'bg-[#0e1422] border border-slate-800 rounded-md'
            }`}>
              <Info className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#00ff66] uppercase font-black mr-1">In Simple Terms:</span>
                Instead of slow, rigid tables with complex SQL JOINs, this project uses a <strong>Graph Database (Neo4j)</strong> where pilots, planes, and missiles are connected like web links. Click any of the 3 cards below to run instant graph queries!
              </div>
            </div>

            {/* Quick Demonstration Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tour="console-section">
              <button
                onClick={() => runPresetQuery('chain')}
                className={`p-4 text-left transition-all group cursor-pointer ${
                  isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black hover:border-[#00e5ff] neo-pressable' : 'rounded-lg bg-[#0f1422] border border-slate-800/80 hover:border-cyan-500/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black uppercase ${isNeo ? 'text-[#00e5ff]' : 'text-cyan-400'}`}>
                    Q1. Chain-of-Command Traversal
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 font-bold">
                  Traces the hierarchy path from any squadron up to headquarters in a single graph hop.
                </p>
              </button>

              <button
                onClick={() => runPresetQuery('impact')}
                className={`p-4 text-left transition-all group cursor-pointer ${
                  isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black hover:border-[#ff3366] neo-pressable' : 'rounded-lg bg-[#0f1422] border border-slate-800/80 hover:border-rose-500/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black uppercase ${isNeo ? 'text-[#ff3366]' : 'text-rose-400'}`}>
                    Q2. Airframe Blast-Radius Impact
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 font-bold">
                  What happens if plane AF-A10-202 breaks? Finds all affected flights and pilots instantly.
                </p>
              </button>

              <button
                onClick={() => runPresetQuery('expenditure')}
                className={`p-4 text-left transition-all group cursor-pointer ${
                  isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black hover:border-[#ffe600] neo-pressable' : 'rounded-lg bg-[#0f1422] border border-slate-800/80 hover:border-amber-500/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black uppercase ${isNeo ? 'text-[#ffe600]' : 'text-amber-400'}`}>
                    Q3. Munitions Expenditure Matrix
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 font-bold">
                  Calculates exactly how many missiles were fired across Combat versus Training missions.
                </p>
              </button>
            </div>

            {/* Quick Query Display Area */}
            {activeQueryResult && (
              <div className={`p-4 space-y-3 ${
                isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'rounded-lg bg-[#0f1422] border border-slate-800/80'
              }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                  <span className={`text-xs font-black uppercase ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`}>{activeQueryTitle}</span>
                  <button 
                    onClick={() => setActiveQueryResult(null)} 
                    className={`text-xs font-black uppercase px-2 py-0.5 cursor-pointer ${
                      isNeo ? 'bg-[#ff3366] text-white border border-black neo-pressable' : 'rounded text-slate-400 hover:text-white bg-slate-800'
                    }`}
                  >
                    Close [×]
                  </button>
                </div>
                <div className={`p-3 overflow-x-auto text-[11px] max-h-80 font-bold ${
                  isNeo ? 'bg-[#090b12] border-2 border-black text-[#00ff66]' : 'rounded bg-[#0b0e18] border border-slate-800/80 text-emerald-300'
                }`}>
                  <pre>{JSON.stringify(activeQueryResult, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Live Cypher Terminal Sandbox */}
            <div 
              data-tour="console-panel"
              className={`p-5 space-y-4 ${
                isNeo ? 'bg-[#151726] border-2 border-black shadow-neo-black' : 'rounded-lg bg-[#0f1422] border border-slate-800/80'
              }`}
            >
              <div className={`flex items-center justify-between pb-2 border-b ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                <span className="font-black text-white text-xs uppercase flex items-center gap-2">
                  <Terminal className={`w-4 h-4 ${isNeo ? 'text-[#00ff66]' : 'text-emerald-400'}`} /> Interactive Cypher Query Editor
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                  isNeo ? 'bg-[#ffe600] text-black border border-black' : 'text-slate-400'
                }`}>
                  Live Neo4j Session
                </span>
              </div>

              <div>
                <textarea
                  rows="4"
                  value={cypherQuery}
                  onChange={e => setCypherQuery(e.target.value)}
                  className={`w-full p-3 font-mono text-xs font-bold outline-none ${
                    isNeo 
                      ? 'bg-[#090b12] border-2 border-black text-[#00ff66] focus:shadow-neo-green' 
                      : 'rounded bg-[#0a0d16] border border-slate-700/80 text-emerald-300 focus:border-emerald-500'
                  }`}
                  placeholder="Enter Cypher query here..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-500 text-[10px] uppercase font-black mr-1">Presets:</span>
                  <button
                    onClick={() => {
                      const q = "MATCH (p:Pilot)-[:OPERATES]->(fm:FlightManifest) RETURN p.callsign, count(fm) AS sorties_flown ORDER BY sorties_flown DESC";
                      setCypherQuery(q);
                      handleRunCypher(q);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase cursor-pointer ${
                      isNeo ? 'bg-[#222538] text-slate-200 border border-black neo-pressable' : 'rounded font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    Top Gun Pilots
                  </button>
                  <button
                    onClick={() => {
                      const q = "MATCH (a:Aircraft)-[:REQUIRES]->(l:MaintenanceLog) WHERE l.resolved = false RETURN a.tail_no, l.issue, l.severity";
                      setCypherQuery(q);
                      handleRunCypher(q);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase cursor-pointer ${
                      isNeo ? 'bg-[#222538] text-slate-200 border border-black neo-pressable' : 'rounded font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    Active Faults
                  </button>
                  <button
                    onClick={() => {
                      const q = "MATCH (m:Mission) RETURN m.mission_id, m.code_name, labels(m) AS eer_classes";
                      setCypherQuery(q);
                      handleRunCypher(q);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase cursor-pointer ${
                      isNeo ? 'bg-[#222538] text-slate-200 border border-black neo-pressable' : 'rounded font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    Overlapping Missions
                  </button>
                </div>

                <button
                  onClick={() => handleRunCypher(cypherQuery)}
                  disabled={cypherLoading}
                  className={`px-4 py-2 font-black uppercase text-xs tracking-wider cursor-pointer ${
                    isNeo 
                      ? 'bg-[#00ff66] text-black border-2 border-black shadow-neo-black neo-pressable' 
                      : 'rounded bg-emerald-600 hover:bg-emerald-500 text-black'
                  }`}
                >
                  {cypherLoading ? 'Executing...' : 'Run Cypher Query'}
                </button>
              </div>

              {/* Cypher Result Console */}
              {cypherResult && (
                <div className={`mt-4 pt-3 border-t ${isNeo ? 'border-black' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2 text-xs font-black uppercase">
                    <span className={cypherResult.success ? (isNeo ? 'text-[#00ff66]' : 'text-emerald-400') : 'text-[#ff3366]'}>
                      {cypherResult.success ? `Returned ${cypherResult.count} records` : 'Execution Error'}
                    </span>
                  </div>
                  <div className={`p-3 overflow-x-auto text-[11px] max-h-80 font-bold ${
                    isNeo ? 'bg-[#090b12] border-2 border-black shadow-neo-black text-slate-200' : 'rounded bg-[#0a0d16] border border-slate-800/80 text-slate-200'
                  }`}>
                    {cypherResult.success ? (
                      <pre>{JSON.stringify(cypherResult.records, null, 2)}</pre>
                    ) : (
                      <pre className="text-[#ff3366]">{cypherResult.error}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
