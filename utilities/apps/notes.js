/* =========================
APP REGISTRY
========================= */

window.__apps = window.__apps || {};

window.__apps["notes"] = function(){

  if(!window.__notes_initialized){
    window.__notes_initialized = true;
    loadNotesApp();
  }

};





/* =========================
INDEXED DB (PRO STORAGE)
========================= */

const DB_NAME = "vidhwaan_notes_db";
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
  try{
    const db = await initDB();

    return new Promise(resolve=>{
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.getAll();
      req.onsuccess = ()=> resolve(req.result || []);
      req.onerror = ()=> resolve([]);
    });

  }catch(e){
    console.error("DB ERROR:", e);
    return [];
  }
}

async function saveNote(note){
  try{
    const db = await initDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(note);
  }catch(e){
    console.error("SAVE ERROR:", e);
  }
}


async function deleteNoteDB(id){
  try{
    const db = await initDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
  }catch(e){
    console.error("DELETE ERROR:", e);
  }
}



/* =========================
LOAD MAIN UI
========================= */

function loadNotesApp(){

document.getElementById("utilities").style.display = "none";

const view = document.getElementById("appView");

view.style.display = "block";

view.innerHTML = `

<div class="container">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
<h2>Notes</h2>
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

renderNotes();

}

/* =========================
RENDER LIST
========================= */

async function renderNotes(){

const query = document.getElementById("searchNotes")?.value?.toLowerCase() || "";

let notes = await getNotes();

/* FILTER */
notes = notes.filter(n =>
  String(n.title || "").toLowerCase().includes(query)
);

/* SORT */
notes.sort((a,b)=> (b.pinned === true) - (a.pinned === true));

const container = document.getElementById("notesList");

if(notes.length === 0){
  container.innerHTML = `
  <div style="text-align:center;opacity:0.6;padding:20px;">
  No notes yet<br>
  <small>Create your first note</small>
  </div>
  `;
  return;
}

container.innerHTML = notes.map(n => `
<div class="card" style="margin-bottom:12px;">
  <div style="display:flex;justify-content:space-between;">
    
    <div style="flex:1;cursor:pointer;" onclick="openNote('${n.id}')">
      ${n.pinned ? "📌 " : ""}
      <strong>${n.title || "Untitled"}</strong>
    </div>

    <div>
      <button onclick="event.stopPropagation(); togglePin('${n.id}')">📌</button>
      <button onclick="event.stopPropagation(); renameNote('${n.id}')">✏️</button>
      <button onclick="event.stopPropagation(); deleteNote('${n.id}')">🗑️</button>
      <button onclick="event.stopPropagation(); exportNote('${n.id}')">Export</button>
    </div>

  </div>
</div>
`).join("");

}

/* =========================
CREATE NOTE (MULTI PAGE)
========================= */

window.createNote = async function(){

const newNote = {
  id: Date.now().toString(),
  title: "New Note",
  pinned: false,
  folder: "default",
  pages: [{ id: Date.now().toString(), name: "Page 1", content: "" }]
};

await saveNote(newNote);

/* refresh list */
await renderNotes();

};

/* =========================
DELETE / RENAME / PIN
========================= */

window.deleteNote = async function(id){
await deleteNoteDB(id);
renderNotes();
};


window.renameNote = async function(id){
const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

const name = prompt("Rename note", note.title);
if(!name || !name.trim()) return;

note.title = name.substring(0, 40);

await saveNote(note);
renderNotes();
};

window.togglePin = async function(id){
const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

note.pinned = !note.pinned;

await saveNote(note);
renderNotes();
};

/* =========================
OPEN NOTE (PAGES UI)
========================= */

window.openNote = async function(id){

window.__notes_initialized = true;

const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

const view = document.getElementById("appView");

view.innerHTML = `

<div class="container">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
    <button class="btn btn-outline" onclick="loadNotesApp()">←</button>
    <h2>${note.title}</h2>
    <button class="btn btn-primary" onclick="addPage('${note.id}')">+ Page</button>
  </div>

  <div id="pagesList"></div>

</div>

`;

renderPages(note, id);

};





window.changeFontSize = function(change){

const editor = document.getElementById("editor");
if(!editor) return;

const current = window.getComputedStyle(editor).fontSize;

let size = parseInt(current);

size += change;

editor.style.fontSize = size + "px";

editor.focus();

};







/* =========================
PAGES SYSTEM
========================= */

function renderPages(note, noteId){

const list = document.getElementById("pagesList");

/* PIN FIRST */
note.pages.sort((a,b)=> (b.pinned === true) - (a.pinned === true));

list.innerHTML = note.pages.map((p,i)=>`

<div class="card" style="margin-bottom:12px;cursor:pointer;transition:0.2s;"
onclick="openPageEditor('${noteId}','${p.id}')"
onmousedown="this.style.transform='scale(0.98)'"
onmouseup="this.style.transform='scale(1)'">

  <div style="display:flex;justify-content:space-between;align-items:center;">

    <div>
      ${p.pinned ? "📌 " : ""}
      <strong>${p.name || "Page " + (i+1)}</strong>
    </div>

    <div>
      <button onclick="event.stopPropagation(); movePage('${noteId}','${p.id}',-1)">⬆️</button>
      <button onclick="event.stopPropagation(); movePage('${noteId}','${p.id}',1)">⬇️</button>
      <button onclick="event.stopPropagation(); togglePagePin('${noteId}','${p.id}')">📌</button>
      <button onclick="event.stopPropagation(); renamePage('${noteId}','${p.id}')">✏️</button>
      <button onclick="event.stopPropagation(); downloadPage('${noteId}','${p.id}')">⬇️</button>
    </div>

  </div>

</div>

`).join("");

}


let draggedPage = null;

window.dragStart = function(id){
draggedPage = id;
};

window.dropPage = async function(noteId, targetId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

const from = note.pages.findIndex(p => p.id === draggedPage);
const to = note.pages.findIndex(p => p.id === targetId);

const [moved] = note.pages.splice(from,1);
note.pages.splice(to,0,moved);

await saveNote(note);

openNote(noteId);

};



window.renamePage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);

if(!note){
  backToList();
  return;
}

const page = note.pages.find(p => p.id === pageId);

if(!page){
  openNote(noteId);
  return;
}

const name = prompt("Page name", page.name || "");

if(!name) return;

page.name = name.substring(0, 30);

await saveNote(note);

renderPages(note, noteId);

};









window.openPageEditor = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);

if(!note){
  backToList();
  return;
}

const page = note.pages.find(p => p.id === pageId);

if(!page){
  openNote(noteId);
  return;
}

const view = document.getElementById("appView");

view.innerHTML = `

<div class="container">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
    <button class="btn btn-outline" onclick="openNote('${noteId}')">←</button>
    <strong>${page.name}</strong>
  </div>

  <div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap;">

    <button onclick="formatText('bold')">B</button>
    <button onclick="formatText('italic')">I</button>

    <button onclick="changeFontSize(2)">A+</button>
    <button onclick="changeFontSize(-2)">A-</button>

    <div style="display:flex;gap:6px;">
      <div onclick="changeColor('#000')" style="width:20px;height:20px;border-radius:50%;background:#000;"></div>
      <div onclick="changeColor('#ef4444')" style="width:20px;height:20px;border-radius:50%;background:#ef4444;"></div>
      <div onclick="changeColor('#22c55e')" style="width:20px;height:20px;border-radius:50%;background:#22c55e;"></div>
      <div onclick="changeColor('#3b82f6')" style="width:20px;height:20px;border-radius:50%;background:#3b82f6;"></div>
    </div>

  </div>

  <div id="editor" contenteditable="true" class="editor-area"></div>

</div>

`;

const editor = document.getElementById("editor");

if(!editor) return;

/* RESET HANDLER */
editor.oninput = null;

editor.innerHTML = page.content || "";

editor.oninput = async ()=>{

  const content = editor.innerHTML.trim();

  if(content === page.content) return;

  page.content = content;

  await saveNote(note);

};



window.movePage = async function(noteId, pageId, dir){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

const index = note.pages.findIndex(p => p.id === pageId);
const newIndex = index + dir;

if(newIndex < 0 || newIndex >= note.pages.length) return;

[note.pages[index], note.pages[newIndex]] =
[note.pages[newIndex], note.pages[index]];

await saveNote(note);

renderPages(note, noteId);

};





window.togglePagePin = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);

const page = note.pages.find(p => p.id === pageId);

page.pinned = !page.pinned;

await saveNote(note);

renderPages(note, noteId);

};




window.addPage = async function(noteId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

note.pages.push({
  id: Date.now().toString(),
  name: "New Page",
  content: ""
});

await saveNote(note);

openNote(noteId);

};


window.formatText = function(type){

const editor = document.getElementById("editor");

if(type === "bold"){
document.execCommand("bold");
}

if(type === "italic"){
document.execCommand("italic");
}

if(type === "h1"){
document.execCommand("formatBlock", false, "h1");
}

editor.focus();

};




window.changeColor = function(color){

const editor = document.getElementById("editor");

if(!editor) return;

/* apply color */
document.execCommand("foreColor", false, color);

editor.focus();

};






window.downloadPage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

const page = note.pages.find(p => p.id === pageId);
if(!page) return;

const content = (page.content || "").replace(/<[^>]+>/g, "");

const blob = new Blob([content], { type: "text/plain" });

const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = (page.name || "page") + ".txt";
a.click();

};










window.exportNote = async function(id){

const notes = await getNotes();
const note = notes.find(n => n.id === id);

let content = "";

/* HEADER */
content += "========================================\n";
content += (note.title || "NOTE").toUpperCase() + "\n";
content += "========================================\n\n";

note.pages.forEach((p, i)=>{

  const clean = (p.content || "")
    .replace(/<br>/gi,"\n")
    .replace(/<\/p>/gi,"\n")
    .replace(/<[^>]+>/g,"")
    .trim();

  content += "----------------------------------------\n";
  content += `PAGE ${i+1}: ${(p.name || "Untitled").toUpperCase()}\n`;
  content += "----------------------------------------\n\n";

  content += clean + "\n\n\n";

});

/* FOOTER SPACE */
content += "========================================\n";

/* DOWNLOAD */
const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });

const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = (note.title || "note") + ".txt";
a.click();

};

/* =========================
BACK
========================= */

window.backToList = function(){

/* go back to notes list UI */
loadNotesApp();

/* keep app route */
history.replaceState({}, "", "/app/notes");

/* reset state */
window.__notes_initialized = true;

};
