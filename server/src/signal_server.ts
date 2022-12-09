var ws = require("nodejs-websocket");
// npm i --save-dev @types/node
(function () {

    interface BaseMsgObj {
        cmd: string;
        roomId: string;
        uid: string
    }
    interface JoInMsgObj extends BaseMsgObj {

    }
    interface LeaveMsgObj extends BaseMsgObj {

    }
    interface NewPeerMsgObj extends BaseMsgObj {
        remoteUid: string;
    }
    interface RespJoinMsgObj extends BaseMsgObj {
        remoteUid: string;
    }
    interface BaseBusiness {
        process(msgObj: BaseMsgObj, conn: any): void;
    }

    class JoinBusiness implements BaseBusiness {
        process(BaseBusiness: BaseMsgObj, conn: any): void {
            let joinMsgObj: JoInMsgObj = BaseBusiness;
            let roomId = joinMsgObj.roomId;
            let uid = joinMsgObj.uid;
            roomMananger.dojoin(roomId, uid, conn);
        }
    }
    class LeaveBusiness implements BaseBusiness {
        process(BaseBusiness: BaseMsgObj, conn: any): void {
            roomMananger.doLeave();
        }
    }


    class NewPeerBusiness implements BaseBusiness {
        process(msgObj: BaseMsgObj, conn: any): void {

        }
    }

    class Client {
        private mUid: string;
        private mConn: any;
        private mRoomId: string;

        constructor(uid: string, conn: any, roomId: string) {
            this.mUid = uid;
            this.mConn = conn;
            this.mRoomId = roomId;
        }
        public getUid(): string {

            return this.mUid;
        }
        public getConn(): any {
            return this.mConn;
        }
        public getRoomId(): string {
            return this.mRoomId;
        }
        public sendNewPeerMsg(targetUid: string) {
            let newPeerBusiness: NewPeerMsgObj = {
                cmd: WebSocketServer.SIGNAL_TYPE_NEW_PEER,
                roomId: this.mRoomId,
                uid: "-1",
                remoteUid: targetUid
            };
            let msg = JSON.stringify(newPeerBusiness);
            console.log(msg);
            this.mConn.sendText(msg);
        }
        public sendRespJoin(targetUid: string) {
            let respJoinMsgObj: RespJoinMsgObj = {
                cmd: WebSocketServer.SIGNAL_TYPE_RESP_JOIN,
                roomId: this.mRoomId,
                uid: "-1",
                remoteUid: targetUid
            };
            let msg = JSON.stringify(respJoinMsgObj);
            console.log(msg);
            this.mConn.sendText(msg);
        }
    }

    class RoomManager {
        //key 为房间id
        readonly mRoomTableMap: Map<string, Map<string, Client>> = new Map;
        public dojoin(roomId: string, uid: string, conn: any) {
            //1, 首先检验房间是否存在
            let roomMap = this.mRoomTableMap.get(roomId);
            if (roomMap == null) {
                //2 房间不存在，则创建
                roomMap = new Map<string, Client>();
                this.mRoomTableMap.set(roomId, roomMap);
            }
            //3,  如果房间里的人数大于2了，提示请使用其他房间
            if (roomMap.size >= 2) {
                console.error("roomId: " + roomId + " 已经有两人存在，请使用其他房间");
                return;
            }
            let myClient: Client = new Client(uid, conn, roomId);

            roomMap.set(uid, myClient);
            if (roomMap.size > 1) {
                //4, 如果房间已经有人了，所以要通知对方,把我的uid发送出去。
                roomMap.forEach(function (value, key, map) {
                    let remoteUid = key;
                    let otherClient = value;
                    //5,判断是不是自己,
                    if (remoteUid != uid) {
                        //6 不是自己才给其他客户端发送自己的uid
                        otherClient.sendNewPeerMsg(uid);
                        //7, 紧接着给自己发送加入房间的消息，保护对方的id
                        myClient.sendRespJoin(remoteUid);
                    }
                });
            }
        }
        public doLeave() {

        }
    }
    const roomMananger: RoomManager = new RoomManager();






    class WebSocketServer {
        static port: number = 10001;

        static readonly SIGNAL_TYPE_JOIN = "join";
        static readonly SIGNAL_TYPE_RESP_JOIN = "resp-join";  // 告知加入者对方是谁
        static readonly SIGNAL_TYPE_LEAVE = "leave";
        static readonly SIGNAL_TYPE_NEW_PEER = "new-peer";
        static readonly SIGNAL_TYPE_PEER_LEAVE = "peer-leave";
        static readonly SIGNAL_TYPE_OFFER = "offer";
        static readonly SIGNAL_TYPE_ANSWER = "answer";
        static readonly SIGNAL_TYPE_CANDIDATE = "candidate";

        private handlejoin(jsonMsg: string, conn: any) {
            // var jsonMsg = {
            //     'cmd': 'join',
            //     'roomId': roomId,
            //     'uid': localUserId,

            // }
            // let joinMsgObj: JoInMsg = JSON.parse(jsonMsg);

        }
        private handleLeave(jsonMsg: string) {

        }
        public createServer() {
            var server = ws.createServer(function (conn: any) {
                console.log("有新的连接");
                conn.sendText("我收到你的连接了..");
                conn.on("text", function (str: string) {
                    console.log("收到信息: " + str);
                    let jsonMsg = JSON.parse(str);
                    let baseLogic!: BaseBusiness;

                    let baseMsgObj!: BaseMsgObj;
                    switch (jsonMsg.cmd) {
                        case WebSocketServer.SIGNAL_TYPE_JOIN:
                            // handlejoin(jsonMsg, conn);
                            let joinMsgObj: JoInMsgObj = jsonMsg;
                            baseMsgObj = joinMsgObj;
                            baseLogic = new JoinBusiness();
                            break;
                        case WebSocketServer.SIGNAL_TYPE_LEAVE:
                            let leaveMsgObj: LeaveMsgObj = jsonMsg;
                            baseMsgObj = leaveMsgObj;
                            baseLogic = new LeaveBusiness();
                            break;
                    }
                    if (baseLogic != null && baseMsgObj != null) {
                        baseLogic.process(baseMsgObj, conn);
                    }
                });
                conn.on("close", function (code: number, reason: string) {
                    console.log("连接关闭 " + code + " >>>  reason " + reason);
                });

                conn.on("error", function (str: string) {
                    console.log("监听到错误: " + str);
                });

            }).listen(WebSocketServer.port);
        }


    }

    const socketServer: WebSocketServer = new WebSocketServer();

    socketServer.createServer();
})();

