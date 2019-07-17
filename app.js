var path = require("path");
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var arrListOrder = [];
console.log('oke')
//Tạo socket
io.on('connection', function (socket) {
    console.log('connection')
    var arrListOrderId = [];
    for(var i in arrListOrder){
        arrListOrderId.push( arrListOrder[i][0])
    }

    io.sockets.emit('listOrderId', arrListOrderId);

    socket.on('disconnect', function () {
        //Mở khóa nút sửa đơn hàng khi Cs thoát khỏi đơn hàng đó
        io.sockets.emit('enableOrder', arrListOrder[socket.id]);
        delete arrListOrder[socket.id]
    });
    // io.sockets.emit('guidata', arrName);
    //Disable đơn hàng của CS đang truy cập
    socket.on('addOrder', function (data) {
        arrListOrder[socket.id]=[];
        arrListOrder[socket.id].push(data);
        io.sockets.emit('disableOrder', data);
    });

});

//Khởi tạo 1 server listen tại 1 port
server.listen(3000);
