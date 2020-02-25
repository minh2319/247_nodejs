var path = require("path");
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
/*
Default redis:(Ip: '127.0.0.1',Port: 6379);
 */
var client = redis.createClient();
var arrListOrder = [];

//Tạo socket
const nsp = io.of('/socket.io/');
const request = require('request');
const https = require('https')
nsp.on('connection', function (socket) {
    console.log('connection')
    if (socket.handshake.query.userID) {
        var userId = socket.handshake.query.userID;
        UpdateUserActivate(userId);
    }
    var arrListOrderId = [];
    for (var i in arrListOrder) {
        arrListOrderId.push(arrListOrder[ i ][ 0 ])
    }
    nsp.emit('listOrderId', arrListOrderId);


    socket.on('disconnect', function () {
        /*
        Nhận dữ liệu gửi qua từ giaonhan
         */
        if (userId) {
            UpdateUserDisconnect(userId);
        }
        if (arrListOrder[ socket.id ]) {
            //Mở khóa nút sửa đơn hàng khi Cs thoát khỏi đơn hàng đó
            // nsp.emit('enableOrder', arrListOrder[ socket.id ]);
            //Lấy mã đơn hàng bị tác động
            let orderId = arrListOrder[ socket.id ][ 0 ].orderId;
            let nameCs = [];
            delete arrListOrder[ socket.id ]
            for (var i in arrListOrder) {
                if (arrListOrder[ i ][ 0 ].orderId == orderId) {
                    nameCs.push(arrListOrder[ i ][ 0 ].csName);
                }
            }
            //Nếu không còn user nào trong đơn nữa thì gửi orderid đơn qua
            if (nameCs.length == 0) {
                nameCs = orderId;
            }
            console.log(nameCs);
            nsp.emit('enableOrder', nameCs, orderId);

        }
    });
    // io.sockets.emit('guidata', arrName);
    //Disable đơn hàng của CS đang truy cập
    socket.on('addOrder', function (data) {
        arrListOrder[ socket.id ] = [];
        arrListOrder[ socket.id ].push(data);
        let flag = 0;
        for (var i in arrListOrder) {
            //TH 1 người mở nhiều trang thì chỉ show tên 1 lần
            if (arrListOrder[ i ][ 0 ].csName == data.csName && arrListOrder[ i ][ 0 ].orderId == data.orderId) {
                flag += 1
            }
            //TH người khác mở chung 1 đơn hàng thì hiện thêm tên người đó vào đơn hàng
            if (arrListOrder[ i ][ 0 ].csName != data.csName && arrListOrder[ i ][ 0 ].orderId == data.orderId) {
                data.key = 1;
            }
        }

        console.log(flag)
        if (flag < 2) {
            nsp.emit('disableOrder', data);
        }
    });

});

function UpdateUserActivate(userId) {
    let csTab = 0;
    let csTime = new Date().getTime();
    csTime = Math.round(csTime / 1000)
    client.get('csTab:' + userId, function (error, result) {
        if (result) {
            csTab = parseInt(result);
        }
        csTab += 1;
        /*
        Lấy giá trị Tab hiện tại và time để cập nhật lại vào user
         */
        client.set([ 'csTab:' + userId, csTab ]);
        client.set([ 'csTime:' + userId, csTime ]);
    });
}

function UpdateUserDisconnect(userId) {
    /*
    Lấy =1, để 1 trừ 1 thì cũng =0
     */
    let csTab = 1;
    client.get('csTab:' + userId, function (error, result) {
        if (result) {
            csTab = parseInt(result);
        }
        csTab -= 1;
        if (csTab < 0) {
            csTab = 0;
        }
        client.set([ 'csTab:' + userId, csTab ]);
    });
}

//Khởi tạo 1 server listen tại 1 port
server.listen(3000);
