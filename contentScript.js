if (typeof init === "undefined") {
	const init = function () {
		console.log("Script Launched");
		if (location.href.match("https://www.physicswallah.live/")) {
			console.log("We are in Physicswalla website");

			//Waiting for the element to appear
			var waitForEl = function (selector, callback) {
				console.log("waitForEl trigered");
				if (selector.length) {
					console.log("Element found");
					callback();
				} else {
					setTimeout(function () {
						waitForEl(selector, callback);
					}, 100);
				}
			};

			//waiting for video element
			waitForEl(
				'document.querySelector("#rs_penpencil_player_html5_api")',
				function () {
					vidFound();
				}
			);

			//running vid controler
			function vidFound() {
				console.log("Video Element Found");

				//assigning all variable(default values)
				var vidId = document.getElementsByTagName("video")[0],
					audiJump = 0.1, //audeo range 0 to 1
					vidSpeedJump = 0.1, //speed range 0 to 10
					vidSeekJump = 5; //in second

				// this for the new speeded duration
				function setupSpeedDuration() {
					vidId.addEventListener("timeupdate", (event) => {
						var fullDurationSec = vidId.duration;
						var leftDurationSec = fullDurationSec - vidId.currentTime;

						//for the Duration field
						function leftDuration(secTime, speed) {
							return new Date((secTime * 1000) / speed)
								.toISOString()
								.substr(11, 8);
						}

						const speed = vidId.playbackRate;
						document.querySelector(
							"#rs_penpencil_player > div.vjs-control-bar > div.vjs-duration.vjs-time-control.vjs-control > span.vjs-duration-display"
						).innerHTML = "- " + leftDuration(leftDurationSec, speed);
					});
					console.log("Duration fucntion started");
				}

				//volume change
				function setvol(crVolume) {
					vidId.volume = crVolume;
					console.log("Volume = " + vidId.volume.toFixed(1));
				}

				//video speed change
				function setVidSpeed(vidSpeed) {
					vidId.playbackRate = vidSpeed;
					console.log("Video Speed = " + vidId.playbackRate.toFixed(2));
				}

				// this for the volume control by up and down arrow
				function keyboardEventListener() {
					window.addEventListener("keydown", (event) => {
						//volume control
						if (event.key === "ArrowUp") {
							if (vidId.volume === 1) {
								console.log("Max Volume");
								alert("Max Volume");
							} else if (vidId.volume < 1) {
								vidId.volume += audiJump;
								// setvol(vidId.volume + audiJump);
								// console.log("Volume Up");
							}
						} else if (event.key === "ArrowDown") {
							if (vidId.volume > 0 && vidId.volume < 0.1) {
								console.log("Minnium Volume");
								alert("Minnimum Volume");
							} else if (vidId.volume > 0.1) {
								setvol(vidId.volume - audiJump);
								// console.log("Volume Down");
							}

							//video speed control
						} else if (event.key === "+") {
							if (vidId.playbackRate < 15) {
								setVidSpeed(vidId.playbackRate + vidSpeedJump);
							}
						} else if (event.key === "-") {
							if (vidId.playbackRate - vidSpeedJump > 0.1) {
								setVidSpeed(vidId.playbackRate - vidSpeedJump);
							}

							//video play&pause
						} else if (event.key === " ") {
							if (vidId.paused) {
								vidId.play();
							} else vidId.pause();

							//video seeking
						} else if (event.key === "ArrowRight") {
							vidId.currentTime += vidSeekJump;
						} else if (event.key === "ArrowLeft") {
							vidId.currentTime -= vidSeekJump;
						} else false;
					});
					console.log("Keyboard Event Listener Started");
				}

				//running all function
				setupSpeedDuration();
				keyboardEventListener();
			}
		}
	};

	init();
}
