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
if (detectMob()) {
  const cont = document.querySelector("#share-screen");
  cont.remove();
}
if (!detectMob()) {
  const a = document.querySelector("#cams");
  a.remove();
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
console.log(myPeer);
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
    console.log("Dont have microphone");
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
    console.log(peers);
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
    console.log("User Connected");
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
  console.log(peers);
}

function addVideoStream(video, stream, p, n) {
  const videoWrapper = document.createElement("div");
  videoWrapper.id = "video-wrapper";
  videoWrapper.classList.add("video-wrapper");
  const namePara = document.createElement("p");
  namePara.innerHTML = n;
  videoWrapper.appendChild(namePara);
  video.srcObject = stream;
  video.setAttribute("peer", p);
  video.setAttribute("name", n);
  if (p == null) {
    video.classList.add("mirror");
  }
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoWrapper.appendChild(video);
  videoGrid.append(videoWrapper);
  eventAdd(video);
}

function shareScreen() {
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
      // myVideoStream = stream;
      var videoTrack = stream.getVideoTracks()[0];
      myVideoTrack = myVideoStream.getVideoTracks()[0];
      console.log("Before: " + myVideoStream.MediaStream, myVideoTrack);
      replaceVideoTrack(myVideoStream, videoTrack);
      console.log("After: " + myVideoStream.MediaStream, myVideoTrack);
      for (peer in peers) {
        let sender = peers[peer].peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
      }
      const videoWrapper = document.getElementById("video-wrapper");
      const shareS = document.createElement("div");
      shareS.classList.add("share-screen");
      const stopBtn = document.createElement("button");
      stopBtn.classList.add("video-element-btn");
      stopBtn.classList.add("stop-btn");

      stopBtn.innerHTML = "Stop Sharing";
      shareS.appendChild(stopBtn);
      videoWrapper.appendChild(shareS);
      videoTrack.onended = () => {
        shareS.remove();
        for (peer in peers) {
          let sender = peers[peer].peerConnection
            .getSenders()
            .find(function (s) {
              return s.track.kind == videoTrack.kind;
            });
          sender.replaceTrack(myVideoTrack);
        }
        replaceVideoTrack(myVideoStream, myVideoTrack);
      };
      stopBtn.onclick = () => {
        videoTrack.stop();
        shareS.remove();
        for (peer in peers) {
          let sender = peers[peer].peerConnection
            .getSenders()
            .find(function (s) {
              return s.track.kind == videoTrack.kind;
            });
          sender.replaceTrack(myVideoTrack);
        }
        replaceVideoTrack(myVideoStream, myVideoTrack);
      };
    });
}

setInterval(() => {
  const videoContainers = document.querySelectorAll("#video-wrapper");
  videoContainers.forEach((videoContainer) => {
    if (videoContainer.childNodes.length < 2) {
      videoContainer.remove();
    }
  });
}, 1);

const eventAdd = (element) => {
  element.addEventListener("click", videoClickEvent);
};

const videoClickEvent = (e) => {
  const videoWrapper = e.target.parentElement;
  if (!videoWrapper.classList.contains("zoom-video")) {
    videoWrapper.classList.add("zoom-video");
    const minimizeBtn = document.createElement("button");
    minimizeBtn.classList.add("video-element-btn");
    minimizeBtn.classList.add("video-minimize-btn");
    minimizeBtn.innerHTML = `<i class="none-pointer fas fa-times fa-2x"></i>`;
    videoWrapper.appendChild(minimizeBtn);
    minimizeBtn.addEventListener("click", crossBtnClickEvent);
  }
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
function stop() {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  const btn = document.getElementById("video");
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    btn.innerHTML = `<i class="fas fa-video-slash">`;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    btn.innerHTML = `<i class="fas fa-video">`;
  }
}

function mute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  const btn = document.getElementById("mute");
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    btn.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    btn.innerHTML = `<i class="fas fa-microphone"></i>`;
  }
}
const shareBtn = document.querySelector(".share-btn");
shareBtn.addEventListener("click", (e) => {
  e.target.parentElement.classList.toggle("active");
});

function call() {
  const callBtn = document.getElementById("meeting-end");
  const flag = callBtn.getAttribute("data");
  if (flag == "false") {
    callBtn.classList.remove("connect");
    callBtn.setAttribute("data", "true");
    callBtn.setAttribute("tool_tip", "Leave the meeting");
    socket.emit("join-room", ROOM_ID, Peer_ID, name);
  }
  if (flag == "true") {
    location.replace(`/`);
  }
}
// copy text
const copyBtn = document.getElementById("copy");
copyBtn.addEventListener("mousedown", (e) => {
  const text = `https://digiclass.site/${ROOM_ID}`;
  navigator.clipboard.writeText(text);
  copyBtn.style.setProperty("--tooltip", '"copied"');
});
copyBtn.addEventListener("mouseout", (e) => {
  copyBtn.style.setProperty("--tooltip", '"copy"');
});

const changeCam = (e) => {
  myVideoStream.getTracks().forEach((track) => {
    track.stop();
  });
  var cams = e.getAttribute("camera");
  cams = JSON.parse(cams);
  console.log(cams);
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
