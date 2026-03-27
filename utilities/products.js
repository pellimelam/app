export function loadProducts(){

const section = `

<section class="section">

<div class="container">

<div class="section-title">Platforms</div>

<div class="grid">

<a class="card" href="https://pellimelam.vidhwaan.com">

<div class="card-title">Vidhwaan PelliMelam</div>

<div class="card-desc">
Traditional wedding music platform
</div>

</a>


<a class="card" href="https://ai.vidhwaan.com">

<div class="card-title">Vidhwaan AI</div>

<div class="card-desc">
AI automation and intelligent tools
</div>

</a>


<a class="card" href="https://tech.vidhwaan.com">

<div class="card-title">Vidhwaan Technology</div>

<div class="card-desc">
Software engineering and digital platforms
</div>

</a>


<a class="card" href="https://foundation.vidhwaan.com">

<div class="card-title">Vidhwaan Foundation</div>

<div class="card-desc">
Social initiatives and community development
</div>

</a>

</div>

</div>

</section>

`

document.getElementById("products").innerHTML = section

}
