; "use strict";

["header", "footer"].forEach(html => {
    const xhr = new XMLHttpRequest();

    xhr.onload = e => document.querySelector(html).innerHTML = xhr.responseText;

    xhr.open("GET", `${html}.html`);
    xhr.send();
});