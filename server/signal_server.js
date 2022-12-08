var ws = require("nodejs-websocket");
var port = 10001;
var server = ws.createServer(function (conn) {
    console.log("有新的连接");
    conn.sendText("我收到你的连接了..");
    conn.on("text", function (str) {
        console.log("recv msg: " + str);
    });
    conn.on("close", function (code, reason) {
        console.log("连接关闭 " + code + " >>>  reason " + reason);
    });

    conn.on("error", function (str) {
        console.log("监听到错误: " + str);
    });

}).listen(port);