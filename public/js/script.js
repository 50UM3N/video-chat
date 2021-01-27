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
  port: "8080",
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
  addVideoStream(myVideo, myVideoStream, null, {
    name: name,
    audio: myVideoStream.getAudioTracks()[0].enabled,
    video: myVideoStream.getVideoTracks()[0].enabled,
  });
  // recieve the others stream
  myPeer.on("call", (call) => {
    peers[call.peer] = call;
    call.answer(myVideoStream);
    // console.log(peers);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      fetch(`/user?peer=${call.peer}&room=${ROOM_ID}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log(data);
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
  });

  socket.on("user-connected", (userId, fname, audio, video) => {
    // console.log("User Connected");
    socket.emit("user-callback");
    console.log(userId, fname, audio, video);
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
    fetch(`/user?peer=${call.peer}&room=${ROOM_ID}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
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
  // console.log(peers);
}

function addVideoStream(video, stream, peerId, user, adminId) {
  const micBtn = document.createElement("button");
  micBtn.classList.add("video-element");
  micBtn.classList.add("mic-button");
  if (user.audio) micBtn.innerHTML = `<ion-icon name="mic-outline"></ion-icon>`;
  else micBtn.innerHTML = `<ion-icon name="mic-off-outline"></ion-icon>`;

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
  namePara.innerHTML = user.name;
  namePara.classList.add("video-element");
  namePara.classList.add("name");

  const elementsWrapper = document.createElement("div");
  elementsWrapper.classList.add("elements-wrapper");
  elementsWrapper.appendChild(namePara);
  elementsWrapper.appendChild(optionBtn);
  elementsWrapper.appendChild(pinBtn);
  elementsWrapper.appendChild(micBtn);

  video.srcObject = stream;
  video.setAttribute("peer", peerId);
  video.setAttribute("name", user.name);

  if (peerId == null) {
    video.classList.add("mirror");
  }

  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  videoWrapper.appendChild(elementsWrapper);
  videoWrapper.appendChild(video);

  if (adminId == peerId)
    videoGrid.insertBefore(videoWrapper, videoGrid.childNodes[0]);
  else videoGrid.append(videoWrapper);

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
    socket.emit("audio-mute", false);
    videoWrapperMicToggle(myVideo, false);
    myVideoStream.getAudioTracks()[0].enabled = false;
    currentElement.innerHTML = `<ion-icon name="mic-off-outline"></ion-icon>`;
    currentElement.setAttribute("tool_tip", "Microphone On");
  } else {
    socket.emit("audio-mute", true);
    videoWrapperMicToggle(myVideo, true);
    myVideoStream.getAudioTracks()[0].enabled = true;
    currentElement.innerHTML = `<ion-icon name="mic-outline"></ion-icon>`;
    currentElement.setAttribute("tool_tip", "Microphone Off");
  }
});

socket.on("user-audio-mute", (id, type) => {
  videoWrapperMicToggle(document.querySelector(`video[peer="${id}"]`), type);
});

const videoWrapperMicToggle = (element, type) => {
  const videoWrapper = element.previousSibling;
  const micButton = videoWrapper.lastChild;
  if (type) micButton.innerHTML = `<ion-icon name="mic-outline"></ion-icon>`;
  else micButton.innerHTML = `<ion-icon name="mic-off-outline"></ion-icon>`;
};

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
    socket.emit(
      "join-room",
      ROOM_ID,
      Peer_ID,
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
    console.log("stop");
  };
  recorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };
};

if (detectMob()) shareScreenBtn.remove();
else camToggleBtn.remove();
// if (USER_TYPE !== "admin") recordingBtn.remove();
