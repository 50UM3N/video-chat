function detectMob() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i,
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
// const name = prompt("Your name");
const myPeer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3000",
});
var Peer_ID;
const myVideo = document.createElement("video");
myVideo.muted = true;
var myVideoStream;
var myVideoTrack;
const peers = {};

navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
        navigator.mediaDevices
            .getUserMedia({
                video: true,
                audio: true,
            })
            .then((stream) => {
                myVideoStream = stream;
                myVideoTrack = stream.getVideoTracks()[0];
                processStream(myVideoStream);
            });
    })
    .catch((err) => {
        navigator.mediaDevices
            .getUserMedia({
                video: true,
                audio: false,
            })
            .then((stream) => {
                myVideoStream = stream;
                processStream(myVideoStream);
            });
    });

socket.on("user-disconnected", (userId, count) => {
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
        changeCount(count);
    }
});

function processStream(stream) {
    addVideoStream(myVideo, myVideoStream, null, {
        name: name,
        audio: myVideoStream.getAudioTracks()[0].enabled,
        video: myVideoStream.getVideoTracks()[0].enabled,
    });
    // recieve the others stream
    myPeer.on("call", (call) => {
        peers[call.peer] = call;
        call.answer(myVideoStream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
            fetch(`/user?peer=${call.peer}&room=${ROOM_ID}`)
                .then((res) => {
                    return res.json();
                })
                .then((data) => {
                    addVideoStream(
                        video,
                        userVideoStream,
                        call.peer,
                        data.user
                    );
                });
        });
        call.on("close", () => {
            video.parentElement.remove();
        });
    });

    socket.on("user-connected", (userId, fname, audio, video, count) => {
        socket.emit("user-callback");
        connectToNewUser(userId, myVideoStream);
        changeCount(count);
    });
}
myPeer.on("open", (id) => {
    Peer_ID = id;
    console.log("peer id is : ", id);
});
const changeCount = (count) => {
    const counter = document.getElementById("user-number");
    counter.innerHTML = count;
};
function connectToNewUser(userId, stream) {
    // set others peerid and send my stream
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        fetch(`/user?peer=${call.peer}&room=${ROOM_ID}`)
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                addVideoStream(
                    video,
                    userVideoStream,
                    call.peer,
                    data.user,
                    data.admin
                );
            });
    });
    call.on("close", () => {
        video.parentElement.remove();
    });
    peers[userId] = call;
}
var localAudioFXElement;
function addVideoStream(video, stream, peerId, user) {
    // create microphone button
    const micBtn = document.createElement("button");
    micBtn.classList.add("video-element");
    micBtn.classList.add("mic-button");
    micBtn.innerHTML = `<ion-icon name="mic-off-outline"></ion-icon>`;
    micBtn.classList.add("mic-off");

    // create audio FX
    const audioFX = new SE(stream);
    const audioFXElement = audioFX.createElement();
    audioFXElement.classList.add("mic-button");

    if (user.audio) micBtn.classList.add("off");
    else audioFXElement.classList.add("off");

    // video off element
    const videoOffIndicator = document.createElement("div");
    videoOffIndicator.classList.add("video-off-indicator");
    videoOffIndicator.innerHTML = `<ion-icon name="videocam-outline"></ion-icon>`;

    // create pin button
    const pinBtn = document.createElement("button");
    pinBtn.classList.add("video-element");
    pinBtn.classList.add("pin-button");
    pinBtn.innerHTML = `<ion-icon name="expand-outline"></ion-icon>`;

    // create option button
    // const optionBtn = document.createElement("button");
    // optionBtn.classList.add("video-element");
    // optionBtn.classList.add("options-button");
    // optionBtn.innerHTML = `<ion-icon name="ellipsis-horizontal-outline"></ion-icon>`;

    // main wrapper
    const videoWrapper = document.createElement("div");
    videoWrapper.id = "video-wrapper";
    videoWrapper.classList.add("video-wrapper");

    // peer name
    const namePara = document.createElement("p");
    namePara.innerHTML = user.name;
    namePara.classList.add("video-element");
    namePara.classList.add("name");

    const elementsWrapper = document.createElement("div");
    elementsWrapper.classList.add("elements-wrapper");
    elementsWrapper.appendChild(namePara);
    // elementsWrapper.appendChild(optionBtn);
    elementsWrapper.appendChild(pinBtn);
    elementsWrapper.appendChild(micBtn);
    elementsWrapper.appendChild(audioFXElement);
    elementsWrapper.appendChild(videoOffIndicator);

    video.srcObject = stream;
    video.setAttribute("peer", peerId);
    video.setAttribute("name", user.name);

    if (peerId == null) {
        video.classList.add("mirror");
        localAudioFXElement = audioFX;
    }

    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    videoWrapper.appendChild(elementsWrapper);
    videoWrapper.appendChild(video);

     videoGrid.append(videoWrapper);

    const observer = new MutationObserver((mutationsList, observer) => {
        const removeNodeLength = mutationsList[0].removedNodes.length;
        const targetNode = mutationsList[0].target;
        if (removeNodeLength > 0) {
            targetNode.remove();
            observer.disconnect();
        }
    });
    observer.observe(videoWrapper, {
        childList: true,
    });
    eventAdd(pinBtn);
}
const eventAdd = (element) => {
    element.addEventListener("click", (e) => {
        const videoWrapper = e.target.parentElement.parentElement;
        if (e.target.childNodes[0].getAttribute("name") == "expand-outline") {
            e.target.innerHTML = `<ion-icon name="contract-outline"></ion-icon>`;
        } else {
            e.target.innerHTML = `<ion-icon name="expand-outline"></ion-icon>`;
        }
        videoWrapper.classList.toggle("zoom-video");
    });
};

// share screen
const shareScreenBtn = document.getElementById("share-screen");
shareScreenBtn.addEventListener("click", (e) => {
    if (e.target.classList.contains("true")) return;
    e.target.setAttribute("tool_tip", "You are already presenting screen");
    e.target.classList.add("true");
    navigator.mediaDevices
        .getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
            },
        })
        .then((stream) => {
            var videoTrack = stream.getVideoTracks()[0];
            myVideoTrack = myVideoStream.getVideoTracks()[0];
            replaceVideoTrack(myVideoStream, videoTrack);
            for (peer in peers) {
                let sender = peers[peer].peerConnection
                    .getSenders()
                    .find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    });
                sender.replaceTrack(videoTrack);
            }
            const elementsWrapper = document.querySelector(".elements-wrapper");
            const stopBtn = document.createElement("button");
            stopBtn.classList.add("video-element");
            stopBtn.classList.add("stop-presenting-button");
            stopBtn.innerHTML = "Stop Sharing";
            elementsWrapper.classList.add("screen-share");
            elementsWrapper.appendChild(stopBtn);
            videoTrack.onended = () => {
                elementsWrapper.classList.remove("screen-share");
                stopBtn.remove();
                stopPresenting(videoTrack);
            };
            stopBtn.onclick = () => {
                videoTrack.stop();
                elementsWrapper.classList.remove("screen-share");
                stopBtn.remove();
                stopPresenting(videoTrack);
            };
        });
});

const stopPresenting = (videoTrack) => {
    shareScreenBtn.classList.remove("true");
    shareScreenBtn.setAttribute("tool_tip", "Present Screen");
    for (peer in peers) {
        let sender = peers[peer].peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(myVideoTrack);
    }
    replaceVideoTrack(myVideoStream, myVideoTrack);
};

const crossBtnClickEvent = (e) => {
    const videoWrapper = e.target.parentElement;
    if (videoWrapper.classList.contains("zoom-video")) {
        videoWrapper.classList.remove("zoom-video");
        e.target.removeEventListener("click", crossBtnClickEvent);
        e.target.remove();
    }
};

// External

// video toggle
const videoToggleBtn = document.getElementById("video-toggle");
videoToggleBtn.addEventListener("click", (e) => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    const currentElement = e.target;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        socket.emit("video-toggle", false);
        videoWrapperVideoToggle(myVideo, false);
        currentElement.innerHTML = `<ion-icon name="videocam-off-outline"></ion-icon>`;
        currentElement.setAttribute("tool_tip", "Video On");
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        socket.emit("video-toggle", true);
        videoWrapperVideoToggle(myVideo, true);
        currentElement.innerHTML = `<ion-icon name="videocam-outline"></ion-icon>`;
        currentElement.setAttribute("tool_tip", "Video Off");
    }
});

const videoWrapperVideoToggle = (element, type) => {
    const videoWrapper = element.previousSibling;
    if (type) videoWrapper.classList.remove("video-disable");
    else videoWrapper.classList.add("video-disable");
};

const micToggleButton = document.getElementById("mic-toggle");
micToggleButton.addEventListener("click", (e) => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    const currentElement = e.target;
    if (enabled) {
        socket.emit("audio-toggle", false);
        videoWrapperMicToggle(myVideo, false);
        myVideoStream.getAudioTracks()[0].enabled = false;
        currentElement.innerHTML = `<ion-icon name="mic-off-outline"></ion-icon>`;
        currentElement.setAttribute("tool_tip", "Microphone On");
    } else {
        socket.emit("audio-toggle", true);
        videoWrapperMicToggle(myVideo, true);
        myVideoStream.getAudioTracks()[0].enabled = true;
        currentElement.innerHTML = `<ion-icon name="mic-outline"></ion-icon>`;
        currentElement.setAttribute("tool_tip", "Microphone Off");
    }
});

socket.on("user-audio-toggle", (id, type) => {
    videoWrapperMicToggle(document.querySelector(`video[peer="${id}"]`), type);
});

socket.on("user-video-toggle", (id, type) => {
    videoWrapperVideoToggle(
        document.querySelector(`video[peer="${id}"]`),
        type
    );
});

const videoWrapperMicToggle = (element, type) => {
    const videoWrapper = element.previousSibling;
    const micButtons = videoWrapper.childNodes;
    if (type) {
        micButtons[3].classList.remove("off");
        micButtons[2].classList.add("off");
    } else {
        micButtons[2].classList.remove("off");
        micButtons[3].classList.add("off");
    }
};

// const shareBtn = document.querySelector(".share-btn");
// shareBtn.addEventListener("click", (e) => {
//   e.target.parentElement.classList.toggle("active");
// });

const meetingToggleBtn = document.getElementById("meeting-toggle");
meetingToggleBtn.addEventListener("click", (e) => {
    const currentElement = e.target;
    const counter = document.getElementById("user-number");
    const count = Number(counter.innerText) + 1;
    if (currentElement.classList.contains("call-button")) {
        changeCount(count);
        currentElement.classList.remove("call-button");
        currentElement.classList.add("call-end-button");
        currentElement.classList.add("tooltip-danger");
        currentElement.setAttribute("tool_tip", "Leave the Meeting");
        socket.emit(
            "join-room",
            ROOM_ID,
            Peer_ID,
            USER_ID,
            name,
            myVideoStream.getAudioTracks()[0].enabled,
            myVideoStream.getVideoTracks()[0].enabled
        );
    } else location.replace(`/`);
});

// copy text
// const copyBtn = document.getElementById("copy");
// copyBtn.addEventListener("mousedown", (e) => {
//   const text = `https://digiclass.site/${ROOM_ID}`;
//   navigator.clipboard.writeText(text);
//   copyBtn.style.setProperty("--tooltip", '"copied"');
// });
// copyBtn.addEventListener("mouseout", (e) => {
//   copyBtn.style.setProperty("--tooltip", '"copy"');
// });
const camToggleBtn = document.getElementById("cams-toggle");
camToggleBtn.addEventListener("click", (e) => {
    myVideoStream.getTracks().forEach((track) => {
        track.stop();
    });
    myVideo.classList.toggle("mirror");
    var cams = e.target.getAttribute("camera");
    cams = JSON.parse(cams);
    var camId;
    for (cam in cams) {
        if (cams[cam] == false) {
            camId = cam;
            cams[cam] = true;
        } else {
            cams[cam] = false;
        }
    }
    e.target.setAttribute("camera", JSON.stringify(cams));
    navigator.mediaDevices
        .getUserMedia({
            video: { deviceId: { exact: camId } },
            audio: true,
        })
        .then((stream) => {
            myVideoStream = stream;
            localAudioFXElement.replaceStream(stream);
            let videoTrack = stream.getVideoTracks()[0];
            let audioTrack = stream.getAudioTracks()[0];
            myVideo.srcObject = stream;
            for (peer in peers) {
                let sender = peers[peer].peerConnection
                    .getSenders()
                    .find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    });
                sender.replaceTrack(videoTrack);
                sender = peers[peer].peerConnection
                    .getSenders()
                    .find(function (s) {
                        return s.track.kind == audioTrack.kind;
                    });
                sender.replaceTrack(audioTrack);
            }
        })
        .catch((error) => {
            console.log(error);
        });
});
// const changeCam = (e) => {
//   myVideoStream.getTracks().forEach((track) => {
//     track.stop();
//   });
//   var cams = e.getAttribute("camera");
//   cams = JSON.parse(cams);
//   // console.log(cams);
//   var camId;
//   for (cam in cams) {
//     if (cams[cam] == false) {
//       camId = cam;
//       cams[cam] = true;
//     } else {
//       cams[cam] = false;
//     }
//   }
//   e.setAttribute("camera", JSON.stringify(cams));
//   navigator.mediaDevices
//     .getUserMedia({
//       video: { deviceId: { exact: camId } },
//       audio: true,
//     })
//     .then((stream) => {
//       myVideoStream = stream;
//       let videoTrack = stream.getVideoTracks()[0];
//       let audioTrack = stream.getAudioTracks()[0];
//       myVideo.srcObject = stream;
//       for (peer in peers) {
//         let sender = peers[peer].peerConnection.getSenders().find(function (s) {
//           return s.track.kind == videoTrack.kind;
//         });
//         sender.replaceTrack(videoTrack);
//         sender = peers[peer].peerConnection.getSenders().find(function (s) {
//           return s.track.kind == audioTrack.kind;
//         });
//         sender.replaceTrack(audioTrack);
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };

const replaceVideoTrack = (stream, videoTrack) => {
    stream.removeTrack(stream.getVideoTracks()[0]);
    stream.addTrack(videoTrack);
};
const recordingBtn = document.getElementById("recording-toggle");
const chunks = [];
var recorder;
recordingBtn.addEventListener("click", (e) => {
    const currentElement = e.target;
    const indicator = document.querySelector(".recording-indicator");

    // recording start
    if (indicator == null) {
        currentElement.setAttribute("tool_tip", "Stop Recording");
        currentElement.classList.add("tooltip-danger");
        currentElement.classList.add("blink");
        const recordingElement = document.createElement("div");
        recordingElement.classList.add("recording-indicator");
        recordingElement.innerHTML = `<div></div>`;
        myVideo.previousSibling.appendChild(recordingElement);
        // recording
        record(myVideoStream);
        recorder.start(1000);
    }
    // recording stop
    else {
        const completeBlob = new Blob(chunks, { type: chunks[0].type });
        var anchor = document.createElement("a");
        document.body.appendChild(anchor);
        anchor.style = "display: none";
        var url = window.URL.createObjectURL(completeBlob);
        anchor.href = url;
        anchor.download = `aaaa.mp4`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        recorder.stop();
        currentElement.setAttribute("tool_tip", "Start Recording");
        currentElement.classList.remove("tooltip-danger");
        currentElement.classList.remove("blink");
        indicator.remove();
        while (chunks.length) {
            chunks.pop();
        }
    }
});

const record = (stream) => {
    recorder = new MediaRecorder(stream, {
        mineType: "video/webm;codecs=H264",
    });
    recorder.onstop = (e) => {
        delete recorder;
    };
    recorder.ondataavailable = (e) => {
        chunks.push(e.data);
    };
};

if (detectMob()) shareScreenBtn.remove();
else camToggleBtn.remove();
class SE {
    constructor(mediaStream) {
        this.mediaStream = mediaStream;
    }
    createElement() {
        this.element = document.createElement("div");
        this.element.classList.add("effect-container");
        const a1 = document.createElement("div");
        a1.classList.add("o1");
        const a2 = document.createElement("div");
        a2.classList.add("o2");
        const a3 = document.createElement("div");
        a3.classList.add("o1");
        this.element.appendChild(a1);
        this.element.appendChild(a2);
        this.element.appendChild(a3);

        this.audioCTX = new AudioContext();
        this.analyser = this.audioCTX.createAnalyser();
        console.log(this.audioCTX);
        const source = this.audioCTX.createMediaStreamSource(this.mediaStream);
        source.connect(this.analyser);

        const frameLoop = () => {
            window.requestAnimationFrame(frameLoop);
            let fbc_array = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(fbc_array);
            let o1 = fbc_array[20] / 300;
            let o2 = fbc_array[50] / 200;
            o1 = o1 < 0.5 ? 0.19 : o1 > 1 ? 1 : o1;
            o2 = o2 < 0.4 ? 0.19 : o2 > 1 ? 1 : o2;
            a1.style.height = `${o1 * 100}%`;
            a3.style.height = `${o1 * 100}%`;
            a2.style.height = `${o2 * 100}%`;
        };
        frameLoop();
        return this.element;
    }
    replaceStream(stream) {
        this.mediaStream = stream;
        this.audioCTX.close().then((e) => {
            console.log("audiCTX close");
        });
        this.element = this.createElement();
    }
    deleteElement() {
        this.audioCTX.close().then((e) => {
            console.log("audiCTX close");
        });
        this.element.remove();
    }
}
// if (USER_TYPE !== "admin") recordingBtn.remove();
const scrollDown = (query) => {
    var objDiv = document.querySelector(query);
    objDiv.scrollTop = objDiv.scrollHeight;
};
const addMessage = (sender, userName, message) => {
    const messageBoxButton = document.getElementById("message-box");
    const chatPanel = document.getElementById("chat-panel");
    if (
        !chatPanel.classList.contains("display-chat-panel") &&
        !messageBoxButton.classList.contains("dot")
    )
        messageBoxButton.classList.add("dot");
    const time = new Date();
    const chatBox = document.querySelector(".chat-box");
    const chat = document.createElement("div");
    chat.classList.add("chat");
    chat.classList.add(sender);
    chat.innerHTML = `<p class="name">${userName} <span class="time"> ${time.toLocaleString(
        "en-US",
        { hour: "numeric", minute: "numeric", hour12: true }
    )} </span> </p><p class="message">${message}</p>`;
    chatBox.appendChild(chat);
};
const chatForm = document.querySelector(".chat-input-wrapper");
chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const chatInput = document.getElementById("chat-input");
    if (chatInput.value == "") return;
    socket.emit("client-send", chatInput.value);
    addMessage("me", name, chatInput.value);
    scrollDown(".chat-box");
    chatInput.value = "";
});

socket.on("client-podcast", (data, userName) => {
    console.log(userName + ": " + data);
    addMessage("user", userName, data);
    scrollDown(".chat-box");
});
