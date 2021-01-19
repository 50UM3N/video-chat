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
// if (detectMob()) {
//   const cont = document.querySelector("#share-screen");
//   cont.remove();
// }
// if (!detectMob()) {
//   const a = document.querySelector("#cams");
//   a.remove();
// }
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
// const name = prompt("Your name");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  // port: "8080",
});
var Peer_ID;
const myVideo = document.createElement("video");
// console.log(myPeer);
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

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
});

function processStream(stream) {
  addVideoStream(myVideo, myVideoStream, null, name);
  // recieve the others stream
  myPeer.on("call", (call) => {
    peers[call.peer] = call;
    call.answer(myVideoStream);
    // console.log(peers);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      fetch(`/user/${call.peer}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          addVideoStream(video, userVideoStream, call.peer, data.name);
        });
    });
    call.on("close", () => {
      video.parentElement.remove();
    });
  });

  socket.on("user-connected", (userId) => {
    // console.log("User Connected");
    connectToNewUser(userId, myVideoStream);
  });
}
myPeer.on("open", (id) => {
  Peer_ID = id;
});
function connectToNewUser(userId, stream) {
  // set others peerid and send my stream
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    fetch(`/user/${call.peer}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        addVideoStream(video, userVideoStream, call.peer, data.name);
      });
  });
  call.on("close", () => {
    video.parentElement.remove();
  });
  peers[userId] = call;
  // console.log(peers);
}

function addVideoStream(video, stream, peerId, peerName) {
  const micBtn = document.createElement("button");
  micBtn.classList.add("video-element");
  micBtn.classList.add("mic-button");
  micBtn.innerHTML = `<ion-icon name="mic-outline"></ion-icon>`;
  const pinBtn = document.createElement("button");
  pinBtn.classList.add("video-element");
  pinBtn.classList.add("pin-button");
  pinBtn.innerHTML = `<ion-icon name="expand-outline"></ion-icon>`;
  const optionBtn = document.createElement("button");
  optionBtn.classList.add("video-element");
  optionBtn.classList.add("options-button");
  optionBtn.innerHTML = `<ion-icon name="ellipsis-horizontal-outline"></ion-icon>`;
  const videoWrapper = document.createElement("div");
  videoWrapper.id = "video-wrapper";
  videoWrapper.classList.add("video-wrapper");
  const namePara = document.createElement("p");
  const elementsWrapper = document.createElement("div");
  elementsWrapper.classList.add("elements-wrapper");
  elementsWrapper.appendChild(namePara);
  elementsWrapper.appendChild(optionBtn);
  elementsWrapper.appendChild(pinBtn);
  elementsWrapper.appendChild(micBtn);
  namePara.innerHTML = peerName;
  namePara.classList.add("video-element");
  namePara.classList.add("name");
  video.srcObject = stream;
  video.setAttribute("peer", peerId);
  video.setAttribute("name", peerName);
  if (peerId == null) {
    video.classList.add("mirror");
  }
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoWrapper.appendChild(elementsWrapper);
  videoWrapper.appendChild(video);
  videoGrid.append(videoWrapper);
  const observer = new MutationObserver((mutationsList, observer) => {
    console.log({ mutationsList, observer });
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
        let sender = peers[peer].peerConnection.getSenders().find(function (s) {
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
    currentElement.innerHTML = `<ion-icon name="videocam-off-outline"></ion-icon>`;
    currentElement.setAttribute("tool_tip", "Video On");
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    currentElement.innerHTML = `<ion-icon name="videocam-outline"></ion-icon>`;
    currentElement.setAttribute("tool_tip", "Video Off");
  }
});

const micToggleButton = document.getElementById("mic-toggle");
micToggleButton.addEventListener("click", (e) => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  const currentElement = e.target;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    currentElement.innerHTML = `<ion-icon name="mic-off-outline"></ion-icon>`;
    currentElement.setAttribute("tool_tip", "Microphone On");
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    currentElement.innerHTML = `<ion-icon name="mic-outline"></ion-icon>`;
    currentElement.setAttribute("tool_tip", "Microphone Off");
  }
});

// const shareBtn = document.querySelector(".share-btn");
// shareBtn.addEventListener("click", (e) => {
//   e.target.parentElement.classList.toggle("active");
// });

const meetingToggleBtn = document.getElementById("meeting-toggle");
meetingToggleBtn.addEventListener("click", (e) => {
  const currentElement = e.target;
  if (currentElement.classList.contains("call-button")) {
    currentElement.classList.remove("call-button");
    currentElement.classList.add("call-end-button");
    currentElement.classList.add("tooltip-danger");
    currentElement.setAttribute("tool_tip", "Leave the Meeting");
    socket.emit("join-room", ROOM_ID, Peer_ID, name);
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

const changeCam = (e) => {
  myVideoStream.getTracks().forEach((track) => {
    track.stop();
  });
  var cams = e.getAttribute("camera");
  cams = JSON.parse(cams);
  // console.log(cams);
  var camId;
  for (cam in cams) {
    if (cams[cam] == false) {
      camId = cam;
      cams[cam] = true;
    } else {
      cams[cam] = false;
    }
  }
  e.setAttribute("camera", JSON.stringify(cams));
  navigator.mediaDevices
    .getUserMedia({
      video: { deviceId: { exact: camId } },
      audio: true,
    })
    .then((stream) => {
      myVideoStream = stream;
      let videoTrack = stream.getVideoTracks()[0];
      let audioTrack = stream.getAudioTracks()[0];
      myVideo.srcObject = stream;
      for (peer in peers) {
        let sender = peers[peer].peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
        sender = peers[peer].peerConnection.getSenders().find(function (s) {
          return s.track.kind == audioTrack.kind;
        });
        sender.replaceTrack(audioTrack);
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

const replaceVideoTrack = (stream, videoTrack) => {
  stream.removeTrack(stream.getVideoTracks()[0]);
  stream.addTrack(videoTrack);
};
