export function loadApps(){

const html = `

<section class="section">

<div class="container">

<h2 style="text-align:center;margin-bottom:30px;">
Apps
</h2>

<div class="apps-grid">

<!-- NOTES APP -->

<div class="app-card" onclick="openApp('notes')">
<div class="app-icon">📝</div>
<div class="app-name">Notes</div>
</div>

<!-- FUTURE APPS PLACEHOLDER -->

<div class="app-card disabled">
<div class="app-icon">+</div>
<div class="app-name">Coming Soon</div>
</div>

</div>

</div>

</section>

<!-- APP VIEW -->

<div id="appView" style="display:none;"></div>

`;

document.getElementById("utilities").innerHTML = html;

}
