/* =========================
STORAGE ENGINE (UPGRADED)
========================= */

const STORAGE_KEY = "vidhwaan_notes_v2";

function getNotes(){
return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveNotes(notes){
localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/* =========================
OPEN APP
========================= */

window.openApp = function(app){
if(app === "notes") loadNotesApp();
};

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

<div id="notesList"></div>

</div>

`;

document.getElementById("searchNotes").addEventListener("input", renderNotes);

renderNotes();

}

/* =========================
RENDER LIST
========================= */

function renderNotes(){

const query = document.getElementById("searchNotes")?.value?.toLowerCase() || "";

let notes = getNotes();

/* FILTER */
notes = notes.filter(n =>
n.title.toLowerCase().includes(query)
);

/* SORT (PIN FIRST) */
notes.sort((a,b)=> (b.pinned === true) - (a.pinned === true));

const container = document.getElementById("notesList");

if(notes.length === 0){
container.innerHTML = "<p>No notes found</p>";
return;
}

container.innerHTML = notes.map(n => `

<div class="card" style="margin-bottom:12px;">

  <div style="display:flex;justify-content:space-between;">

```
<div onclick="openNote('${n.id}')" style="cursor:pointer;">
  ${n.pinned ? "📌 " : ""}
  <strong>${n.title || "Untitled"}</strong>
</div>

<div>
  <button onclick="togglePin('${n.id}')">📌</button>
  <button onclick="renameNote('${n.id}')">✏️</button>
  <button onclick="deleteNote('${n.id}')">🗑️</button>
</div>
```

  </div>

</div>
`).join("");

}

/* =========================
CREATE NOTE (MULTI PAGE)
========================= */

window.createNote = function(){

const notes = getNotes();

const newNote = {
id: Date.now().toString(),
title: "New Note",
pinned: false,
pages: [
{
id: Date.now().toString(),
content: ""
}
]
};

notes.unshift(newNote);

saveNotes(notes);

renderNotes();

};

/* =========================
DELETE / RENAME / PIN
========================= */

window.deleteNote = function(id){
let notes = getNotes();
notes = notes.filter(n => n.id !== id);
saveNotes(notes);
renderNotes();
};

window.renameNote = function(id){
const notes = getNotes();
const note = notes.find(n => n.id === id);
const name = prompt("Rename note", note.title);
if(!name) return;
note.title = name;
saveNotes(notes);
renderNotes();
};

window.togglePin = function(id){
const notes = getNotes();
const note = notes.find(n => n.id === id);
note.pinned = !note.pinned;
saveNotes(notes);
renderNotes();
};

/* =========================
OPEN NOTE (PAGES UI)
========================= */

window.openNote = function(id){

const notes = getNotes();
const note = notes.find(n => n.id === id);

const view = document.getElementById("appView");

view.innerHTML = `

<div class="container">

<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
<button class="btn btn-outline" onclick="backToList()">← Back</button>
<strong>${note.title}</strong>
</div>

<div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap;" id="pagesBar"></div>

<textarea id="editor" style="
width:100%;
height:65vh;
background:#020617;
color:white;
border:none;
outline:none;
padding:12px;
border-radius:12px;
"></textarea>

</div>

`;

renderPages(note, id);

};

/* =========================
PAGES SYSTEM
========================= */

function renderPages(note, noteId){

const bar = document.getElementById("pagesBar");

bar.innerHTML = note.pages.map((p,i)=>`<button onclick="openPage('${noteId}','${p.id}')">Page ${i+1}</button>`).join("") + `<button onclick="addPage('${noteId}')">+</button>`;

openPage(noteId, note.pages[0].id);

}

window.openPage = function(noteId, pageId){

const notes = getNotes();
const note = notes.find(n => n.id === noteId);
const page = note.pages.find(p => p.id === pageId);

const editor = document.getElementById("editor");

editor.value = page.content;

editor.oninput = (e)=>{
page.content = e.target.value;
saveNotes(notes);
};

};

window.addPage = function(noteId){

const notes = getNotes();
const note = notes.find(n => n.id === noteId);

note.pages.push({
id: Date.now().toString(),
content: ""
});

saveNotes(notes);

openNote(noteId);

};

/* =========================
BACK
========================= */

window.backToList = function(){
loadNotesApp();
};
