/* =========================
LOCAL STORAGE ENGINE
========================= */

const STORAGE_KEY = "vidhwaan_notes_v1";

function getNotes(){
return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveNotes(notes){
localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/* =========================
OPEN NOTES APP
========================= */

window.openApp = function(app){

if(app === "notes"){
loadNotesApp();
}

};

/* =========================
LOAD NOTES UI
========================= */

function loadNotesApp(){

document.getElementById("utilities").style.display = "none";

const view = document.getElementById("appView");

view.style.display = "block";

view.innerHTML = `

<div class="container">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
<h2>Notes</h2>
<button class="btn btn-primary" onclick="createNote()">+ New</button>
</div>

<div id="notesList"></div>

</div>

`;

renderNotes();

}

/* =========================
RENDER NOTES LIST
========================= */

function renderNotes(){

const notes = getNotes();

const container = document.getElementById("notesList");

if(notes.length === 0){
container.innerHTML = "<p>No notes yet</p>";
return;
}

container.innerHTML = notes.map(n => `

<div class="card" style="margin-bottom:12px;">

  <div style="display:flex;justify-content:space-between;">
    <strong onclick="openNote('${n.id}')" style="cursor:pointer;">
      ${n.title || "Untitled"}
    </strong>

```
<div>
  <button onclick="renameNote('${n.id}')">✏️</button>
  <button onclick="deleteNote('${n.id}')">🗑️</button>
</div>
```

  </div>

</div>
`).join("");

}

/* =========================
CREATE NOTE
========================= */

window.createNote = function(){

const notes = getNotes();

const newNote = {
id: Date.now().toString(),
title: "New Note",
content: ""
};

notes.unshift(newNote);

saveNotes(notes);

renderNotes();

};

/* =========================
DELETE
========================= */

window.deleteNote = function(id){

let notes = getNotes();

notes = notes.filter(n => n.id !== id);

saveNotes(notes);

renderNotes();

};

/* =========================
RENAME
========================= */

window.renameNote = function(id){

const notes = getNotes();

const note = notes.find(n => n.id === id);

const newTitle = prompt("Rename note", note.title);

if(!newTitle) return;

note.title = newTitle;

saveNotes(notes);

renderNotes();

};

/* =========================
OPEN NOTE (EDITOR)
========================= */

window.openNote = function(id){

const notes = getNotes();

const note = notes.find(n => n.id === id);

const view = document.getElementById("appView");

view.innerHTML = `

<div class="container">

<div style="display:flex;justify-content:space-between;margin-bottom:12px;">
<button class="btn btn-outline" onclick="backToList()">← Back</button>
<strong>${note.title}</strong>
</div>

<textarea id="noteEditor" style="
width:100%;
height:70vh;
background:#020617;
color:white;
border:none;
outline:none;
padding:12px;
border-radius:12px;
">${note.content}</textarea>

</div>

`;

document.getElementById("noteEditor").addEventListener("input", (e)=>{
note.content = e.target.value;
saveNotes(notes);
});

};

/* =========================
BACK
========================= */

window.backToList = function(){
loadNotesApp();
};
