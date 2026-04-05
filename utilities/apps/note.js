let __note_currentId = null;

/* =========================
APP REGISTRY
========================= */

window.__apps = window.__apps || {};

window.__apps["note"] = async function(){
  await note_loadApp();
};

/* =========================
INDEXED DB (ISOLATED)
========================= */

const NOTE_DB = "vidhwaan_note_pdf_db";
const NOTE_STORE = "note_pages_store";

let note_db;

function note_initDB(){
  if(note_db) return note_db;

  note_db = new Promise((res, rej)=>{
    const req = indexedDB.open(NOTE_DB, 1);

    req.onupgradeneeded = e=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains(NOTE_STORE)){
        db.createObjectStore(NOTE_STORE, { keyPath:"id" });
      }
    };

    req.onsuccess = e=> res(e.target.result);
    req.onerror = rej;
  });

  return note_db;
}

async function note_getAll(){
  const db = await note_initDB();

  return new Promise(r=>{
    const tx = db.transaction(NOTE_STORE,"readonly");
    const req = tx.objectStore(NOTE_STORE).getAll();
    req.onsuccess = ()=> r(req.result || []);
    req.onerror = ()=> r([]);
  });
}

async function note_save(n){
  const db = await note_initDB();
  db.transaction(NOTE_STORE,"readwrite").objectStore(NOTE_STORE).put(n);
}

async function note_delete(id){
  const db = await note_initDB();
  db.transaction(NOTE_STORE,"readwrite").objectStore(NOTE_STORE).delete(id);
}

/* =========================
MAIN UI
========================= */

async function note_loadApp(){

const view = document.getElementById("appView");
if(!view) return;

view.innerHTML = `
<div class="container">

<div style="display:flex;justify-content:space-between;margin-bottom:15px;">
  <button class="btn btn-outline" onclick="backToList()">←</button>
  <h2 style="margin:0;flex:1;text-align:center;">VID Note</h2>
  <button class="btn btn-primary" onclick="note_create()">+ New</button>
</div>

<input id="noteSearch" placeholder="Search..." style="width:100%;padding:10px;margin-bottom:15px;border-radius:10px;border:none;background:#020617;color:white;">

<div id="noteList"></div>

</div>
`;

document.getElementById("noteSearch").oninput = note_renderList;

await note_renderList();
}

/* =========================
LIST
========================= */

async function note_renderList(){

const q = document.getElementById("noteSearch")?.value?.toLowerCase() || "";
let list = await note_getAll();

list = list.filter(n => (n.title||"").toLowerCase().includes(q));

list.sort((a,b)=>{
  if(b.pinned!==a.pinned) return b.pinned - a.pinned;
  return b.id - a.id;
});

const el = document.getElementById("noteList");

if(!list.length){
  el.innerHTML = `<div style="text-align:center;opacity:.6">No notes</div>`;
  return;
}

el.innerHTML = list.map(n=>`
<div class="card" style="margin-bottom:12px;padding:12px;">

<div onclick="note_open('${n.id}')" style="cursor:pointer;margin-bottom:8px;">
${n.pinned?"📌":""} <strong>${n.title||"Untitled"}</strong>
</div>

<div style="display:flex;gap:8px;">
<button onclick="note_pin('${n.id}')">📌</button>
<button onclick="note_rename('${n.id}')">✏️</button>
<button onclick="note_delete('${n.id}')">🗑️</button>
<button onclick="note_export('${n.id}')">Export</button>
</div>

</div>
`).join("");
}

/* =========================
CRUD
========================= */

async function note_create(){
const n = {
  id: Date.now().toString(),
  title:"New Project",
  pinned:false,
  pages:[{id:Date.now().toString(),name:"Page",content:""}]
};
await note_save(n);
note_renderList();
}

async function note_pin(id){
const list = await note_getAll();
const n = list.find(x=>x.id===id);
n.pinned=!n.pinned;
await note_save(n);
note_renderList();
}

async function note_rename(id){
const list = await note_getAll();
const n = list.find(x=>x.id===id);
const name = prompt("Rename", n.title);
if(!name) return;
n.title = name;
await note_save(n);
note_renderList();
}

async function note_delete(id){
await note_deleteDB?.(id) || await note_delete(id);
note_renderList();
}

/* =========================
OPEN NOTE
========================= */

async function note_open(id){

__note_currentId = id;

history.pushState({}, "", "#note-pages");

const list = await note_getAll();
const n = list.find(x=>x.id===id);

const view = document.getElementById("appView");

view.innerHTML = `
<div class="container">

<div style="display:flex;justify-content:space-between;margin-bottom:15px;">
<button onclick="history.back()">←</button>
<h2 style="flex:1;text-align:center;">${n.title}</h2>
<button onclick="note_addPage('${id}')">+ Page</button>
</div>

<div id="pages"></div>

</div>
`;

note_renderPages(n);
}

/* =========================
PAGES
========================= */

function note_renderPages(n){

const el = document.getElementById("pages");

el.innerHTML = n.pages.map(p=>`
<div class="card" style="margin-bottom:10px;padding:10px;">

<div onclick="note_openPage('${n.id}','${p.id}')">
${p.name}
</div>

<button onclick="note_download('${n.id}','${p.id}')">Export</button>

</div>
`).join("");
}

async function note_addPage(id){
const list = await note_getAll();
const n = list.find(x=>x.id===id);
n.pages.unshift({id:Date.now().toString(),name:"Page",content:""});
await note_save(n);
note_open(id);
}

/* =========================
EDITOR
========================= */

async function note_openPage(noteId,pageId){

history.pushState({}, "", "#note-editor");

const list = await note_getAll();
const n = list.find(x=>x.id===noteId);
const p = n.pages.find(x=>x.id===pageId);

const view = document.getElementById("appView");

view.innerHTML = `
<div class="container">

<button onclick="history.back()">←</button>

<textarea id="editor" style="width:100%;height:70vh;background:#020617;color:white;">
${p.content||""}
</textarea>

</div>
`;

document.getElementById("editor").oninput = async e=>{
p.content = e.target.value;
await note_save(n);
};
}

/* =========================
EXPORT
========================= */

function note_pdf(text,name){
const { jsPDF } = window.jspdf;
const pdf = new jsPDF();
pdf.text(pdf.splitTextToSize(text,180),10,10);
pdf.save(name);
}

async function note_download(noteId,pageId){
const list = await note_getAll();
const n = list.find(x=>x.id===noteId);
const p = n.pages.find(x=>x.id===pageId);
note_pdf(p.content || "", (p.name||"page")+".pdf");
}

async function note_export(id){

const list = await note_getAll();
const n = list.find(x=>x.id===id);

const zip = new JSZip();

for(const p of n.pages){
const { jsPDF } = window.jspdf;
const pdf = new jsPDF();
pdf.text(pdf.splitTextToSize(p.content||"",180),10,10);
zip.file((p.name||"page")+".pdf", pdf.output("blob"));
}

const blob = await zip.generateAsync({type:"blob"});
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = (n.title||"note")+".zip";
a.click();
}

/* =========================
NAVIGATION
========================= */

window.addEventListener("popstate", ()=>{
if(!location.hash.startsWith("#note")){
  return;
}
if(!location.hash){
  note_loadApp();
}
if(location.hash==="#note-pages" && __note_currentId){
  note_open(__note_currentId);
}
});
