var log = console.log, platform;
var CURSOR_JOB_INTERVAL = 200;

if(/^win/.test(process.platform)){
  platform = 'win';
  CURSOR_JOB_INTERVAL = 100;
}
else if(/^darwin/.test(process.platform)){
  platform = 'darwin';
  CURSOR_JOB_INTERVAL = 200;
}
else if(/^linux/.test(process.platform)){
  platform = 'linux';
  CURSOR_JOB_INTERVAL = 200;
}
else{
  log('platform not supported');
  return;
}
var robot = require('robotjs');
var clip = require("copy-paste");

var down = false;
var screenBounds = {
  width: 0,
  height: 0
}

function sendEvent(json){
  try{
    if(json.constructor === Array){
      var arr = json;
      if(arr.length == 6){
        // sequence key, down, alt, ctrl, shift, meta
        robot.sendKey(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
      }
      else if(arr.length == 3){
        if(arr[0] == 0){
          robot.sendClick('left', false, false);
          down = false
        }
        else if(arr[0] == 1){
          robot.sendClick('left', true, false);
          down = true;
        }
        else if(arr[0] == 3)
          robot.sendClick('right', false, false);
        else if(arr[0] == 4)
          robot.sendClick('right', true, false);
        else{
          if(down)
            robot.dragMouse(arr[1] * screenBounds.width, arr[2] * screenBounds.height, arr[0] == 4 ? 'right' : 'left');
          else
            robot.moveMouse(arr[1] * screenBounds.width, arr[2] * screenBounds.height);
        }
      }
      else if(arr.length == 2)
        robot.scroll(arr[1], arr[0]);
      else if(arr.length == 1)
        robot.sendClick('left', true, true);
    }
    else if(json.action == 'set_clip')
      clip.copy(json.value);
    else if(json.action == 'get_clip')
      clip.paste(function(e, text){
        postEvent('clipText', text);
      });
  }
  catch (e){console.log('invalid input',e, json);}
}

var eventListener, cursorJob, force = 0;
function setEventListener(cb){
  quit();
  eventListener = cb;
  notifyPlatform();
  force = 1;
  cursorJob = setInterval(function(){
    updateCursor();
  },CURSOR_JOB_INTERVAL);
}

function updateCursor(){
  var cursor = robot.getCursor(force);
  if(cursor && cursor.size > 0)
    postEvent('cursorState', cursor);
  force = 0;
}

function notifyPlatform(){
  screenBounds = robot.getScreenSize();
  postEvent('notifyPlatform', {
    dims:screenBounds,
    platform: platform
  });
}

function postEvent(type, data){
  if(eventListener)
    eventListener({type: type, data: data});
}

function quit(){
  eventListener = null;
  clearInterval(cursorJob);
}

module.exports = {
  sendEvent: sendEvent,
  setEventsListener: setEventListener,
  robot: robot,
  quit: quit
}
