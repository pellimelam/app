export function loadApps(){

const html = `

<section class="section">

<div class="container">

<!-- UTILITIES SECTION -->

<div style="margin-bottom:25px;">
<h2 style="font-size:16px;color:#94a3b8;margin-bottom:15px;">
Utilities
</h2>

<div class="apps-grid">

<div class="app-card" onclick="openApp('notes')">
<div class="app-icon">📝</div>
<div class="app-name">Notes</div>
</div>

</div>
</div>

</div>

</section>

<!-- APP VIEW -->

<div id="appView" style="display:none;"></div>

`;

document.getElementById("utilities").innerHTML = html;

}
