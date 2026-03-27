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
notes: () => import("./utilities/apps/notes.js"),

/* FUTURE
chat: () => import("./apps/chat.js"),
crm: () => import("./apps/crm.js"),
*/
};




const APP_CONFIG = [

{
section: "Utilities",
apps: [
{ id: "notes", name: "Notes", icon: "📝" }
]
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
  <div class="app-icon">${app.icon}</div>
  <div class="app-name">${app.name}</div>
</div>
`;

});

html += `</div></div>`;

});

html += `</div></section>

<div id="appView" style="display:none;"></div>
`;

document.getElementById("utilities").innerHTML = html;

}


window.openApp = async function(appId, options = {}){

const { skipPush = false } = options;

const loader = APP_LOADERS[appId];

if(!loader){
console.error("App not found:", appId);
return;
}

/* URL UPDATE (only when needed) */
if(!skipPush){
navigateToApp(appId);
}

/* UI SWITCH */
document.getElementById("utilities").style.display = "none";
document.getElementById("appView").style.display = "block";

/* LOAD ONLY ONCE */
if(!window.__apps || !window.__apps[appId]){
await loader();
}

/* OPEN APP */
window.__apps[appId]();

};



window.backToList = function(){

/* URL BACK */
history.back();

/* UI SWITCH */
document.getElementById("appView").style.display = "none";
document.getElementById("utilities").style.display = "block";

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
