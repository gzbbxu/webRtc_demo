'use strict';

//join 主动加入房间
//leave 主动离开房间
//new-peer 有人加入房间，通知已经在房间的人
//peer-leave 有人离开房间，通知已经在房间的人
//offer 发送offer 给对端peer
//answer 发送offer 给对端peer
//candidate 发送candidate 给对端peer

const SIGNAL_TYPE_JOIN = "join";
const SIGNAL_TYPE_RESP_JOIN = "resp-join";  // 告知加入者对方是谁
const SIGNAL_TYPE_LEAVE = "leave";
const SIGNAL_TYPE_NEW_PEER = "new-peer";
const SIGNAL_TYPE_PEER_LEAVE = "peer-leave";
const SIGNAL_TYPE_OFFER = "offer";
const SIGNAL_TYPE_ANSWER = "answer";
const SIGNAL_TYPE_CANDIDATE = "candidate";

//本地userId 36进制
var localUserId = Math.random().toString(36).substring(2);
var remoteUserId = -1;
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var loclalStream = null;
var roomId = 0;

var mWebRtcEngine;
//类
var WebRtcEngine = function (wsUrl) {
    this.init(wsUrl);
    mWebRtcEngine = this;
    return this;
}

WebRtcEngine.prototype.init = function (wsUrl) {
    //增加属性wsUrl
    this.wsUrl = wsUrl;
    this.signaling = null;//存储webSocket 对象
}


WebRtcEngine.prototype.createWebsocket = function () {
    mWebRtcEngine = this;
    mWebRtcEngine.signaling = new WebSocket(this.wsUrl);
    mWebRtcEngine.signaling.onopen = function () {
        mWebRtcEngine.onOpen();
    }
    mWebRtcEngine.signaling.onmessage = function (ev) {
        mWebRtcEngine.onMessage(ev);
    }

    mWebRtcEngine.signaling.onerror = function (ev) {
        mWebRtcEngine.onError(ev);
    }

    mWebRtcEngine.signaling.onclose = function (ev) {
        mWebRtcEngine.onClose(ev);
    }
}

function doJoin(roomId) {
    var jsonMsg = {
        'cmd': 'join',
        'roomId': roomId,
        'uid': localUserId,
    };
    //做序列化
    let message = JSON.stringify(jsonMsg);
    mWebRtcEngine.sendMessage(message);
    console.log("do jion >> message " + message);
}

WebRtcEngine.prototype.onMessage = function (event) {
    console.log("websocket onMessage " + event.data);
    let jsonMsg = JSON.parse(event.data);
    switch (jsonMsg.cmd) {
        case SIGNAL_TYPE_NEW_PEER: //new-peer 有新的user 进入房间
            handleRemoteNewPeer(jsonMsg);
            break;
        case SIGNAL_TYPE_RESP_JOIN:  // resp-join 收到加入者是谁
            handleResponseJoin();
            break;
        case SIGNAL_TYPE_PEER_LEAVE:
            handleRemotePeerLeave();
            break;
    }
}

WebRtcEngine.prototype.onOpen = function () {
    console.log("websocket openx");
}

WebRtcEngine.prototype.onError = function (event) {
    console.log("websocket onError " + event.data);
}

WebRtcEngine.prototype.onClose = function (event) {
    console.log("websocket onClose " + event.code + " >>> reason >>> " + event.reason);
}

WebRtcEngine.prototype.sendMessage = function (message) {
    this.signaling.send(message);
}


function handleRemoteNewPeer(message) {
    console.log("handleRemoteNewPeer , remoteUid " + message.remoteUid);
    remoteUserId = message.remoteUid;
}

function handleResponseJoin(message) {
    console.log("handleResponseJoin , remoteUid " + message.remoteUid);
}
function handleRemotePeerLeave(message) {
    //收到离开事件
    console.log("handleRemotePeerLeave , remoteUid " + message.remoteUid);
    remoteVideo.srcObject = null;
}

mWebRtcEngine = new WebRtcEngine("ws://localhost:10001");

mWebRtcEngine.createWebsocket();

function openLocalStream(stream) {
    doJoin(roomId);
    localVideo.srcObject = stream;
    loclalStream = stream;
}

function initLocalStream() {
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
        .then(openLocalStream)
        .catch(function (e) {
            alert("get user media error" + e.name);
        });
}

document.getElementById('joinBtn').onclick = function () {
    console.log("加入按钮点击");
    roomId = document.getElementById('roomId').value;
    if (roomId == "" || roomId == "请输入房间ID") {
        alert("请输入房间ID");
        return;
    }
    //初始化本地码流
    // initLocalStream();
    doJoin(roomId);
}

function doLeave() {
    let jsonMsg = {
        'cmd': SIGNAL_TYPE_LEAVE,
        'roomId': roomId,
        'uid': localUserId
    };
    let message = JSON.stringify(jsonMsg);
    mWebRtcEngine.sendMessage(message);
    console.log("do doLeave >> message " + message);
}
document.getElementById('leaveBtn').onclick = function () {
    console.log("离开按钮被点击");
    //
    doLeave();
}