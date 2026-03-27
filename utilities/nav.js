export function loadNav(){

const nav = `

<header class="nav">

<div class="nav-inner">

<div class="nav-left">
<span class="brand">Vidhwaan</span>
</div>

<!-- HAMBURGER -->
<div class="nav-toggle" id="navToggle">
<span></span>
<span></span>
<span></span>
</div>

<nav class="nav-links" id="navLinks">

<a href="https://pellimelam.vidhwaan.com">PelliMelam</a>
<a href="https://ai.vidhwaan.com">AI</a>
<a href="https://tech.vidhwaan.com">Technology</a>
<a href="https://foundation.vidhwaan.com">Foundation</a>

</nav>

</div>

</header>

`

document.getElementById("nav").innerHTML = nav

/* SAFE TOGGLE */
const toggle = document.getElementById("navToggle")
const links = document.getElementById("navLinks")

if(toggle && links){
toggle.addEventListener("click", ()=>{
links.classList.toggle("active")
})
}

}
