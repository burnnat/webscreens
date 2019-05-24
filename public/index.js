var current = null;
var next = null;

function preloadImage(imageId) {
    var el = document.createElement('div');
    el.style.backgroundImage = 'url(/api/image/' + imageId + ')';
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

function request(api, callback) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function (e) {
        callback(e.target.response);
    };
    oReq.open('GET', '/api/' + api + '?b=' + Date.now(), true);
    oReq.responseType = 'json';
    oReq.send();
}

function advance() {
    request(
        'next',
        function (result) {
            activate(next);
            deactivate(current);

            current = next;
            next = preloadImage(result.value);
        }
    );
}

var intervalId;

function stop() {
    clearInterval(intervalId);
}

window.onload = function() {
    intervalId = setInterval(advance, 5000);

    next = document.getElementById('init');
    advance();
    advance();
};