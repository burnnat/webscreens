var current = null;
var next = null;

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function center(viewportSize, imageSize) {
    var position = Math.max(
        Math.min(
            Math.floor((viewportSize - imageSize) / 2),
            viewportSize
        ),
        0
    );

    return position + 'px';
}

function preloadImage(imageId) {
    var el = new Image();
    el.className = 'slide next';

    el.onload = function() {
        var viewWidth = window.innerWidth;
        var imgWidth = el.width;

        var viewHeight = window.innerHeight;
        var imgHeight = el.height;

        if (imgWidth < viewWidth && imgHeight < viewHeight) {
            // No scaling needed, just center.
            el.style.left = center(viewWidth, imgWidth);
            el.style.top = center(viewHeight, imgHeight);
        }
        else {
            var horizScale = imgWidth / viewWidth;
            var vertScale = imgHeight / viewHeight;

            if (horizScale > vertScale) {
                // Scale horizontally to fit.
                el.style.width = viewWidth + 'px';
                el.style.left = 0;
                el.style.top = center(viewHeight, imgHeight / horizScale);
            }
            else {
                // Scale vertically to fit.
                el.style.height = viewHeight + 'px';
                el.style.left = center(viewWidth, imgWidth / vertScale);
                el.style.top = 0;
            }
        }
    }

    el.src = '../api/image/' + imageId;

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
    oReq.open('GET', '../api/' + api + '?b=' + Date.now(), true);
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