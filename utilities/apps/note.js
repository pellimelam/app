/* =========================
VID NOTE (TEXT + PDF)
WORLD-CLASS IMPLEMENTATION
========================= */

window.__apps = window.__apps || {};

window.__apps["note"] = async function(){
  await loadNoteApp();
};

/* =========================
INDEXED DB (SEPARATE DB)
========================= */

const NOTE_DB = "vidhwaan_text_db";
const NOTE_STORE = "notes";

let noteDBPromise;

function initNoteDB(){
  if(noteDBPromise) return noteDBPromise;

  noteDBPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(NOTE_DB, 1);

    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains(NOTE_STORE)){
        db.createObjectStore(NOTE_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = (e)=> resolve(e.target.result);
    req.onerror = reject;
  });

  return noteDBPromise;
}

async function getAllNotes(){
  const db = await initNoteDB();

  return new Promise(resolve=>{
    const tx = db.transaction(NOTE_STORE, "readonly");
    const store = tx.objectStore(NOTE_STORE);
    const req = store.getAll();

    req.onsuccess = ()=> resolve(req.result || []);
    req.onerror = ()=> resolve([]);
  });
}

async function saveNote(note){
  const db = await initNoteDB();
  const tx = db.transaction(NOTE_STORE, "readwrite");
  tx.objectStore(NOTE_STORE).put(note);
}

async function deleteNote(id){
  const db = await initNoteDB();
  const tx = db.transaction(NOTE_STORE, "readwrite");
  tx.objectStore(NOTE_STORE).delete(id);
}

/* =========================
UI LOAD
========================= */

async function loadNoteApp(){

  const view = document.getElementById("appView");

  view.innerHTML = `
  <div class="container">

    <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
      <button class="btn btn-outline" onclick="backToList()">←</button>
      <h2 style="margin:0;">VID Note</h2>
      <button class="btn btn-primary" onclick="createNewNote()">+ New</button>
    </div>

    <div id="noteList"></div>

  </div>
  `;

  renderNoteList();
}

/* =========================
LIST VIEW
========================= */

async function renderNoteList(){

  const notes = await getAllNotes();

  const container = document.getElementById("noteList");

  if(notes.length === 0){
    container.innerHTML = `
      <div style="text-align:center;opacity:0.6;">
        No notes<br>
        <small>Create your first note</small>
      </div>
    `;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="card" style="padding:12px;margin-bottom:10px;">
      <div onclick="openNote('${n.id}')" style="cursor:pointer;">
        <strong>${n.title}</strong>
      </div>

      <div style="margin-top:8px;">
        <button onclick="deleteNoteUI('${n.id}')">🗑️</button>
        <button onclick="downloadPDF('${n.id}')">PDF</button>
      </div>
    </div>
  `).join("");
}

/* =========================
CREATE
========================= */

window.createNewNote = async function(){

  const note = {
    id: Date.now().toString(),
    title: "New Note",
    content: ""
  };

  await saveNote(note);
  renderNoteList();
};

/* =========================
DELETE
========================= */

window.deleteNoteUI = async function(id){
  await deleteNote(id);
  renderNoteList();
};

/* =========================
EDITOR
========================= */

window.openNote = async function(id){

  const notes = await getAllNotes();
  const note = notes.find(n => n.id === id);

  const view = document.getElementById("appView");

  view.innerHTML = `
  <div class="container">

    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
      <button class="btn btn-outline" onclick="loadNoteApp()">←</button>
      <input value="${note.title}" 
             onchange="updateTitle('${id}', this.value)"
             style="flex:1;margin:0 10px;">
      <button onclick="downloadPDF('${id}')">PDF</button>
    </div>

    <textarea id="noteEditor" style="
      width:100%;
      height:80vh;
      background:#020617;
      color:white;
      border:none;
      padding:15px;
      border-radius:12px;
      font-size:15px;
    ">${note.content || ""}</textarea>

  </div>
  `;

  const editor = document.getElementById("noteEditor");

  editor.addEventListener("input", async ()=>{
    note.content = editor.value;
    await saveNote(note);
  });
};

window.updateTitle = async function(id, value){
  const notes = await getAllNotes();
  const note = notes.find(n => n.id === id);

  note.title = value;
  await saveNote(note);
};

/* =========================
PDF EXPORT (CORE FEATURE)
========================= */

window.downloadPDF = async function(id){

  const notes = await getAllNotes();
  const note = notes.find(n => n.id === id);

  const win = window.open("", "_blank");

  win.document.write(`
    <html>
    <head>
      <title>${note.title}</title>
      <style>
        body {
          font-family: Arial;
          white-space: pre-wrap;
          padding: 40px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      ${escapeHTML(note.content)}
    </body>
    </html>
  `);

  win.document.close();

  win.print(); // native PDF (exact same content)
};

/* =========================
SECURITY (NO HTML BREAK)
========================= */

function escapeHTML(text){
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
