var current = null;
var next = null;

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

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

function getDuration() {
    duration = getUrlParameter('duration');

    if (duration === null) {
        duration = 30;
    }
    else {
        duration = parseInt(duration, 10);
    }

    // Convert from seconds to milliseconds.
    return duration * 1000;
}

window.onload = function() {
    intervalId = setInterval(advance, getDuration());
    next = document.getElementById('init');
    
    advance();
    advance();
};