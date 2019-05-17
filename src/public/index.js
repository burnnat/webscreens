let current = null;
let next = null;

function preloadImage(imageId) {
    const el = document.createElement('div');
    el.style = `background-image: url(/api/image/${imageId})`;
    el.className = 'slide next';

    document.body.appendChild(el);

    return el;
}

function activate(el) {
    if (el != null) {
        el.className = 'slide current';
    }
}

function deactivate(el) {
    if (el != null) {
        document.body.removeChild(el);
    }
}

function advance() {
    fetch('/api/next')
        .then((resp) => resp.json())
        .then((result) => {
            activate(next);
            deactivate(current);
            current = next;
            next = preloadImage(result.value);
        });
}

setInterval(advance, 15000);

advance();
advance();