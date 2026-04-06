const APP = {};

let __currentNoteId = null;


/* =========================
APP REGISTRY
========================= */

window.__apps = window.__apps || {};

window.__apps["note"] = async function(){
  Object.assign(window, APP);
  await loadNotesApp();
};





/* =========================
INDEXED DB (PRO STORAGE)
========================= */

const DB_NAME = "vidhwaan_notes_pdf_db";
const STORE = "note";

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

async function loadNotesApp(){

if(!history.state){
  history.replaceState({
    app: "note",
    screen: "home"
  }, "", "#home");
}

const view = document.getElementById("appView");
if(!view) return;

view.innerHTML = `

<div class="container">

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">

  <!-- LEFT: BACK -->
  <button class="btn btn-outline" onclick="backToList()">←</button>

  <!-- CENTER: TITLE -->
  <h2 style="margin:0;text-align:center;flex:1;">VID Code</h2>

  <!-- RIGHT: NEW -->
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
  </div>
  `;
  return;
}

container.innerHTML = notes.map(n => `
<div class="card" style="margin-bottom:12px;padding:12px;">

  <!-- TITLE -->
  <div style="cursor:pointer;word-break:break-word;margin-bottom:8px;"
       onclick="event.stopPropagation(); openNote('${n.id}')">
    ${n.pinned ? "📌 " : ""}
    <strong>${n.title || "Untitled"}</strong>
  </div>

  <!-- ACTIONS -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;">
    <button onclick="event.stopPropagation(); togglePin('${n.id}')">📌</button>
    <button onclick="event.stopPropagation(); renameNote('${n.id}')">✏️</button>
    <button onclick="event.stopPropagation(); deleteNote('${n.id}')">🗑️</button>
    <button onclick="event.stopPropagation(); exportNote('${n.id}')">Export</button>
  </div>

</div>
`).join("");

}

/* =========================
CREATE NOTE (MULTI PAGE)
========================= */

APP.createNote = async function(){

const newNote = {
  id: Date.now().toString(),
  title: "New Project",
  pinned: false,
  folder: "default",
  pages: [{ id: Date.now().toString(), name: "Page", content: "", pinned: false }]
};

await saveNote(newNote);

/* refresh list */
await renderNotes();

};

/* =========================
DELETE / RENAME / PIN
========================= */
APP.deleteNote = async function(id){
  await deleteNoteDB(id);
  await renderNotes();
};


APP.renameNote = async function(id){
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
await renderNotes();
};

APP.togglePin = async function(id){
const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

note.pinned = !note.pinned;

await saveNote(note);
await renderNotes();
};

/* =========================
OPEN NOTE (PAGES UI)
========================= */

APP.openNote = async function(id){

__currentNoteId = id;

history.pushState({
  app: "note",
  screen: "pages",
  noteId: id
}, "", "#pages");



const notes = await getNotes();
const note = notes.find(n => n.id === id);
if(!note){
  backToList();
  return;
}

const view = document.getElementById("appView");

view.innerHTML = `

<div class="container">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">

    <button class="btn btn-outline" onclick="goBack()">←</button>

    <h2 style="margin:0;text-align:center;flex:1;">${note.title || "Note"}</h2>

    <button class="btn btn-primary" onclick="addPage('${note.id}')">+ Page</button>

  </div>

  <input id="searchPages" placeholder="Search pages..." style="
    width:100%;
    padding:10px;
    margin-bottom:15px;
    border-radius:10px;
    border:none;
    background:#020617;
    color:white;
  ">

  <div id="pagesList"></div>

</div>
`;



renderPages(note, id);

document.getElementById("searchPages").addEventListener("input", ()=>{
  renderPages(note, id);
});

};





APP.changeFontSize = function(change){

let size = parseInt(document.getElementById("fontSizeInput").value || 14);

size += change;

if(size < 10) size = 10;
if(size > 40) size = 40;

document.getElementById("fontSizeInput").value = size;

applyFontSize(size);

};



function applyFontSize(size){

document.execCommand("fontSize", false, "7");

const fonts = document.getElementsByTagName("font");

for(let i = 0; i < fonts.length; i++){
  if(fonts[i].size === "7"){
    fonts[i].removeAttribute("size");
    fonts[i].style.fontSize = size + "px";
  }
}

}


window.applyFontSizeFromInput = function(){

let size = parseInt(document.getElementById("fontSizeInput").value);

if(size < 10) size = 10;
if(size > 40) size = 40;

applyFontSize(size);

};





window.applyColor = function(color){
  document.execCommand("foreColor", false, color);
};

window.setAlign = function(type){
  document.execCommand("justify" + type);
};






APP.updateNoteTitle = async function(noteId, value){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

note.title = value;

await saveNote(note);

};


/* =========================
PAGES SYSTEM
========================= */

function renderPages(note, noteId){

const list = document.getElementById("pagesList");

const query = document.getElementById("searchPages")?.value?.toLowerCase() || "";

/* FILTER */
let pages = note.pages.filter(p =>
  String(p.name || "").toLowerCase().includes(query)
);

/* SORT (same as notes) */
pages.sort((a,b)=>{
  if(b.pinned !== a.pinned){
    return (b.pinned === true) - (a.pinned === true);
  }
  return Number(b.id) - Number(a.id);
});

if(pages.length === 0){
  list.innerHTML = `
  <div style="text-align:center;opacity:0.6;padding:20px;">
  No pages<br>
  <small>Create your first page</small>
  </div>`;
  return;
}

list.innerHTML = pages.map(p => `
<div class="card" style="margin-bottom:12px;padding:12px;">

  <!-- TITLE -->
  <div style="cursor:pointer;word-break:break-word;margin-bottom:8px;"
       onclick="event.stopPropagation(); openPage('${noteId}','${p.id}')">
    ${p.pinned ? "📌 " : ""}
    <strong>${p.name || "Untitled"}</strong>
  </div>

  <!-- ACTIONS -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;">
    <button onclick="event.stopPropagation(); togglePagePin('${noteId}','${p.id}')">📌</button>
    <button onclick="event.stopPropagation(); renamePage('${noteId}','${p.id}')">✏️</button>
    <button onclick="event.stopPropagation(); deletePage('${noteId}','${p.id}')">🗑️</button>
    <button onclick="event.stopPropagation(); downloadPage('${noteId}','${p.id}')">Export</button>
  </div>

</div>
`).join("");



}




let draggedPage = null;

APP.dragStart = function(id){
draggedPage = id;
};



APP.dropPage = async function(noteId, targetId){

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






APP.renamePage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note){
  backToList();
  return;
}

const page = note.pages.find(p => p.id === pageId);
if(!page) return;

const name = prompt("Page name", page.name || "");

if(!name) return;

page.name = name.substring(0, 200);

await saveNote(note);

renderPages(note, noteId);

};





APP.togglePagePin = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note){
  backToList();
  return;
}

const page = note.pages.find(p => p.id === pageId);
if(!page) return;

page.pinned = !page.pinned;

await saveNote(note);

renderPages(note, noteId);
};



APP.deletePage = async function(noteId, pageId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note){
  backToList();
  return;
}

note.pages = note.pages.filter(p => p.id !== pageId);

await saveNote(note);

renderPages(note, noteId);
};


APP.openPage = async function(noteId, pageId){

history.pushState({
  app: "note",
  screen: "editor",
  noteId: noteId,
  pageId: pageId
}, "", "#editor");

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note) return;

const page = note.pages.find(p => p.id === pageId);
if(!page) return;

const view = document.getElementById("appView");

view.innerHTML = `

<div class="container">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <button class="btn btn-outline" onclick="goBack()">← Back</button>

    <strong>${page.name || "Untitled"}</strong>
  </div>

  <div class="editor-toolbar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">

    <button onclick="formatText('bold')">B</button>
    <button onclick="formatText('italic')">I</button>

    <button onclick="changeFontSize(-1)">-</button>

    <input id="fontSizeInput" type="number" value="14" min="10" max="40"
      style="width:60px;text-align:center;"
      onkeydown="if(event.key==='Enter'){ applyFontSizeFromInput(); }"
    />

    <button onclick="changeFontSize(1)">+</button>

    <input type="color" onchange="applyColor(this.value)">

    <button onclick="setAlign('left')">L</button>
    <button onclick="setAlign('center')">C</button>
    <button onclick="setAlign('right')">R</button>

  </div>

    <div id="editor" style="height:70vh;border-radius:12px;overflow:hidden;"></div>

  </div>
`;

const editorDiv = document.getElementById("editor");

editorDiv.innerHTML = `
<div id="docContainer" style="
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:20px;
  padding:20px;
  background:#f1f5f9;
  height:100%;
  overflow:auto;
">

  <div class="page" contenteditable="true" spellcheck="true" style="
    width:794px;
    min-height:1123px;
    background:white;
    padding:40px;
    outline:none;
    box-shadow:0 0 10px rgba(0,0,0,0.1);
    font-size:14px;
    line-height:1.5;
  "></div>

</div>
`;

const container = document.getElementById("docContainer");
const pageEl = container.querySelector(".page");

pageEl.innerHTML = page.content || "";

/* SAVE */
pageEl.addEventListener("input", async ()=>{
  page.content = container.innerHTML;
  await saveNote(note);
});

/* CLEAN PASTE */
pageEl.addEventListener("paste", (e)=>{
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData("text");
  document.execCommand("insertText", false, text);
});

/* AUTO PAGE BREAK */
pageEl.addEventListener("input", autoPaginate);
};



APP.addPage = async function(noteId){

const notes = await getNotes();
const note = notes.find(n => n.id === noteId);
if(!note){
  backToList();
  return;
}

note.pages.unshift({
  id: Date.now().toString(),
  name: "Page",
  content: "",
  pinned: false
});

await saveNote(note);

openNote(noteId);

};




APP.formatText = function(type){

const editor = document.getElementById("textEditor");
editor.focus();

if(type === "bold"){
  document.execCommand("bold");
}

if(type === "italic"){
  document.execCommand("italic");
}

};



APP.exportNote = async function(id){

  const notes = await getNotes();
  const note = notes.find(n => n.id === id);
  if(!note){
    backToList();
    return;
  }

  const zip = new JSZip();

  for(let i = 0; i < note.pages.length; i++){

    const page = note.pages[i];

    // convert HTML → proper text (same as downloadPage)
    const temp = document.createElement("div");
    temp.innerHTML = page.content || "";

    let text = "";

    function parseNode(node){
      if(node.nodeType === Node.TEXT_NODE){
        text += node.nodeValue;
      }

      if(node.nodeType === Node.ELEMENT_NODE){

        if(node.tagName === "BR"){
          text += "\n";
        }

        node.childNodes.forEach(parseNode);

        if(["DIV","P"].includes(node.tagName)){
          text += "\n";
        }
      }
    }

    temp.childNodes.forEach(parseNode);

    const content = text
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const meta = getFileMeta(page.name || `Page_${i+1}`);
    const path = meta.fileName.split("/").filter(Boolean);

    // create nested folders
    let folder = zip;

    for(let j = 0; j < path.length - 1; j++){
      folder = folder.folder(path[j]);
    }

    const jsPDF = window.jspdf.jsPDF;

    if(!jsPDF){
      alert("PDF failed. Reload page once.");
      return;
    }

    const pdf = new jsPDF();

    const lines = pdf.splitTextToSize(content, 180);
    pdf.text(lines, 10, 10);

    const pdfBlob = pdf.output("blob");

    folder.file(path[path.length - 1], pdfBlob);

 
  }

  const blob = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (note.title || "note") + ".zip";
  a.click();

};




function getFileMeta(name){

  let clean = (name || "file").trim();

  // KEEP folder structure logic intact
  if(!clean.endsWith(".pdf")){
    clean = clean + ".pdf";
  }

  return {
    fileName: clean,
    mime: "application/pdf"
  };
}









APP.downloadPage = async function(noteId, pageId){

  const notes = await getNotes();
  const note = notes.find(n => n.id === noteId);
  if(!note){
    backToList();
    return;
  }

  const page = note.pages.find(p => p.id === pageId);
  if(!page) return;

  // convert HTML → text
  const temp = document.createElement("div");
  temp.innerHTML = page.content || "";

  let text = "";

  function parseNode(node){
    if(node.nodeType === Node.TEXT_NODE){
      text += node.nodeValue;
    }

    if(node.nodeType === Node.ELEMENT_NODE){

      if(node.tagName === "BR"){
        text += "\n";
      }

      node.childNodes.forEach(parseNode);

      if(["DIV","P"].includes(node.tagName)){
        text += "\n";
      }
    }
  }

  temp.childNodes.forEach(parseNode);

  const content = text
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const meta = getFileMeta(page.name);
  const path = meta.fileName.split("/").filter(Boolean);

  /* ✅ SINGLE FILE */
  if(path.length === 1){

    const jsPDF = window.jspdf.jsPDF;

    if(!jsPDF){
      alert("PDF failed. Reload page once.");
      return;
    }
    const pdf = new jsPDF();

    const lines = pdf.splitTextToSize(content, 180);
    pdf.text(lines, 10, 10);

    pdf.save(meta.fileName);

    return;
  }

  /* ✅ FOLDER → ZIP */
  const zip = new JSZip();

  let folder = zip;

  for(let i = 0; i < path.length - 1; i++){
    folder = folder.folder(path[i]);
  }

  const jsPDF = window.jspdf.jsPDF;

  if(!jsPDF){
    alert("PDF failed. Reload page once.");
    return;
  }
  const pdf = new jsPDF();

  const lines = pdf.splitTextToSize(content, 180);
  pdf.text(lines, 10, 10);

  const pdfBlob = pdf.output("blob");

  folder.file(path[path.length - 1], pdfBlob);

  const blob = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (path[0] || "note") + ".zip";
  a.click();

};





window.addEventListener("popstate", async (e)=>{

  if(!window.location.pathname.includes("/note")) return;

  const state = e.state;

  if(!state){
    loadNotesApp();
    return;
  }

  if(state.screen === "pages"){
    __currentNoteId = state.noteId;
    openNote(state.noteId);
    return;
  }

  if(state.screen === "editor"){
    __currentNoteId = state.noteId;
    openPage(state.noteId, state.pageId);
    return;
  }

});



window.goBack = function(){

  const state = history.state;

  // if no state → go to main apps
  if(!state){
    window.location.href = "/app";
    return;
  }

  // editor → pages
  if(state.screen === "editor"){
    history.back();
    return;
  }

  // pages → home (notes list)
  if(state.screen === "pages"){
    loadNotesApp();
    return;
  }

  // home → main apps
  window.location.href = "/app";
};





function autoPaginate(){

const container = document.getElementById("docContainer");
const pages = container.querySelectorAll(".page");

pages.forEach(page => {

  if(page.scrollHeight > page.clientHeight){

    const newPage = document.createElement("div");

    newPage.className = "page";
    newPage.contentEditable = "true";
    newPage.spellcheck = true;
    newPage.style.cssText = page.style.cssText;

    newPage.innerHTML = page.innerHTML;
    page.innerHTML = "";

    page.after(newPage);
  }

});

}
