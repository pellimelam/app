/* =========================
APP ROUTER (WORLD-CLASS)
========================= */

function navigateToApp(appId){
  history.pushState({ appId }, "", `/app/${appId}`);
}

function navigateHome(){
  history.pushState({}, "", `/app`);
}

/* =========================
ROUTE RESOLVER (CORE FIX)
========================= */
function resolveApp(){

  let path = window.location.pathname;

  // normalize trailing slash
  path = path.replace(/\/+$/, "");

  // only allow /app or /app/*
  if(!path.startsWith("/app")){
    return null;
  }

  const parts = path.split("/").filter(Boolean);

  // /app → home
  if(parts.length === 1){
    return null;
  }

  const appId = parts[1];

  return APP_LOADERS[appId] ? appId : null;
}


/* =========================
DYNAMIC APP LOADER
========================= */

const APP_LOADERS = {
  notes: () => import("./apps/notes.js"),
  note: () => import("./apps/note.js"),

  /* FUTURE
  chat: () => import("./apps/chat.js"),
  crm: () => import("./apps/crm.js"),
  */
};

/* =========================
APP CONFIG (UI)
========================= */

const APP_CONFIG = [
  {
    section: "Utilities",
    apps: [
      { id: "notes", name: "VID Code", icon: "./icons1/logo.png" }
      { id: "note", name: "VID Note", icon: "./icons1/logo.png" }
    ]
  }
];

/* =========================
RENDER APP LIST
========================= */

export function loadApps(){

  let html = `<section class="section"><div class="container">`;

  APP_CONFIG.forEach(section => {

    html += `
    <div class="apps-section">
      <h2 class="apps-section-title">${section.section}</h2>
      <div class="apps-grid">
    `;

    section.apps.forEach(app => {

      html += `
      <div class="app-card" onclick="openApp('${app.id}')">
        <div class="app-icon">
          ${app.icon.includes(".png") 
            ? `<img src="${app.icon}" style="width:40px;height:40px;">`
            : app.icon
          }
        </div>
        <div class="app-name">${app.name}</div>
      </div>
      `;

    });

    html += `</div></div>`;
  });

  html += `</div></section>`;

  document.getElementById("utilities").innerHTML = html;
}

/* =========================
APP LOADER ENGINE
========================= */

window.__apps_loaded = window.__apps_loaded || {};

window.openApp = async function(appId, options = {}){

  const { skipPush = false } = options;

  const loader = APP_LOADERS[appId];

  if(!loader){
    console.error("App not found:", appId);
    return;
  }

  try{

    /* URL UPDATE */
    if(!skipPush){
      navigateToApp(appId);
    }

    const utilities = document.getElementById("utilities");
    const appView = document.getElementById("appView");

    /* UI SWITCH */
    utilities.style.display = "none";
    appView.style.display = "block";

    /* 🔥 PREVENT BLANK SCREEN */
    appView.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <p>Loading ${appId}...</p>
      </div>
    `;

    /* LOAD APP */
    if(!window.__apps_loaded[appId]){
      await loader();
      window.__apps_loaded[appId] = true;
    }

    /* 🔥 ENSURE APP EXISTS */
    if(!window.__apps || !window.__apps[appId]){
      throw new Error("App not initialized");
    }

    /* RUN APP */
    await window.__apps[appId]();

  }catch(e){

    console.error("APP LOAD ERROR:", e);

    document.getElementById("appView").innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h2>Failed to load app</h2>
        <button onclick="location.href='/app'">Go Home</button>
      </div>
    `;
  }
};
/* =========================
BACK TO HOME
========================= */

window.backToList = function(){

  document.getElementById("appView").style.display = "none";
  document.getElementById("utilities").style.display = "block";

  navigateHome();
};

/* =========================
ROUTE HANDLER (INITIAL LOAD)
========================= */

async function handleRoute(){

  const appId = resolveApp();

  try{

    if(appId){
      await window.openApp(appId, { skipPush: true });
    }else{
      document.getElementById("appView").style.display = "none";
      document.getElementById("utilities").style.display = "block";
    }

  }catch(e){

    console.error("ROUTE ERROR:", e);

    document.getElementById("appView").innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h2>Something went wrong</h2>
        <button onclick="location.href='/app'">Go Home</button>
      </div>
    `;
  }
}

/* =========================
INITIAL LOAD
========================= */

window.addEventListener("DOMContentLoaded", handleRoute);

/* =========================
BACK / FORWARD NAVIGATION
========================= */

window.addEventListener("popstate", handleRoute);
