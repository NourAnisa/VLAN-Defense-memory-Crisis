/**
 * VLAN Defense & Memory Crisis - Supabase Realtime Cloud Config
 * Region: Singapore (ap-southeast-1)
 */
const IT_LAB_SUPABASE_CONFIG = {
    url: "https://vmsmmueseewuxgqtaguf.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtc21tdWVzZWV3dXhncXRhZ3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTA1OTIsImV4cCI6MjEwOTQ2NjU5Mn0.2e7QsvYAFgYnebc4DdlqdXU6O2JFHDMGBCyj4gHqIy8"
};

let labSb = null;

try {
    if (window.supabase && typeof window.supabase.createClient === "function") {
        labSb = window.supabase.createClient(IT_LAB_SUPABASE_CONFIG.url, IT_LAB_SUPABASE_CONFIG.anonKey);
        console.log("⚡ IT Lab Simulator: Connected to Supabase Realtime Engine");
    }
} catch (e) {
    console.warn("Supabase init error (offline fallback mode):", e);
}

window.labSb = labSb;
