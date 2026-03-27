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
