document.addEventListener('DOMContentLoaded', function() {
    var windowHeight = window.innerHeight;
    var fullHeight = document.getElementById('container').scrollHeight;
    
    var distance = fullHeight - windowHeight;

    if (distance <= 0) {
        return;
    }

    var moveto = new MoveTo(
        {
            duration: 50 * distance,
            easing: 'easeInOutSin',
            callback: scrollWithDelay
        },
        {
            easeInOutSin: function(t, b, c, d) {
                return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
            }
        }
    );

    function scroll() {
        moveto.move(distance);
        distance = -distance;
    }

    function scrollWithDelay() {
        setTimeout(scroll, 3000);
    }

    scrollWithDelay();
});