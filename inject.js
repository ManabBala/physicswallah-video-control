startWhenReady();
function startWhenReady() {
	// window.onload = () => {
	// 	startingNow(window.document);
	// };
	if (document) {
		if (document.readyState === "complete") {
			startingNow(document);
		} else {
			document.onreadystatechange = () => {
				if (document.readyState === "complete") {
					startingNow(document);
				}
			};
		}
	}
	console.log("window loaded");
}

function startingNow() {
	console.log("starting Now");
	//controller section to controll video
	function videoController(vidElement) {
		console.log("videoController Launch");
		//assigning all variable(default values)
		let lastVidSpeed = 1,
			lastVolume = 10,
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

		//creating div to show video speed and volume
		var injectEl = document.createElement("div");
		injectEl.className = "pw-vid-controller";
		injectEl.innerHTML =
			"🗲" +
			vidElement.playbackRate +
			"x" +
			"🔊" +
			vidElement.volume.toFixed(1) * 10;
		document.body.appendChild(injectEl);
		vidElement.onratechange = function () {
			injectEl.innerText =
				"🗲" +
				lastVidSpeed.toPrecision(2) +
				"x" +
				"🔊" +
				vidElement.volume.toFixed(1) * 10;
		};
		vidElement.onvolumechange = function () {
			injectEl.innerText =
				"🗲" +
				lastVidSpeed.toPrecision(2) +
				"x" +
				"🔊" +
				vidElement.volume.toFixed(1) * 10;
		};

		//controlling video
		// this for the new speeded duration
		// function setupSpeedDuration() {
		vidElement.addEventListener("timeupdate", (event) => {
			var fullDurationSec = vidElement.duration;
			var leftDurationSec = fullDurationSec - vidElement.currentTime;

			//for the Duration field
			function leftDuration(secTime, speed) {
				return new Date((secTime * 1000) / speed).toISOString().substr(11, 8);
			}

			const speed = vidElement.playbackRate;
			document.querySelector(
				"#rs_penpencil_player > div.vjs-control-bar > div.vjs-duration.vjs-time-control.vjs-control > span.vjs-duration-display"
			).innerHTML = "- " + leftDuration(leftDurationSec, speed);
		});
		// console.log("Duration fucntion started");
		// }

		//monnitoring keyboard input
		// function keyboardEventListener() {
		window.addEventListener("keydown", (event) => {
			//volume control
			if (event.key === audiUpKey) {
				if (vidElement.volume === 1) {
					console.log("Max Volume");
					alert("Max Volume");
				} else if (vidElement.volume < 1) {
					vidElement.volume += audiJump;
					// lastVolume = vidElement.volume += audiJump;
					// vidElement.volume = lastVolume;
					console.log("Volume Up");
				}
			} else if (event.key === audiDownKey) {
				if (vidElement.volume > 0 && vidElement.volume < 0.1) {
					console.log("Minnium Volume");
					alert("Minnimum Volume");
				} else if (vidElement.volume > 0.1) {
					vidElement.volume -= audiJump;
					// lastVolume = vidElement.volume += audiJump;
					// vidElement.volume = lastVolume;
					console.log("Volume Down");
				}

				//video speed control
			} else if (event.key === speedUpKey) {
				if (vidElement.playbackRate < 15) {
					// vidElement.playbackRate += vidSpeedJump;
					lastVidSpeed = lastVidSpeed += vidSpeedJump;
					vidElement.playbackRate = lastVidSpeed;
				}
			} else if (event.key === speedDownKey) {
				if (vidElement.playbackRate - vidSpeedJump > 0.1) {
					// vidElement.playbackRate -= vidSpeedJump;
					lastVidSpeed = lastVidSpeed -= vidSpeedJump;
					vidElement.playbackRate = lastVidSpeed;
				}

				//video play&pause
			} else if (event.key === playPauseKey) {
				if (vidElement.paused) {
					vidElement.play();
				} else vidElement.pause();

				//video seeking
			} else if (event.key === forwardKey) {
				vidElement.currentTime += vidSeekJump;
			} else if (event.key === backwardKey) {
				vidElement.currentTime -= vidSeekJump;
			} else false;
		});
		console.log("Keyboard Event Listener Started");
		// }

		//running all function
		// setupSpeedDuration();
		// keyboardEventListener();

		//observing if video element gets removed
		var observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (!mutation.target.src) {
					//adding a no-display css class to hide dissappeared video
					injectEl.classList.add("pw-vid-controller-no-visual");
					console.log("video removed");
					lastVidSpeed = 1;
					lastVolume = 10;
					// vidElement.removeEventListener("keydown", ());
					// vidElement.removeEventListener("timeupdate");
					console.log("video removed");
					return;
				}
			});
		});
		observer.observe(vidElement, {
			attributeFilter: ["src", "currentSrc"],
		});
	}

	//observing for new video element
	var observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (
				mutation.type === "attributes" &&
				mutation.target.nodeName === "VIDEO" &&
				(mutation.attributeName === "src" ||
					mutation.attributeName === "currentSrc")
			) {
				if (mutation.target.src) {
					new videoController(mutation.target);
					// vidElement = mutation.target;
					console.log("video added");
				}
			}
		});
	});
	observer.observe(document, {
		attributeFilter: ["src", "currentSrc"],
		childList: true,
		subtree: true,
	});

	//calling videoController if video element already present
	vidElement = document.querySelector("video");
	console.log(vidElement);
	if (vidElement) {
		new videoController(vidElement);
	}
}
