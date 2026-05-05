const axios = require('axios');

const GRAFANA_URL = 'http://localhost:3000'; // Change par l'URL de ton Grafana
const API_KEY = 'VOTRE_API_KEY_OU_ADMIN_PASSWORD'; // Utilise admin:admin par défaut si pas d'API Key

const dashboardConfig = {
  "dashboard": {
    "id": null,
    "title": "BuildMarket - Performance Monitor",
    "tags": ["nodejs", "k8s"],
    "timezone": "browser",
    "panels": [
      {
        "title": "CPU Usage (%)",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "targets": [{ "expr": "process_cpu_seconds_total" }]
      },
      {
        "title": "Memory Usage (MB)",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
        "targets": [{ "expr": "process_resident_memory_bytes / 1024 / 1024" }]
      },
      {
        "title": "Response Time (ms)",
        "type": "gauge",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
        "targets": [{ "expr": "rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])" }]
      }
    ]
  },
  "overwrite": true
};

const GRAFANA_USER = 'admin';
const GRAFANA_PASS = '0000'; // METS TON MOT DE PASSE ICI

async function createDashboard() {
  const auth = Buffer.from(`${GRAFANA_USER}:${GRAFANA_PASS}`).toString('base64');
  try {
    const response = await axios.post(`${GRAFANA_URL}/api/dashboards/db`, dashboardConfig, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('✅ Dashboard créé avec succès ! ID:', response.data.uid);
  } catch (error) {
    console.error('❌ Erreur lors de la création du dashboard:', error.response ? error.response.data : error.message);
  }
}

createDashboard();
