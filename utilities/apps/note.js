let __currentNoteId = null;

/* =========================
APP REGISTRY
========================= */

window.__apps = window.__apps || {};

window.__apps["note"] = async function(){
  await loadNotesApp();
};

/* =========================
INDEXED DB (SAME)
========================= */

const DB_NAME = "vidhwaan_note_text_db";
const STORE = "notes";

let dbPromise;

function initDB(){
  if(dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains(STORE)){
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = (e)=> resolve(e.target.result);
    req.onerror = reject;
  });

  return dbPromise;
}

async function getNotes(){
  const db = await initDB();

  return new Promise(resolve=>{
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = ()=> resolve(req.result || []);
    req.onerror = ()=> resolve([]);
  });
}

async function saveNote(note){
  const db = await initDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(note);
}

async function deleteNoteDB(id){
  const db = await initDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
}

/* =========================
LOAD UI (SAME)
========================= */

async function loadNotesApp(){

const view = document.getElementById("appView");

view.innerHTML = `
<div class="container">

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
  <button class="btn btn-outline" onclick="backToList()">←</button>
  <h2 style="margin:0;text-align:center;flex:1;">VID Note</h2>
  <button class="btn btn-primary" onclick="createNote()">+ New</button>
</div>

<input id="searchNotes" placeholder="Search notes..." style="
width:100%;
padding:10px;
margin-bottom:15px;
border-radius:10px;
border:none;
background:#020617;
color:white;
">

<div id="notesList">Loading...</div>

</div>
`;

document.getElementById("searchNotes").addEventListener("input", renderNotes);

await renderNotes();
}

/* =========================
RENDER LIST (SAME)
========================= */

async function renderNotes(){

const query = document.getElementById("searchNotes")?.value?.toLowerCase() || "";

let notes = await getNotes();

notes = notes.filter(n =>
  String(n.title || "").toLowerCase().includes(query)
);

notes.sort((a,b)=>{
  if(b.pinned !== a.pinned){
    return (b.pinned === true) - (a.pinned === true);
  }
  return Number(b.id) - Number(a.id);
});

const container = document.getElementById("notesList");

if(notes.length === 0){
  container.innerHTML = `
  <div style="text-align:center;opacity:0.6;padding:20px;">
  No notes yet<br>
  <small>Create your first note</small>
  </div>`;
  return;
}

container.innerHTML = notes.map(n => `
<div class="card" style="margin-bottom:12px;padding:12px;">
  <div style="cursor:pointer;margin-bottom:8px;"
       onclick="openNote('${n.id}')">
    ${n.pinned ? "📌 " : ""}
    <strong>${n.title || "Untitled"}</strong>
  </div>

  <div style="display:flex;gap:8px;">
    <button onclick="togglePin('${n.id}')">📌</button>
    <button onclick="renameNote('${n.id}')">✏️</button>
    <button onclick="deleteNote('${n.id}')">🗑️</button>
    <button onclick="exportNote('${n.id}')">Export</button>
  </div>
</div>
`).join("");
}

/* =========================
CREATE / DELETE / PIN (SAME)
========================= */

window.createNote = async function(){
const newNote = {
  id: Date.now().toString(),
  title: "New Note",
  pinned: false,
  pages: [{ id: Date.now().toString(), name: "main.txt", content: "" }]
};
await saveNote(newNote);
await renderNotes();
};

window.deleteNote = async function(id){
  await deleteNoteDB(id);
  await renderNotes();
};

window.renameNote = async function(id){
const notes = await getNotes();
const note = notes.find(n => n.id === id);

const name = prompt("Rename note", note.title);
if(!name) return;

note.title = name.substring(0, 40);
await saveNote(note);
await renderNotes();
};

window.togglePin = async function(id){
const notes = await getNotes();
const note = notes.find(n => n.id === id);

note.pinned = !note.pinned;
await saveNote(note);
await renderNotes();
};

/* =========================
OPEN NOTE (PAGES SAME)
========================= */

window.openNote = async function(id){

__currentNoteId = id;

const notes = await getNotes();
const note = notes.find(n => n.id === id);

const view = document.getElementById("appView");

view.innerHTML = `
<div class="container">
  <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
    <button onclick="history.back()">←</button>
    <h2>${note.title}</h2>
    <button onclick="addPage('${note.id}')">+ Page</button>
  </div>

  <div id="pagesList"></div>
</div>
`;

renderPages(note, id);
};

/* =========================
PAGES SAME
========================= */

function renderPages(note, noteId){

const list = document.getElementById("pagesList");

list.innerHTML = note.pages.map(p => `
<div class="card" style="padding:12px;margin-bottom:10px;">
  <div onclick="openPage('${noteId}','${p.id}')">
    ${p.pinned ? "📌 " : ""}
    <strong>${p.name}</strong>
  </div>

  <div style="margin-top:8px;">
    <button onclick="togglePagePin('${noteId}','${p.id}')">📌</button>
    <button onclick="renamePage('${noteId}','${p.id}')">✏️</button>
    <button onclick="deletePage('${noteId}','${p.id}')">🗑️</button>
    <button onclick="downloadPage('${noteId}','${p.id}')">Export</button>
  </div>
</div>
`).join("");
}

/* =========================
EDITOR (ONLY CHANGE)
========================= */

window.openPage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
const page = note.pages.find(p => p.id === pageId);

const view = document.getElementById("appView");

view.innerHTML = `
<div class="container">
  <button onclick="history.back()">← Back</button>

  <textarea id="editor" style="
    width:100%;
    height:80vh;
    background:#020617;
    color:white;
    border:none;
    padding:15px;
    border-radius:12px;
    font-size:14px;
  ">${page.content || ""}</textarea>
</div>
`;

const editor = document.getElementById("editor");

editor.addEventListener("input", async ()=>{
  page.content = editor.value;
  await saveNote(note);
});
};

/* =========================
PDF EXPORT (MAIN CHANGE)
========================= */

function textToPDFHTML(title, content){
  return `
  <html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: Arial; padding:40px; white-space: pre-wrap; }
    </style>
  </head>
  <body>${escapeHTML(content)}</body>
  </html>`;
}

window.downloadPage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
const page = note.pages.find(p => p.id === pageId);

const win = window.open("", "_blank");
win.document.write(textToPDFHTML(page.name, page.content));
win.document.close();
win.print();
};

window.exportNote = async function(id){

const notes = await getNotes();
const note = notes.find(n => n.id === id);

const zip = new JSZip();

for(const page of note.pages){

  const html = textToPDFHTML(page.name, page.content);

  zip.file(page.name.replace(".txt",".pdf"), html);
}

const blob = await zip.generateAsync({ type: "blob" });

const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = (note.title || "note") + ".zip";
a.click();
};

function escapeHTML(text){
  return text.replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
