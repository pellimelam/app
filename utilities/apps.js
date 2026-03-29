/* =========================
APP ROUTER
========================= */

function navigateToApp(appId){
history.pushState({ appId }, "", `/app/${appId}`);
}

function navigateHome(){
history.pushState({}, "", `/`);
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




const APP_CONFIG = [

{
section: "Utilities",
apps: [
{ id: "notes", name: "VID Code", icon: "./icons1/logo.png" }]
},

/* FUTURE SECTIONS EXAMPLE

{
section: "AI Tools",
apps: [
{ id: "chat", name: "AI Chat", icon: "🤖" }
]
},

{
section: "Business",
apps: [
{ id: "crm", name: "CRM", icon: "📊" }
]
}

*/

];

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

html += `</div></section>


`;

document.getElementById("utilities").innerHTML = html;

}


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

/* 🔥 LOAD ONLY ONCE (CRITICAL FIX) */
if(!window.__apps_loaded[appId]){
  await loader();
  window.__apps_loaded[appId] = true;
}

/* OPEN APP */
if(window.__apps && window.__apps[appId]){
  window.__apps[appId]();
}

};



window.backToList = function(){

document.getElementById("appView").style.display = "none";
document.getElementById("utilities").style.display = "block";

navigateHome();

};



/* =========================
INITIAL ROUTE LOAD
========================= */

window.addEventListener("DOMContentLoaded", async ()=>{

const path = window.location.pathname;

if(path.startsWith("/app/")){
  const appId = path.split("/app/")[1];

  if(APP_LOADERS[appId]){
    await window.openApp(appId, { skipPush: true });
  }
}

});



window.addEventListener("popstate", async (e)=>{

const path = window.location.pathname;

if(path.startsWith("/app/")){
const appId = path.split("/app/")[1];
await window.openApp(appId, { skipPush: true });
}else{
document.getElementById("appView").style.display = "none";
document.getElementById("utilities").style.display = "block";
}

});
