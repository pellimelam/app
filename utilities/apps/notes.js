/* =========================
APP REGISTRY
========================= */

window.__apps = window.__apps || {};

window.__apps["notes"] = function(){
loadNotesApp();
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
    
    <div onclick="openNote('${n.id}')" style="cursor:pointer;">
      ${n.pinned ? "📌 " : ""}
      <strong>${n.title || "Untitled"}</strong>
    </div>

    <div>
      <button onclick="togglePin('${n.id}')">📌</button>
      <button onclick="renameNote('${n.id}')">✏️</button>
      <button onclick="deleteNote('${n.id}')">🗑️</button>
      <button onclick="exportNote('${n.id}')">Export</button>
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
pages: [{ id: Date.now().toString(), content: "" }]
};

await saveNote(newNote);

renderNotes();

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

note.title = name;

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

const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

const view = document.getElementById("appView");

view.innerHTML = `

<div class="notes-app">

  <!-- SIDEBAR -->

  <div class="notes-sidebar">

```
<div class="sidebar-top">
  <button class="btn btn-outline" onclick="backToList()">←</button>
  <strong>${note.title}</strong>
</div>

<div id="pagesList" class="pages-list"></div>

<button class="btn btn-primary" onclick="addPage('${note.id}')">
  + Page
</button>
```

  </div>

  <!-- EDITOR -->

  <div class="notes-editor">

```
<!-- TOOLBAR -->
<div class="editor-toolbar">
  <button onclick="formatText('bold')">B</button>
  <button onclick="formatText('italic')">I</button>
  <button onclick="formatText('h1')">H1</button>
</div>

<!-- EDITABLE AREA -->
<div id="editor" contenteditable="true" class="editor-area"></div>
```

  </div>

</div>

`;

renderPages(note, id);

};

/* =========================
PAGES SYSTEM
========================= */

function renderPages(note, noteId){

const list = document.getElementById("pagesList");

list.innerHTML = note.pages.map((p,i)=>`

<div class="page-item"
draggable="true"
ondragstart="dragStart('${p.id}')"
ondrop="dropPage('${noteId}','${p.id}')"
ondragover="event.preventDefault()"
onclick="openPage('${noteId}','${p.id}')">
  Page ${i+1}
</div>
`).join("");

openPage(noteId, note.pages[0].id);

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





window.openPage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;
const page = note.pages.find(p => p.id === pageId);
if(!page) return;

const editor = document.getElementById("editor");

if(editor){
  editor.blur(); // ensure previous input event fires
}

editor.innerHTML = page.content || "";
setTimeout(()=> editor.focus(), 0);


editor.oninput = async ()=>{
  page.content = editor.innerHTML;

  const text = editor.innerText.trim();
  if(text.length > 3){
    note.title = text.substring(0, 30);
    document.querySelector(".sidebar-top strong").innerText = note.title;
  }

  await saveNote(note);
};

};


window.addPage = async function(noteId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

note.pages.push({
  id: Date.now().toString(),
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


window.exportNote = async function(id){

const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

let content = note.pages.map(p => p.content).join("\n\n");

const blob = new Blob([content], { type: "text/plain" });

const a = document.createElement("a");
const url = URL.createObjectURL(blob);
a.href = url;
a.download = note.title + ".txt";
a.click();

setTimeout(()=> URL.revokeObjectURL(url), 1000);

};



/* =========================
BACK
========================= */

window.backToList = function(){
loadNotesApp();
};
