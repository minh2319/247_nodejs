var path = require("path");
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var arrListOrder = [];
//Tạo socket
const nsp = io.of('/socket.io/');

nsp.on('connection', function (socket) {
    console.log('connection')
    var arrListOrderId = [];
    for (var i in arrListOrder) {
        arrListOrderId.push(arrListOrder[i][0])
    }
    nsp.emit('listOrderId', arrListOrderId);
    socket.on('disconnect', function () {
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
            if(nameCs.length==0)
            {
                nameCs=orderId;
            }
            nsp.emit('enableOrder', nameCs,orderId);

        }
    });
    // io.sockets.emit('guidata', arrName);
    //Disable đơn hàng của CS đang truy cập
    socket.on('addOrder', function (data) {
        arrListOrder[socket.id] = [];
        arrListOrder[socket.id].push(data);
        let flag = 0;
        for (var i in arrListOrder) {
            //TH 1 người mở nhiều trang thì chỉ show tên 1 lần
            if (arrListOrder[ i ][ 0 ].csName == data.csName && arrListOrder[ i ][ 0 ].orderId == data.orderId) {
                flag += 1
            }
            //TH người khác mở chung 1 đơn hàng thì hiện thêm tên người đó vào đơn hàng
            if (arrListOrder[ i ][ 0 ].csName != data.csName && arrListOrder[ i ][ 0 ].orderId == data.orderId) {
                data.key=1;
            }
        }

        if (flag < 2) {
            nsp.emit('disableOrder', data);
        }
    });

});

//Khởi tạo 1 server listen tại 1 port
server.listen(3000);
