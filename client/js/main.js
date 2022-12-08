'use strict';
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var loclalStream = null;

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



WebRtcEngine.prototype.onMessage = function (event) {
    console.log("websocket onMessage " + event.data);
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

mWebRtcEngine = new WebRtcEngine("ws://localhost:10001");

mWebRtcEngine.createWebsocket();


function openLocalStream(stream) {
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
    //初始化本地码流

}