// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

var globalid = 0;
var videoOn = 0;

(function() {

  var cur_video_blob = null;
  var fb_instance;

  $(document).ready(function(){
    connect_to_chat_firebase();
    connect_webcam();
  });

  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://247chat2.firebaseio.com");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
    display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
    var fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
    var fb_instance_users = fb_new_chat_room.child('users');
    var fb_instance_stream = fb_new_chat_room.child('stream');
    var my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val());
    });

    // block until username is answered
    var username = window.prompt("Welcome, warrior! please declare your name?");
    if(!username){
      username = "anonymous"+Math.floor(Math.random()*1111);
    }
    fb_instance_users.push({ name: username,c: my_color});
    $("#waiting").remove();

    // bind submission box
    $("#submission input").keydown(function( event ) {
      if (event.which == 13) {
        if(has_emotions($(this).val())){

          if ($("#snapradio").is(":checked") && videoOn == 1) {
            fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color, snap: true});
          } else {
            fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color, snap: false});
          }

        }else{
          fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color, snap: false});
        }
        $(this).val("");
      }
    });
  }

  // creates a message node and appends it to the conversation
  function display_msg(data){
    console.log("in display_msg, data.m is: " + data.m);

    $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"<div class='hidden'>"+globalid+"</div>"+"</div>");

    if(data.v){
      // for video element
      var video = document.createElement("video");
      video.autoplay = true;
      video.controls = false; // optional
      video.loop = true;
      video.width = 120;

      var source = document.createElement("source");
      source.src =  URL.createObjectURL(base64_to_blob(data.v));
      source.type =  "video/webm";

      video.appendChild(source);

      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      // var video = document.createElement("img");
      // video.src = URL.createObjectURL(base64_to_blob(data.v));

      document.getElementById("conversation").appendChild(video);
    }
    // Scroll to the bottom every time we display a new message
    scroll_to_bottom(0);

    // if a message has emotions AND if it's a snap, then delete the snap...
    if (data.m.split(": ")[1] == "~(_8^(I)") {
      console.log("homer sign detected");
      addHomerClip();
    }

    else if (data.m.split(": ")[1] == "=:o]") {
      console.log("bill clinton sign detected");
      addBillClintonClip();
    }

    else if (data.m.split(": ")[1] == "*<|:-)") {
      console.log("santa claus sign detected");
      addSantaClausClip();
    }

    else if (data.m.split(": ")[1] == "//0-0\\\\") {
      console.log("john lennon sign detected");
      addJohnLennonClip();
    }

    else if (has_emotions(data.m)) {
      if (data.snap == true) {
        deleteMessage(data.m, globalid);
      } 
    }

    globalid++;
  }

  // easter egg #1, add a homer clip
  function addHomerClip() {
    $("#conversation").append("<iframe title='YouTube video player' class='youtube-player' type='text/html' width='640' height='390' src='https://www.youtube.com/embed/i1agR234bq4' frameborder='0' allowFullScreen></iframe>");
  }
  // easter egg #2, add a bill clinton clip
  function addBillClintonClip() {
    $("#conversation").append("<iframe title='YouTube video player' class='youtube-player' type='text/html' width='640' height='390' src='https://www.youtube.com/embed/KiIP_KDQmXs' frameborder='0' allowFullScreen></iframe>"); 
  }
  // easter egg #3, add a santa claus clip
  function addSantaClausClip() {
    $("#conversation").append("<iframe title='YouTube video player' class='youtube-player' type='text/html' width='640' height='390' src='https://www.youtube.com/embed/HWv72L4wgCc' frameborder='0' allowFullScreen></iframe>"); 
  }
  function addJohnLennonClip() {
    $("#conversation").append("<iframe title='YouTube video player' class='youtube-player' type='text/html' width='640' height='390' src='https://www.youtube.com/embed/DVg2EJvvlF8' frameborder='0' allowFullScreen></iframe>"); 
  }


  // for a "snap" message, we need to delete a message after 3 seconds, so here's the function for that
  function deleteMessage(message, id) {

    var convo = $("#conversation");
    console.log("convo: " + convo);
    var convoChildren = convo.children();

    for (var i=0; i<convoChildren.size(); i++) {
      var childElem = convoChildren[i];
      var childidElem = $(childElem).children()[0];
      var childid = $(childidElem).text();

      if (childid == id) {
        setTimeout(function() 
        {
          childElem.remove();
        }, 
        3000);
      }
    }

  }

  function scroll_to_bottom(wait_time){
    // scroll to bottom of div
    setTimeout(function(){
      $("html, body").animate({ scrollTop: $(document).height() }, 200);
    },wait_time);
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: false
    };

    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      // create video element, attach webcam stream to video element
      var video_width= 160;
      var video_height= 120;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)
      });
      video.play();
      webcam_stream.appendChild(video);

      // counter
      var time = 0;
      var second_counter = document.getElementById('second_counter');
      var second_counter_update = setInterval(function(){
        second_counter.innerHTML = time++;
      },1000);

      // now record stream in 5 seconds interval
      var video_container = document.getElementById('video_container');
      var mediaRecorder = new MediaStreamRecorder(stream);
      var index = 1;

      mediaRecorder.mimeType = 'video/webm';
      // mediaRecorder.mimeType = 'image/gif';
      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
      mediaRecorder.video_width = video_width/2;
      mediaRecorder.video_height = video_height/2;

      mediaRecorder.ondataavailable = function (blob) {
          //console.log("new data available!");
          video_container.innerHTML = "";

          // convert data into base 64 blocks
          blob_to_base64(blob,function(b64_data){
            cur_video_blob = b64_data;
          });
      };
      setInterval( function() {
        mediaRecorder.stop();
        mediaRecorder.start(3000);
      }, 3000 );
      console.log("connect to media stream!");
      videoOn = 1;
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
    // var options = ["lol",":)",":(", "haha", ":D", "D:", "-_-", ":/", ":-)", ":-(", ":-D", "8D", "0:)"];
    var options = [":-)", ":)", ":o)", ":]", ":3", ":c)", ":>", "=]", "8)", "=)", ":}", ":^)", ":っ)", ":-D", ":D", "8-D", "8D", "x-D", "xD", "X-D", "XD", "=-D", "=D", "=-3", "=3", "B^D", ":-))", ">:[", ":-(", ":(", ":-c", ":c", ":-<", ":っC", ":<", ":-[", ":[", ":{", ";(", ":-||", ":@", ">:(", ":'-(", ":'(", ":'-)", ":')", "D:<", "D:", "D8", "D;", "D=", "DX", "v.v", "D-':", ">:O", ":-O", ":O", ":-o", ":o", "8-0", "O_O", "o-o", "O_o", "o_O", "o_o", "O-O", ":*", ":^*", "(", "'}{'", ")", ";-)", ";)", "*-)", "*)", ";-]", ";]", ";D", ";^)", ":-,", ">:P", ":-P", ":P", "X-P", "x-p", "xp", "XP", ":-p", ":p", "=p", ":-Þ", ":Þ", ":þ", ":-þ", ":-b", ":b", "d:", ">:\\", ">:\\/", ":-\\/", ":-.", ":\\/", ":\\", "=\\/", "=\\", ":L", "=L", ":S", ">.<", ":|", ":-|", ":$", ":-X", ":X", ":-#", ":#", "O:-)", "0:-3", "0:3", "0:-)", "0:)", "0;^)", ">:)", ">;)", ">:-)", "}:-)", "}:)", "3:-)", "3:)", "o\\/\\o", "^5", ">_>^", "^<_<", "|;-)", "|-O", ":-&", ":&", "#-)", "%-)", "%)", ":-###..", ":###..", "<:-|", "<*)))-{", "><(((*>", "><>", "\\o\\/", "*\\0\\/*", "@}-;-'---", "@>-->--", "<3", "<\\/3", "haha", "lol", "hehe", "hoho", "lawl", "lolz", "rofl", "lmao", "lawlz", "lmfao"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }


  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

})();
