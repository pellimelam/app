export function loadHero(){

const hero = `

<section class="hero">

<img src="./icons1/logo.png" class="logo" alt="Vidhwaan Logo">

<h1>Vidhwaan Group</h1>

<p>Technology · Culture · Innovation</p>

<div class="hero-buttons">

<a class="btn btn-primary" href="https://tech.vidhwaan.com">
Explore Technology
</a>

<a class="btn btn-outline" href="https://pellimelam.vidhwaan.com">
Explore Culture
</a>

</div>

</section>

`

document.getElementById("hero").innerHTML = hero

}
