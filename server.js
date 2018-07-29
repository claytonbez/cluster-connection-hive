var express = require('express');
var cluster = require('cluster');
var net = require('net');
var sio = require('socket.io');
var farmhash = require('farmhash');
var colors = require('colors');
var port = 8080;
var numProc = require('os').cpus().length;

if (cluster.isMaster) {
    var workers = [];
    var spawn = function (i) {
        workers[i] = {};
        workers[i] = cluster.fork();
        workers[i].on('exit', function (code, signal) {
            console.log('respawning worker', i);
            spawn(i);
        });
    };
    for (var i = 0; i < numProc; i++) {
        spawn(i);
    }
    var worker_index = function (ip, len) {
        return farmhash.fingerprint32(ip) % len; // Farmhash is the fastest and works with IPv6, too
    };

    var server = net.createServer({
        pauseOnConnect: true
    }, function (connection) {
        var worker = workers[worker_index(connection.remoteAddress, numProc)];
        worker.send('sticky-session:connection', connection);
        worker.on('message', msg => {
            var myID = worker_index(connection.remoteAddress, numProc)
            for (var i = 0; i < workers.length; i++) {
                (function () {
                    var itt = i;
                    if (myID !== itt) { //send to all but sender
                        workers[itt].send(msg);
                    }
                })();
            }
        });
    }).listen(port);
} else {
    var app = new express();
    app.use(express.static(__dirname + "/public"));
    var server = app.listen(0, 'localhost', function () {
            console.log(`Cluster Socket.IO Server Running! PID ${process.pid}`)
    });
    var io = sio(server);
    process.on('message', function (message, connection) {
        if (message !== 'sticky-session:connection') {
            emitToRoom(message);
        } else {
            server.emit('connection', connection);
            connection.resume();
        }

    });
    io.on('connection', (socket) => {
        console.log('connection --> %s', socket.handshake.address);
        socket.emit('proc', process.pid);
        socket.on('reg', (room) => {
            socket.join(room);
        });
        socket.on('de-reg', (room) => {
            room = room.toLowerCase();
            socket.leave(room);
        });
        socket.on('evt', (data) => {
            emitToRoom(data)
            process.send(data);
        });
    });
    function emitToRoom(data) {
        var dr = data.room.split(",");
        if (dr.length > 1) {
            for (var i = 0; i < dr.length; i++) {
                io.in(dr[i]).emit('message', data);
            }
        } else {
            io.in(data.room).emit('evt', data);
        }
    }
}