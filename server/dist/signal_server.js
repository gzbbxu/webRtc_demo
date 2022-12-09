"use strict";
var ws = require("nodejs-websocket");
// npm i --save-dev @types/node
(function () {
    class JoinBusiness {
        process(BaseBusiness, conn) {
            let joinMsgObj = BaseBusiness;
            let roomId = joinMsgObj.roomId;
            let uid = joinMsgObj.uid;
            roomMananger.dojoin(roomId, uid, conn);
        }
    }
    class LeaveBusiness {
        process(BaseBusiness, conn) {
            roomMananger.doLeave();
        }
    }
    class NewPeerBusiness {
        process(msgObj, conn) {
        }
    }
    class Client {
        constructor(uid, conn, roomId) {
            this.mUid = uid;
            this.mConn = conn;
            this.mRoomId = roomId;
        }
        getUid() {
            return this.mUid;
        }
        getConn() {
            return this.mConn;
        }
        getRoomId() {
            return this.mRoomId;
        }
        sendNewPeerMsg(targetUid) {
            let newPeerBusiness = {
                cmd: WebSocketServer.SIGNAL_TYPE_NEW_PEER,
                roomId: this.mRoomId,
                uid: "-1",
                remoteUid: targetUid
            };
            this.mConn.sendText(JSON.stringify(newPeerBusiness));
        }
    }
    class RoomManager {
        constructor() {
            //key 为房间id
            this.mRoomTableMap = new Map;
        }
        dojoin(roomId, uid, conn) {
            //1, 首先检验房间是否存在
            let roomMap = this.mRoomTableMap.get(roomId);
            if (roomMap == null) {
                //2 房间不存在，则创建
                roomMap = new Map();
                this.mRoomTableMap.set(roomId, roomMap);
            }
            //3,  如果房间里的人数大于2了，提示请使用其他房间
            if (roomMap.size >= 2) {
                console.error("roomId: " + roomId + " 已经有两人存在，请使用其他房间");
                return;
            }
            let client = new Client(uid, conn, roomId);
            roomMap.set(uid, client);
            if (roomMap.size > 1) {
                //4, 如果房间已经有人了，所以要通知对方
                roomMap.forEach(function (value, key, map) {
                    let remoteUid = key;
                    let client = value;
                    //5,判断是不是自己,不是自己才给发送
                    if (remoteUid != uid) {
                        client.sendNewPeerMsg(uid);
                    }
                });
            }
        }
        doLeave() {
        }
    }
    const roomMananger = new RoomManager();
    class WebSocketServer {
        handlejoin(jsonMsg, conn) {
            // var jsonMsg = {
            //     'cmd': 'join',
            //     'roomId': roomId,
            //     'uid': localUserId,
            // }
            // let joinMsgObj: JoInMsg = JSON.parse(jsonMsg);
        }
        handleLeave(jsonMsg) {
        }
        createServer() {
            var server = ws.createServer(function (conn) {
                console.log("有新的连接");
                conn.sendText("我收到你的连接了..");
                conn.on("text", function (str) {
                    console.log("收到信息: " + str);
                    let jsonMsg = JSON.parse(str);
                    let baseLogic;
                    let baseMsgObj;
                    switch (jsonMsg.cmd) {
                        case WebSocketServer.SIGNAL_TYPE_JOIN:
                            // handlejoin(jsonMsg, conn);
                            let joinMsgObj = jsonMsg;
                            baseMsgObj = joinMsgObj;
                            baseLogic = new JoinBusiness();
                            break;
                        case WebSocketServer.SIGNAL_TYPE_LEAVE:
                            let leaveMsgObj = jsonMsg;
                            baseMsgObj = leaveMsgObj;
                            baseLogic = new LeaveBusiness();
                            break;
                    }
                    if (baseLogic != null && baseMsgObj != null) {
                        baseLogic.process(baseMsgObj, conn);
                    }
                });
                conn.on("close", function (code, reason) {
                    console.log("连接关闭 " + code + " >>>  reason " + reason);
                });
                conn.on("error", function (str) {
                    console.log("监听到错误: " + str);
                });
            }).listen(WebSocketServer.port);
        }
    }
    WebSocketServer.port = 10001;
    WebSocketServer.SIGNAL_TYPE_JOIN = "join";
    WebSocketServer.SIGNAL_TYPE_RESP_JOIN = "resp-join"; // 告知加入者对方是谁
    WebSocketServer.SIGNAL_TYPE_LEAVE = "leave";
    WebSocketServer.SIGNAL_TYPE_NEW_PEER = "new-peer";
    WebSocketServer.SIGNAL_TYPE_PEER_LEAVE = "peer-leave";
    WebSocketServer.SIGNAL_TYPE_OFFER = "offer";
    WebSocketServer.SIGNAL_TYPE_ANSWER = "answer";
    WebSocketServer.SIGNAL_TYPE_CANDIDATE = "candidate";
    const socketServer = new WebSocketServer();
    socketServer.createServer();
})();
