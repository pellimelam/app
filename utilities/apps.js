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

  let clean = path.replace(/^\/+|\/+$/g, "");

  if(clean.startsWith("app")){
    clean = clean.slice(3);
  }

  clean = clean.replace(/^\/+/, "");
  clean = clean.replace(/index\.html$/, "");

  if(!clean || clean === "/"){
    return null;
  }

  const appId = clean.split("/")[0];

  if(APP_LOADERS[appId]){
    return appId;
  }

  return null;
}

/* =========================
DYNAMIC APP LOADER
========================= */

const APP_LOADERS = {
  notes: () => import("./apps/notes.js"),

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

  /* URL UPDATE */
  if(!skipPush){
    navigateToApp(appId);
  }

  /* UI SWITCH */
  document.getElementById("utilities").style.display = "none";
  document.getElementById("appView").style.display = "block";

  /* LOAD ONLY ONCE */
  if(!window.__apps_loaded[appId]){
    await loader();
    window.__apps_loaded[appId] = true;
  }

  /* RUN APP */
  if(window.__apps && window.__apps[appId]){
    window.__apps[appId]();
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

  if(appId){
    await window.openApp(appId, { skipPush: true });
  }else{
    document.getElementById("appView").style.display = "none";
    document.getElementById("utilities").style.display = "block";
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
