export function loadApps(){

const html = `

<section class="section">

<div class="container">

<!-- SECTION TITLE -->

<div style="margin-bottom:20px;">
<h2 style="font-size:18px;color:#94a3b8;">Utilities</h2>
</div>

<!-- APPS GRID -->

<div class="apps-grid">

<!-- NOTES APP -->

<div class="app-card" onclick="openApp('notes')">
<div class="app-icon">📝</div>
<div class="app-name">Notes</div>
</div>

</div>

</div>

</section>

<!-- APP VIEW -->

<div id="appView" style="display:none;"></div>

`;

document.getElementById("utilities").innerHTML = html;

}
