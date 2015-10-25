# iMon-Display-Driver-NodeJS

Serial LCDd (LCDProc) Driver for iMon LCD Displays on NodeJS

## Usage
include LCDDriver :

```Javascript
var LCDDriver = require('./lcddriver.js');
lcdDriver = new LCDDriver();
```

call init :

```Javascript
lcdDriver.init();
```

Listen for init and ready events :

```Javascript
lcdDriver.on('init', function() {});
lcdDriver.on('ready', function(){
  //Do setup things
});
```

use LCDDriver functions to manipulate the iMON LCD Display

## Useful functions

`lcdDriver.screen(name, options);`

Create a master screen (NOT vScreen) on the iMon

>  name : unique name for the screen
>  data : {
>    duration : amount of time to display screen if more than on screen exists (Default: 5000)
>    heartbeat : 'on'/'off' utilize LCDd's Heartbeat (Default : 'off')
>    backlight : 'on'/'off' Use backlight for screen (Default: 'on')
>    priority : Screens priority in LCDd (Default: 2)
>    widgetType : type of widget to use for Line1/Line2 (Default : 'scroller')
>  }
  
i.e.

```Javascript
lc.screen('Plex_Screen', {
  duration : 2000,
  heartbeat : 'off',
  backlight : 'on'
});
```


`lcdDriver.iMonSetScreen(options);`

 Set the screen to new display values (Line 1, Line 2, icons and progress)

>  Object options : {
>    screen : The vScreen in which to set the display
>    clear : TRUE: clear icons and progress prior to display (use alone for screen blanking)
>    line1 : Text to display on the top line
>    line2 : Text to display on the bottom line
>    icons : IconList holding all icons to turn on
>    progress : {top, topLine, bottom, bottomLine} percentage for each progress bar
    
i.e.

```Javascript
lcdDisplay.iMonSetScreen(
  {
      clear : false,
      screen : 'Plex_Screen',
      icons : [
          lc.iconSet.disc_in,
          lc.iconSet.disc
      ],
      progress : 'clear'
  }
);
```

`lcdDriver.clear();`

clear iMon icons and progress bars

##Icons
To access iMon Specific icons on the display create an array from lcdDisplay.iconSet
and pass it in iMonSetScreen options

Available Icons are :

  * disc
  * music
  * movie
  * photo
  * cd
  * tv_top
  * web
  * news
  * speaker_2
  * speaker_5
  * speaker_7
  * spdif
  * src
  * fit
  * tv
  * hdtv
  * src1
  * src2
  * right_mp3
  * right_ogg
  * right_wma
  * right_wav
  * middle_mpg
  * middle_ac3
  * middle_dts
  * middle_wma
  * left_mpg
  * left_divx
  * left_xvid
  * left_wmv
  * vol
  * time
  * alarm
  * record
  * repeat
  * shuffle
  * disc_in
