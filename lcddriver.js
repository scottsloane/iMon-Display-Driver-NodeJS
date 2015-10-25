/*
 // iMon Display Driver (LCDDriver) V0.1.5
 // Serial LCDd (LCDProc) Driver for iMon LCD screen
 //
 // Main Contributor : Scott Sloane (scott@scottsloane.com)
 //
 // Based on lcdproc-client by Tommie Jones (atlantageek @ github)
 // https://github.com/atlantageek/-lcdproc-client-node
 //
 */

/*
  Require necessary modules
 */
var net = require('net');
var EventEmitter = require('events').EventEmitter;
//var sys = require('sys');
var util = require('util');
var BitArray = require('bit-array');

/*
var commands = [];
var writing = false;

var activeIcons = new BitArray(31);
var activeProgress = new BitArray(31);
var progressPercent = [0, 0, 0, 0];

var host = '127.0.0.1';
var port = 13666;
*/


/*
Create LCDDriver Object and inherit EventEmitter
 */
function LCDDriver () {
  EventEmitter.call(this);
}
util.inherits(LCDDriver, EventEmitter);

/*
 Hold the bit index for each built in icon
 use array if icon is part of bit set
 */
LCDDriver.prototype.iconSet = {
  disc: 0,
  music: 1,
  movie: 2,
  photo: [1, 2],
  cd: 3,
  tv_top: [1, 3],
  web: [2, 3],
  news: [1, 2, 3],
  speaker_2: 4,
  speaker_5: 5,
  speaker_7: [4, 5],
  spdif: 6,
  src: 7,
  fit: 8,
  tv: 9,
  hdtv: 10,
  src1: 11,
  src2: 12,
  right_mp3: 13,
  right_ogg: 14,
  right_wma: [13, 14],
  right_wav: 15,
  middle_mpg: 16,
  middle_ac3: 17,
  middle_dts: [16, 17],
  middle_wma: 18,
  left_mpg: 19,
  left_divx: 20,
  left_xvid: [19, 20],
  left_wmv: 21,
  vol: 22,
  time: 23,
  alarm: 24,
  record: 25,
  repeat: 26,
  shuffle: 27,
  disc_in: 29
};
/*
Create object to hold necessary module variables
 */
LCDDriver.prototype.data = {
  commands : [],
  writing : false,
  activeIcons : new BitArray(31),
  activeProgress : new BitArray(31),
  progressPercent :[0,0,0,0],
  host : '127.0.0.1',
  port : 13666
}

/*
  LCDDriver.setIcons(Array iconList);
  Sets the iMON icons on display

  Array iconsSet iconList : Array containing all icons to turn on
 */
LCDDriver.prototype.setIcons = function(iconList){
  var self =this;
  self.data.activeIcons.reset();
  for (var i = 0; i < iconList.length; i++) {
    if (typeof iconList[i] === 'number') {
      self.data.activeIcons.set(iconList[i], true);
    } else {
      for (var j = 0; j < iconList[i].length; j++) {
        self.data.activeIcons.set(iconList[i][j], true);
      }
    }
  }
  self.addCommand("output", '0x' + self.data.activeIcons.toHexString());
};

/*
  LCDDriver.iMonSetScreen(Object options);
  Set the screen to new display values (Line 1, Line 2, icons and progress)

  Object options : {
    screen : The vScreen in which to set the display
    clear : TRUE: clear icons and progress prior to display (use alone for screen blanking)
    line1 : Text to display on the top line
    line2 : Text to display on the bottom line
    icons : IconList holding all icons to turn on
    progress : {top, topLine, bottom, bottomLine} percentage for each progress bar
 */
LCDDriver.prototype.iMonSetScreen = function(options){
  var self = this;
  options.screen = options.screen || 'Default_Screen';

  if (typeof options.clear !== 'undefined' && typeof options.clear === true) {
    self.clear();
  }

  if (typeof options.line1 !== 'undefined') {
    //set line one
    self.addCommand("widget_set", options.screen + " " + 'line_1' + " " + options.line1.x + " " + options.line1.y + " 16 " + options.line2.y + "  h 8" + " {" + options.line1.value + "}");
  }
  if (typeof options.line2 !== 'undefined') {
    //set line 2
    self.addCommand("widget_set", options.screen + " " + 'line_2' + " " + options.line2.x + " " + options.line2.y + " 16 " + options.line2.y + "  h 8" + " {" + options.line2.value + "}");
  }

  if (typeof options.icons !== 'undefined') {
    //set icons
    if (options.icons === 'clear') {
      self.setIcons([]);
    } else {
      self.setIcons(options.icons);
    }
  }

  if (typeof options.progress !== 'undefined') {
    //set progress
    //TODO: add persistant feature to allow for single bar update

    var self = this;

    if (options.progress === 'clear') {
      self.data.activeProgress.reset();
      self.data.activeProgress.set(28, true);
      setTimeout(function () {
        self.setProgress({clear: true})
      }, 250);
    } else {
      setTimeout(function () {
        self.setProgress(options.progress);
      }, 250);
    }
  }
};

/*
 LCDDriver.setProgress(Object options);
 Set the display for the 4 progress bars on the iMon

 Object options : {
 clear : TRUE: clear icons and progress prior to display (use alone for screen blanking)
 top : percentage progress for main top bar
 topLine : percentage progress for line top bar
 bottom : percentage progress for main bottom bar
 bottomLine : percentage progress for line bottom bar
 */
LCDDriver.prototype.setProgress = function (options){
  var self = this;
  if (typeof options.clear !== 'undefined' && options.clear === true) {
    options.top = 0;
    options.topLine = 0;
    options.bottom = 0;
    options.bottomLine = 0;
  }

  options.top = options.top || self.data.progressPercent[0];
  options.topLine = options.topLine || self.data.progressPercent[1];
  options.bottom = options.bottom || self.data.progressPercent[2];
  options.bottomLine = options.bottomLine || self.data.progressPercent[3];

  self.data.activeProgress.reset();
  self.data.activeProgress.set(28, true);

  var bottomVal = ((Math.ceil(options.bottom / 100 * 31))).toString(2).split('').reverse().join('');
  var bottomLineVal = ((Math.ceil(options.bottomLine / 100 * 31))).toString(2).split('').reverse().join('');
  var topVal = ((Math.ceil(options.top / 100 * 31))).toString(2).split('').reverse().join('');
  var topLineVal = ((Math.ceil(options.topLine / 100 * 31))).toString(2).split('').reverse().join('');

  for (var x = 0; x < 6; x++) {
    var out = false;
    if (topVal[x] === '1') out = true;
    self.data.activeProgress.set(x, out);
  }
  for (var x = 0; x < 6; x++) {
    var out = false;
    if (topLineVal[x] === '1') out = true;
    self.data.activeProgress.set(x + 6, out);
  }
  for (var x = 0; x < 6; x++) {
    var out = false;
    if (bottomLineVal[x] === '1') out = true;
    self.data.activeProgress.set(x + 12, out);
  }
  for (var x = 0; x < 6; x++) {
    var out = false;
    if (bottomVal[x] === '1') out = true;
    self.data.activeProgress.set(x + 18, out);
  }
  var self = this;
  self.addCommand("output", '0x' + self.data.activeProgress.toHexString());
};

/*
  LCDDriver.clear();
  clear iMon icons and progress bars
 */
LCDDriver.prototype.clear = function () {
  var self = this;

  self.data.activeIcons.reset();
  self.data.activeProgress.reset();
  self.data.activeProgress.set(28, true);
  self.addCommand("output", '0x' + self.data.activeProgress.toHexString());
  self.addCommand("output", '0x' + self.data.activeIcons.toHexString());
};

/*
  LCDDriver.addCommand (cmd, arg);
  Add a Serial command to the command stack

  cmd : Command to run
  arg : arguments to assess to command
 */
LCDDriver.prototype.addCommand = function (cmd, arg){
  var self = this;
  self.data.commands.push({cmd: cmd + " " + arg + "\n"});
  if (self.data.commands.length === 1) self.processCommand();
};

/*
  LCDDriver.processCommand();
  Processes the Command Stack (Self Cycling)
 */
LCDDriver.prototype.processCommand = function () {
  var self = this;
  if (self.data.commands.length > 0) {
    var command = self.data.commands.shift();
    self.data.writing = true;
    // console.log(command.cmd);
    self.socket.write(command.cmd, function () {
      self.data.writing = false;
      setTimeout(function() { self.processCommand(); }, 50);
    });
  }
};

/*
  LCDDriver.sendCommand (socket, cmd, arg);
  Send Serial Command to Socket (BASE CORE FUNCTION)

  socket : socket to send command
  cmd : command to issue
  arg : arguments to assess to command
 */
LCDDriver.prototype.sendCommand = function (socket, cmd, arg){
  socket.write(cmd + " " + arg + "\n", function () {

  });
};

/*
  LCDDriver.screen (name, data);
  Create a master screen (NOT vScreen) on the iMon

  name : unique name for the screen
  data : {
    duration : amount of time to display screen if more than on screen exists (Default: 5000)
    heartbeat : 'on'/'off' utilize LCDd's Heartbeat (Default : 'off')
    backlight : 'on'/'off' Use backlight for screen (Default: 'on')
    priority : Screens priority in LCDd (Default: 2)
    widgetType : type of widget to use for Line1/Line2 (Default : 'scroller')
  }
 */
LCDDriver.prototype.screen = function (name, data){
  var self = this;
  self.screen_name = name;

  data.duration = data.duration || 5000;
  data.heartbeat = data.heartbeat || 'off';
  data.backlight = data.backlight || 'on';
  data.priority = data.priority || 2;
  data.widgetType = data.widgetType || 'scroller';

  self.addCommand("screen_add", this.screen_name);
  self.addCommand("screen_set", this.screen_name + " name {" + this.screen_name + "}");
  self.addCommand("screen_set", this.screen_name + " heartbeat "+data.heartbeat);
  self.addCommand("screen_set", this.screen_name + " duration " + data.duration);
  self.addCommand("screen_set", this.screen_name + " priority "+data.priority);
  self.addCommand("screen_set", this.screen_name + " backlight"+data.backlight);

  //setup standard widgets
  this.widget(this.screen_name, 'line_1', data.widgetType);
  this.widget(this.screen_name, 'line_2', data.widgetType);
};

/*
  LCDDriver.widget(screen_name, name);
  Setup a LCDd widget on given master screen (NOT vScreen) (BASE CORE FUNCTION)

  screen_name : the name of the screen to add widget
  name : unique name for widget
  widgetType : type of widget
 */
LCDDriver.prototype.widget = function (screen_name, name, widgetType) {
  self = this;
  self.addCommand("widget_add", screen_name + " " + name + ' ' + widgetType);
};

/*
  LCDDriver.widget_val(screen_name, name, x, y, value);
  Set the active value of a given widget on a given master screen (NOT vScreen) (BASE CORE FUNCTION)

  screen_name : the name of the screen the widget is on
  name : the name of the widget to update
  x : x corrs for placement of widget
  y : y corrs for placement of widget
  value : text to display on widget
 */
LCDDriver.prototype.widget_val = function (screen_name, name, x, y, value){
  var self = this;
  console.log("here");
  self.addCommand("widget_set", screen_name + " " + name + " " + x + " " + y + " 16 " + y + "  h 8" + " {" + value + "}");
};

/*
  LCDDriver.init()
  Initializes the iMON Display Driver Module
 */
LCDDriver.prototype.init = function (){
  var self = this;
  //setInterval(processCommand, 15);
  this.socket = new net.Socket();
  console.log(self.data.host + ' : ' + self.data.port)
  this.socket.connect(self.data.port, self.data.host, function () {
    self.addCommand("hello", "");
    self.emit('init');
  });

  this.socket.on('data', function (d) {
    data_str = d.toString();
    params = data_str.split(' ');
    if (params[0] == 'connect') {
      for (i = 1; i < params.length; i++) {
        if (params[i - 1] == 'wid')
          self.width = params[i];
        if (params[i - 1] == 'hgt')
          self.height = params[i];
      }
      self.addCommand("client_set_name", "{NODEJS}");
      self.emit('ready');
    }
  });
};

module.exports = LCDDriver;
