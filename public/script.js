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
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const name = prompt("Your name");
// const name = "Soumen Khara";
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  //  port: "3000",
});
var Peer_ID;
const myVideo = document.createElement("video");
console.log(myPeer);
myVideo.muted = true;
let myVideoStream;
const peers = {};
if (s) {
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
      myVideoStream = stream;
      stream.getVideoTracks()[0].onended = () => {
        location.replace(`/${ROOM_ID}`);
      };
      processStream(stream, 10000);
    });
} else {
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
          processStream(stream, 0);
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
          processStream(stream, 0);
        });
    });
}

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

function processStream(stream, timeOut) {
  stream.name = "soumen";
  addVideoStream(myVideo, stream, null, name);
  // recieve the others stream
  myPeer.on("call", (call) => {
    peers[call.peer] = call;
    call.answer(stream);
    console.log(call);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      fetch(`/user/${call.peer}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log(data);
          addVideoStream(video, userVideoStream, call.peer, data.name);
        });
    });
    call.on("close", () => {
      video.parentElement.remove();
    });
  });

  socket.on("user-connected", (userId) => {
    console.log("user-connected");
    connectToNewUser(userId, stream);
  });
}
myPeer.on("open", (id) => {
  Peer_ID = id;
});
function connectToNewUser(userId, stream) {
  // set others peerid and send my stream
  stream.name = "soumen";
  const call = myPeer.call(userId, stream);
  console.log(call);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    fetch(`/user/${call.peer}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
        addVideoStream(video, userVideoStream, call.peer, data.name);
      });
  });
  call.on("close", () => {
    video.parentElement.remove();
  });

  peers[userId] = call;
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
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  // pinch out button
  // const pinchOutBtn = document.createElement("button");
  // pinchOutBtn.classList.add("video-element-btn");
  // pinchOutBtn.classList.add("video-pinch-out-btn");
  // pinchOutBtn.innerHTML = `<i class="none-pointer fas fa-compress-arrows-alt fa-2x"></i>`;
  // videoWrapper.appendChild(pinchOutBtn);
  videoWrapper.appendChild(video);
  console.log(videoWrapper.childNodes);
  videoGrid.append(videoWrapper);
  eventAdd(video);
}

function shareScreen() {
  window.open(`/${ROOM_ID}?screen=true`);
}

function asd() {
  console.log(peers);
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
  console.log("Video CLick");
  console.log(videoWrapper.classList.contains("zoom-video"));
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
  console.log(e.target);
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
    console.log(Peer_ID);
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
  const text = `https://xyx.site/${ROOM_ID}`;
  navigator.clipboard.writeText(text);
  copyBtn.style.setProperty("--tooltip", '"copied"');
});
copyBtn.addEventListener("mouseout", (e) => {
  copyBtn.style.setProperty("--tooltip", '"copy"');
});
