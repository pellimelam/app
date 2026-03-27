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


window.openApp = async function(appId){

const loader = APP_LOADERS[appId];

if(!loader){
console.error("App not found:", appId);
return;
}

/* LOAD APP FILE */
await loader();

/* OPEN APP */
if(window.__apps && window.__apps[appId]){
window.__apps[appId]();
}else{
console.error("App not initialized:", appId);
}

};

