window.addEventListener('load', () => {
  // Chat Plateform
  const chatTemplate = Handlebars.compile($('#chat-template').html());
  const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
  const chatEl = $('#chat');
  const formEl = $('.form');
  const messages = [];
  let username;

  // for Group Creator Video
  const localImageEl = $('#local-image');
  const localVideoEl = $('#local-video');

  // Joined Friends Videos
  const remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
  const remoteVideosEl = $('#remote-videos');
  let remoteVideosCount = 0;

  // Hiding cameras until they are initialized
  localVideoEl.hide();

  // initial rules for form verification
  formEl.form({
    fields: {
      roomName: 'empty',
      username: 'empty',
    },
  });

  // create the webrtc connection
  const webrtc = new SimpleWebRTC({
    // the id dom element that will hold "our" video
    localVideoEl: 'local-video',
    // the id dom element that will hold remote videos
    remoteVideosEl: 'remote-videos',
    // for gaining video and voice access
    autoRequestMedia: true,
    debug: false,
    detectSpeakingEvents: true,
    autoAdjustMic: false,
  });

  // if (localCameraacess==1)
  webrtc.on('localStream', () => {
    localImageEl.hide();
    localVideoEl.show();
  });

  // adding remote videos
  webrtc.on('videoAdded', (video, peer) => {
    // eslint-disable-next-line no-console
    const id = webrtc.getDomId(peer);
    const html = remoteVideoTemplate({ id });
    if (remoteVideosCount === 0) {
      remoteVideosEl.html(html);
    } else {
      remoteVideosEl.append(html);
    }
    $(`#${id}`).html(video);
    $(`#${id} video`).addClass('ui image medium'); // for video image to be responsive not good through
    remoteVideosCount += 1;
  });

  // updation of chat messages
  const updateChatMessages = () => {
    const html = chatContentTemplate({ messages });
    const chatContentEl = $('#chat-content');
    chatContentEl.html(html);
    // auto-scrolling most necessary thing
    const scrollHeight = chatContentEl.prop('scrollHeight');
    chatContentEl.animate({ scrollTop: scrollHeight }, 'slow');
  };

  // Posting a message
  const postMessage = (message) => {
    const chatMessage = {
      username,
      message,
      postedOn: new Date().toLocaleString('en-GB'),
    };
    // Sending to all the peers
    webrtc.sendToAll('chat', chatMessage);
    // Update messages locally
    messages.push(chatMessage);
    $('#post-message').val('');
    updateChatMessages();
  };

  // Chat interface
  const showChatRoom = (room) => {
    formEl.hide();
    const html = chatTemplate({ room });
    chatEl.html(html);
    const postForm = $('form');
    postForm.form({
      message: 'empty',
    });
    $('#post-btn').on('click', () => {
      const message = $('#post-message').val();
      postMessage(message);
    });
    $('#post-message').on('keyup', (event) => {
      if (event.keyCode === 13) {
        const message = $('#post-message').val();
        postMessage(message);
      }
    });
  };

  // registeration of new chat room
  const createRoom = (roomName) => {

    console.info(`Creating new room: ${roomName}`);
    webrtc.createRoom(roomName, (err, name) => {
      formEl.form('clear');
      showChatRoom(name);
      postMessage(`${username} created chatroom`);
    });
  };

  // Join existing Chat Room
  const joinRoom = (roomName) => {
    // eslint-disable-next-line no-console
    console.log(`Joining Room: ${roomName}`);
    webrtc.joinRoom(roomName);
    showChatRoom(roomName);
    postMessage(`${username} joined chatroom`);
  };

  // message receive from differnt users
  webrtc.connection.on('message', (data) => {
    if (data.type === 'chat') {
      const message = data.payload;
      messages.push(message);
      updateChatMessages();
    }
  });

  // Room Submit Button Handler
  $('.submit').on('click', (event) => {
    if (!formEl.form('is valid')) {
      return false;
    }
    username = $('#username').val();
    const roomName = $('#roomName').val().toLowerCase();
    if (event.target.id === 'create-btn') {
      createRoom(roomName);
    } else {
      joinRoom(roomName);
    }
    return false;
  });
});
