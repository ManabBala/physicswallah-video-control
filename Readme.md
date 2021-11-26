# Physics Wallah Video Controller(Chrome Extension)

## <ins>How to use:</ins>

- Click on <span style="background-color:#238636; ">Code 🢓</span>
- Click on "Download as ZIP" to download this repo
- Extract the ZIP file
  <br>
  <br>
- Open Chrome
- Click on three dot ( ⋮ ) (Near profile pic)
- More tools > Extensions
- Toggle the "Developer mode"
- Click on "Load unpacked"
- Redirect to the Extracted folder("physicswallah-video-control")
- Open

## <ins>Features:</ins>

| Feature          | Keyboard Key  |
| ---------------- | ------------- |
| Volume Up        | Up Arrow ↑    |
| Volume Down      | Down Arrow ↓  |
| Video Forward    | Right Arrow → |
| Video Backward   | Left Arrow ←  |
| Video Speedup    | NUMPAD +      |
| Video Slowdown   | NUMPAD -      |
| Video Play/Pause | Spacebar      |

## <ins>Other features:</ins>

- Video duration shown as "left duration"(This also update with video speed up/down)

## <ins>To change the default values and key set:</ins>

Edit the contentScript.js file

```javascript
//assigning all variable(default values)
var vidElement = "",
	//default values
	audiJump = 0.1, //volume range 0 to 1-(volume go up/down by 0.1)
	vidSpeedJump = 0.1, //speed range 0 to 10-(vid speed go up/down by 0.1)
	vidSeekJump = 5, //in seconds-(vid forward/backward by 5 sec)
	//keyset for controller
	audiUpKey = "ArrowUp", //up arrow key for volume up
	audiDownKey = "ArrowDown", //down arrow key for volume down
	forwardKey = "ArrowRight", //rigt arrow for video forwarding
	backwardKey = "ArrowLeft", //left arrow for video backwarding
	speedUpKey = "+", //NUMPAD '+' for speedup the video
	speedDownKey = "-", //NUMPAD '-' for slowdown the video
	playPauseKey = " "; //" " denotes the "blank space" for Space Bar to pay and pause the vid
```
