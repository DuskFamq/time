window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime || 0;
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
);

var loaded = false;

function init() {
    if (loaded) return;
    loaded = true;
    var mobile = window.isDevice;
    var koef = 1;
    var canvas = document.getElementById("heart");
    var ctx = canvas.getContext("2d");
    var width = (canvas.width = koef * innerWidth);
    var height = (canvas.height = koef * innerHeight);
    var rand = Math.random;

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, width, height);

    function heartPosition(rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(
                15 * Math.cos(rad) -
                5 * Math.cos(2 * rad) -
                2 * Math.cos(3 * rad) -
                Math.cos(4 * rad)
            ),
        ];
    }

    function scaleAndTranslate(pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    }

    var pointsOrigin = [];
    var heartPointsCount = 0;
    var targetPoints = [];

    function setupPoints() {
        pointsOrigin = [];
        let heartScale = mobile ? Math.min(width, height) / 2.7 : Math.min(width, height) / 4; // адаптивный масштаб
        let dr = mobile ? 0.1 : 0.1;

        for (let i = 0; i < Math.PI * 2; i += dr)
            pointsOrigin.push(scaleAndTranslate(heartPosition(i), heartScale, heartScale / 16, 0, 0));
       

        heartPointsCount = pointsOrigin.length;
    }

    setupPoints();

    window.addEventListener("resize", function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.fillRect(0, 0, width, height);
        setupPoints(); // Перестроим точки при изменении размера
    });

    var traceCount = mobile ? 20 : 50;
    var e = [];
    for (var i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.2,
            f: "rgb(255, 33, 33)",
            trace: Array.from({ length: traceCount }, () => ({ x, y })),
        };
    }

    var config = { traceK: 0.4, timeDelta: 0.6 };
    var time = 0;

    function pulse(kx, ky) {
        for (var i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [
                kx * pointsOrigin[i][0] + width / 2,
                ky * pointsOrigin[i][1] + height / 2.2,
            ];
        }
    }

    function loop() {
        var n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;

        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);

        for (var i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);

            if (length < 10) {
                if (rand() > 0.95) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (rand() > 0.99) u.D *= -1;
                    u.q = (u.q + u.D) % heartPointsCount;
                    if (u.q < 0) u.q += heartPointsCount;
                }
            }

            u.vx += (-dx / length) * u.speed;
            u.vy += (-dy / length) * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;

            for (var k = 0; k < u.trace.length - 1; k++) {
                var T = u.trace[k];
                var N = u.trace[k + 1];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }

            ctx.fillStyle = u.f;
            u.trace.forEach((t) => ctx.fillRect(t.x, t.y, 1, 1));
        }

        window.requestAnimationFrame(loop, canvas);
    }

    loop();
}

document.addEventListener("DOMContentLoaded", function () {
    init();
});
