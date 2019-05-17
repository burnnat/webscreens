"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var socket = require("socket.io");
var Socket = /** @class */ (function () {
    function Socket(http) {
        this.io = socket(http);
        this.connect();
    }
    Socket.prototype.connect = function () {
        var _this = this;
        this.io.on('connection', function (socket) {
            console.info("Socket connected : " + socket.id);
            _this.handlers(socket);
        });
    };
    Socket.prototype.handlers = function (socket) {
        socket.on('disconnect', function () {
            console.info("Socket disconnected : " + socket.id);
        });
    };
    return Socket;
}());
exports.Socket = Socket;
//# sourceMappingURL=index.js.map