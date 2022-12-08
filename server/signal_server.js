var ws = require("nodejs-websocket");
var HashMap = require("hashmap");

const SIGNAL_TYPE_JOIN = "join";
const SIGNAL_TYPE_RESP_JOIN = "resp-join";  // 告知加入者对方是谁
const SIGNAL_TYPE_LEAVE = "leave";
const SIGNAL_TYPE_NEW_PEER = "new-peer";
const SIGNAL_TYPE_PEER_LEAVE = "peer-leave";
const SIGNAL_TYPE_OFFER = "offer";
const SIGNAL_TYPE_ANSWER = "answer";
const SIGNAL_TYPE_CANDIDATE = "candidate";
//join 主动加入房间
//leave 主动离开房间
//new-peer 有人加入房间，通知已经在房间的人
//peer-leave 有人离开房间，通知已经在房间的人
//offer 发送offer 给对端peer
//answer 发送offer 给对端peer
//candidate 发送candidate 给对端peer
var port = 10001;

var mRoomTableMap = new HashMap();

function Client(uid, conn, roomId) {
    this.uid = uid;
    this.conn = conn;
    this.roomId = roomId;
}
function handlejoin(message, conn) {
    let roomId = message.roomId;
    let uid = message.uid;
    console.log("uid " + uid + " try to join room " + roomId);

    let roomMap = mRoomTableMap.get(roomId);

    if (roomMap == null) {
        roomMap = new HashMap();
        mRoomTableMap.set(roomId, roomMap);
    }
    if (roomMap.count() >= 2) {
        console.error("roomId: " + roomId + "  已经有两人存在，请使用其他房间");
        //加信令通知客户端，房间已经满了
        return;
    }
    let client = new Client(uid, conn, roomId);
    roomMap.set(uid, client);
    if (roomMap.count() > 1) {
        //房间已经有人了，加上新进来的人，所以要通知对方
        roomMap.forEach(function (value, key) {
            //通知对方 key 对端的uid , value client对象
            let remoteUid = key;
            if (key != uid) {
                let jsonMsg = {
                    'cmd': SIGNAL_TYPE_NEW_PEER, //new-peer 
                    'remoteUid': uid  // 给对方发送要发送自己的uid
                };
                let msg = JSON.stringify(jsonMsg);
                let remoteClient = value;
                console.info();
                //通知别人加入房间
                console.log("new-peer:" + msg);
                remoteClient.conn.sendText(msg);

                jsonMsg = {
                    'cmd': SIGNAL_TYPE_RESP_JOIN, //resp-join
                    'remoteUid': remoteUid
                };
                msg = JSON.stringify(jsonMsg);
                //自己的conn 通知自己 已经加入房间
                console.log("resp-join  " + msg);
                conn.sendText(msg);
            }
        });
    }

}
function handleLeave(message) {
    let roomId = message.roomId;
    let uid = message.uid;
    console.log("uid " + uid + " try to leave room " + roomId);
    let roomMap = mRoomTableMap.get(roomId);
    if (roomMap == null) {
        console.error("can't find the roomId " + roomId);
        return;
    }
    roomMap.remove(uid); //从数据源中删除
    if (roomMap.count() >= 1) {
        //房间还存在其他人,发送离开消息给其他人
        roomMap.forEach(function (value, key) {
            let remoteUid = key;
            let remoteClient = value;
            let jsonMsg = {
                'cmd': SIGNAL_TYPE_PEER_LEAVE,
                'remoteUid': uid //谁离开而来就发送谁的id
            };
            let msg = JSON.stringify(jsonMsg);
            if (remoteClient) {
                //通知其他人，某个人离开了
                console.info("notify peer: " + remoteUid + ", ui + " + uid + " leave");
                remoteClient.conn.sendText(msg);
            }
        });
    }
}
var server = ws.createServer(function (conn) {
    console.log("有新的连接");
    conn.sendText("我收到你的连接了..");
    conn.on("text", function (str) {
        console.log("收到信息: " + str);
        let jsonMsg = JSON.parse(str);
        switch (jsonMsg.cmd) {
            case SIGNAL_TYPE_JOIN:
                handlejoin(jsonMsg, conn);
                break;
            case SIGNAL_TYPE_LEAVE:
                handleLeave(jsonMsg);
                break;
        }
    });
    conn.on("close", function (code, reason) {
        console.log("连接关闭 " + code + " >>>  reason " + reason);
    });

    conn.on("error", function (str) {
        console.log("监听到错误: " + str);
    });

}).listen(port);