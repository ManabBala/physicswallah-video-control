//assigning all variable(default values)
var tc = {
	settings: {
		lastSpeed: 1,
		speeds: {},
		//default values
		audiJump: 0.1, //volume range 0 to 1-(volume go up/down by 0.1)
		vidSpeedJump: 0.1, //speed range 0 to 10-(vid speed go up/down by 0.1)
		vidSeekJump: 5, //in seconds-(vid forward/backward by 5 sec)
		//keyset for controller
		audiUpKey: "ArrowUp", //up arrow key for volume up
		audiDownKey: "ArrowDown", //down arrow key for volume down
		forwardKey: "ArrowRight", //rigt arrow for video forwarding
		backwardKey: "ArrowLeft", //left arrow for video backwarding
		speedUpKey: "+", //NUMPAD '+' for speedup the video
		speedDownKey: "-", //NUMPAD '-' for slowdown the video
		playPauseKey: " ", //" " denotes the "blank space" for Space Bar to pay and pause the vid
		controllerOpacity: 0.3,
		keyBindings: [],
		logLevel: 6,
	},
	// Holds a reference to all of the AUDIO/VIDEO DOM elements we've attached to
	mediaElements: [],
};

/* Log levels (depends on caller specifying the correct level)
  1 - none
  2 - error
  3 - warning
  4 - info
  5 - debug
  6 - debug high verbosity + stack trace on each message
*/
function log(message, level) {
	verbosity = tc.settings.logLevel;
	if (verbosity >= level) {
		if (level === 2) {
			console.log("ERROR:" + message);
		} else if (level === 3) {
			console.log("WARNING:" + message);
		} else if (level === 4) {
			console.log("INFO:" + message);
		} else if (level === 5) {
			console.log("DEBUG:" + message);
		} else if (level === 6) {
			console.log("DEBUG (VERBOSE):" + message);
			console.trace();
		}
	}
}
if (tc.settings.keyBindings.length == 0) {
	// if first initialization of 0.5.3
	// UPDATE
	tc.settings.keyBindings.push({
		action: "slower",
		key: 83,
		value: 0.1,
		force: false,
		predefined: true,
	}); // default S
	tc.settings.keyBindings.push({
		action: "faster",
		key: 68,
		value: 0.1,
		force: false,
		predefined: true,
	}); // default: D
	tc.settings.keyBindings.push({
		action: "rewind",
		key: 90,
		value: 10,
		force: false,
		predefined: true,
	}); // default: Z
	tc.settings.keyBindings.push({
		action: "advance",
		key: 88,
		value: 10,
		force: false,
		predefined: true,
	}); // default: X
	tc.settings.keyBindings.push({
		action: "reset",
		key: 82,
		value: 1.0,
		force: false,
		predefined: true,
	}); // default: R
	tc.settings.keyBindings.push({
		action: "fast",
		key: 71,
		value: 1.8,
		force: false,
		predefined: true,
	}); // default: G
	tc.settings.version = "0.5.3";
}

function getKeyBindings(action, what = "value") {
	try {
		return tc.settings.keyBindings.find((item) => item.action === action)[what];
	} catch (e) {
		return false;
	}
}

function setKeyBindings(action, value) {
	tc.settings.keyBindings.find((item) => item.action === action)["value"] =
		value;
}

initializeWhenReady(document);

function defineVideoController() {
	// Data structures
	// ---------------
	// videoController (JS object) instances:
	//   video = AUDIO/VIDEO DOM element
	//   parent = A/V DOM element's parentElement OR
	//            (A/V elements discovered from the Mutation Observer)
	//            A/V element's parentNode OR the node whose children changed.
	//   div = Controller's DOM element (which happens to be a DIV)
	//   speedIndicator = DOM element in the Controller of the speed indicator

	// added to AUDIO / VIDEO DOM elements
	//    vsc = reference to the videoController
	tc.videoController = function (target, parent) {
		if (target.vsc) {
			return target.vsc;
		}

		tc.mediaElements.push(target);

		this.video = target;
		this.parent = target.parentElement || parent;
		storedSpeed = tc.settings.speeds[target.currentSrc];

		storedSpeed = 1.0;

		log("Explicitly setting playbackRate to: " + storedSpeed, 5);
		target.playbackRate = storedSpeed;

		this.div = this.initializeControls();

		var mediaEventAction = function (event) {
			storedSpeed = tc.settings.speeds[event.target.currentSrc];

			storedSpeed = 1.0;

			// TODO: Check if explicitly setting the playback rate to 1.0 is
			// necessary when rememberSpeed is disabled (this may accidentally
			// override a website's intentional initial speed setting interfering
			// with the site's default behavior)
			log("Explicitly setting playbackRate to: " + storedSpeed, 4);
			setSpeed(event.target, storedSpeed);
		};

		target.addEventListener(
			"play",
			(this.handlePlay = mediaEventAction.bind(this))
		);

		target.addEventListener(
			"seeked",
			(this.handleSeek = mediaEventAction.bind(this))
		);

		var observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.type === "attributes" &&
					(mutation.attributeName === "src" ||
						mutation.attributeName === "currentSrc")
				) {
					log("mutation of A/V element", 5);
					var controller = this.div;
					if (!mutation.target.src && !mutation.target.currentSrc) {
						controller.classList.add("vsc-nosource");
						console.log("vsc- added");
					} else {
						controller.classList.remove("vsc-nosource");
						console.log("vsc- added");
					}
				}
			});
		});
		observer.observe(target, {
			attributeFilter: ["src", "currentSrc"],
		});
	};

	tc.videoController.prototype.remove = function () {
		this.div.remove();
		this.video.removeEventListener("play", this.handlePlay);
		this.video.removeEventListener("seek", this.handleSeek);
		delete this.video.vsc;
		let idx = tc.mediaElements.indexOf(this.video);
		if (idx != -1) {
			tc.mediaElements.splice(idx, 1);
		}
	};

	tc.videoController.prototype.initializeControls = function () {
		log("initializeControls Begin", 5);
		const document = this.video.ownerDocument;
		const speed = this.video.playbackRate.toFixed(2);
		const rect = this.video.getBoundingClientRect();
		// getBoundingClientRect is relative to the viewport; style coordinates
		// are relative to offsetParent, so we adjust for that here. offsetParent
		// can be null if the video has `display: none` or is not yet in the DOM.
		const offsetRect = this.video.offsetParent?.getBoundingClientRect();
		const top = Math.max(rect.top - (offsetRect?.top || 0), 0) + "px";
		const left = Math.max(rect.left - (offsetRect?.left || 0), 0) + "px";

		log("Speed variable set to: " + speed, 5);

		var wrapper = document.createElement("div");
		wrapper.classList.add("vsc-controller");

		if (!this.video.currentSrc) {
			wrapper.classList.add("vsc-nosource");
		}

		var shadow = wrapper.attachShadow({ mode: "open" });
		var shadowTemplate = `
        <style>
          @import "${chrome.runtime.getURL("shadow.css")}";
        </style>

        <div id="controller" style="top:${top}; left:${left}; opacity:${
			tc.settings.controllerOpacity
		}">
          <span data-action="drag" class="draggable">${speed}</span>
          <span id="controls">
            <button data-action="rewind" class="rw">«</button>
            <button data-action="slower">&minus;</button>
            <button data-action="faster">&plus;</button>
            <button data-action="advance" class="rw">»</button>
            <button data-action="display" class="hideButton">&times;</button>
          </span>
        </div>
      `;
		shadow.innerHTML = shadowTemplate;
		shadow.querySelector(".draggable").addEventListener(
			"mousedown",
			(e) => {
				runAction(e.target.dataset["action"], false, e);
				e.stopPropagation();
			},
			true
		);

		shadow.querySelectorAll("button").forEach(function (button) {
			button.addEventListener(
				"click",
				(e) => {
					runAction(
						e.target.dataset["action"],
						getKeyBindings(e.target.dataset["action"]),
						e
					);
					e.stopPropagation();
				},
				true
			);
		});

		shadow
			.querySelector("#controller")
			.addEventListener("click", (e) => e.stopPropagation(), false);
		shadow
			.querySelector("#controller")
			.addEventListener("mousedown", (e) => e.stopPropagation(), false);

		this.speedIndicator = shadow.querySelector("span");
		var fragment = document.createDocumentFragment();
		fragment.appendChild(wrapper);

		switch (true) {
			default:
				// Note: when triggered via a MutationRecord, it's possible that the
				// target is not the immediate parent. This appends the controller as
				// the first element of the target, which may not be the parent.
				this.parent.insertBefore(fragment, this.parent.firstChild);
		}
		return wrapper;
	};
}

function initializeWhenReady(document) {
	log("Starting initializeWhenReady", 5);
	if (document) {
		if (document.readyState === "complete") {
			initializeNow(document);
		} else {
			document.onreadystatechange = () => {
				if (document.readyState === "complete") {
					initializeNow(document);
				}
			};
		}
	}
	log("End initializeWhenReady", 5);
}

var coolDown = false;
function refreshCoolDown() {
	log("Begin refreshCoolDown", 5);
	if (coolDown) {
		clearTimeout(coolDown);
	}
	coolDown = setTimeout(function () {
		coolDown = false;
	}, 1000);
	log("End refreshCoolDown", 5);
}

function setupListener() {
	/**
	 * This function is run whenever a video speed rate change occurs.
	 * It is used to update the speed that shows up in the display as well as save
	 * that latest speed into the local storage.
	 *
	 * @param {*} video The video element to update the speed indicators for.
	 */
	function updateSpeedFromEvent(video) {
		// It's possible to get a rate change on a VIDEO/AUDIO that doesn't have
		// a video controller attached to it.  If we do, ignore it.
		if (!video.vsc) return;
		var speedIndicator = video.vsc.speedIndicator;
		var src = video.currentSrc;
		var speed = Number(video.playbackRate.toFixed(2));

		log("Playback rate changed to " + speed, 4);

		log("Updating controller with new speed", 5);
		speedIndicator.textContent = speed.toFixed(2);
		tc.settings.speeds[src] = speed;
		log("Storing lastSpeed in settings for the rememberSpeed feature", 5);

		// show the controller for 1000ms if it's hidden.
		runAction("blink", null, null);
	}

	document.addEventListener(
		"ratechange",
		function (event) {
			if (coolDown) {
				log("Speed event propagation blocked", 4);
				event.stopImmediatePropagation();
			}
			var video = event.target;

			/**
			 * If the last speed is forced, only update the speed based on events created by
			 * video speed instead of all video speed change events.
			 */
			updateSpeedFromEvent(video);
		},
		true
	);
}

function initializeNow(document) {
	log("Begin initializeNow", 5);

	// enforce init-once due to redundant callers
	if (!document.body || document.body.classList.contains("vsc-initialized")) {
		return;
	}
	try {
		setupListener();
	} catch {
		// no operation
	}
	document.body.classList.add("vsc-initialized");
	log("initializeNow: vsc-initialized added to document body", 5);

	if (document === window.document) {
		defineVideoController();
	} else {
		var link = document.createElement("link");
		link.href = chrome.runtime.getURL("inject.css");
		link.type = "text/css";
		link.rel = "stylesheet";
		document.head.appendChild(link);
	}
	var docs = Array(document);
	try {
		if (inIframe()) docs.push(window.top.document);
	} catch (e) {}

	docs.forEach(function (doc) {
		doc.addEventListener(
			"keydown",
			function (event) {
				var keyCode = event.keyCode;
				log("Processing keydown event: " + keyCode, 6);

				// Ignore keydown event if typing in an input box
				if (
					event.target.nodeName === "INPUT" ||
					event.target.nodeName === "TEXTAREA" ||
					event.target.isContentEditable
				) {
					return false;
				}

				// Ignore keydown event if typing in a page without vsc
				if (!tc.mediaElements.length) {
					return false;
				}

				var item = tc.settings.keyBindings.find((item) => item.key === keyCode);
				if (item) {
					runAction(item.action, item.value);
					if (item.force === "true") {
						// disable websites key bindings
						event.preventDefault();
						event.stopPropagation();
					}
				}

				return false;
			},
			true
		);
	});

	function checkForVideo(node, parent, added) {
		// Only proceed with supposed removal if node is missing from DOM
		if (!added && document.body.contains(node)) {
			return;
		}
		if (node.nodeName === "VIDEO") {
			if (added) {
				node.vsc = new tc.videoController(node, parent);
			} else {
				if (node.vsc) {
					node.vsc.remove();
				}
			}
		} else if (node.children != undefined) {
			for (var i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				checkForVideo(child, child.parentNode || parent, added);
			}
		}
	}

	var observer = new MutationObserver(function (mutations) {
		// Process the DOM nodes lazily
		requestIdleCallback(
			(_) => {
				mutations.forEach(function (mutation) {
					switch (mutation.type) {
						case "childList":
							mutation.addedNodes.forEach(function (node) {
								if (typeof node === "function") return;
								checkForVideo(node, node.parentNode || mutation.target, true);
							});
							mutation.removedNodes.forEach(function (node) {
								if (typeof node === "function") return;
								checkForVideo(node, node.parentNode || mutation.target, false);
							});
							break;
						case "attributes":
							if (
								(mutation.target.attributes["aria-hidden"] &&
									mutation.target.attributes["aria-hidden"].value == "false") ||
								mutation.target.nodeName === "APPLE-TV-PLUS-PLAYER"
							) {
								var flattenedNodes = getShadow(document.body);
								var nodes = flattenedNodes.filter((x) => x.tagName == "VIDEO");
								for (let node of nodes) {
									// only add vsc the first time for the apple-tv case (the attribute change is triggered every time you click the vsc)
									if (
										node.vsc &&
										mutation.target.nodeName === "APPLE-TV-PLUS-PLAYER"
									)
										continue;
									if (node.vsc) node.vsc.remove();
									checkForVideo(node, node.parentNode || mutation.target, true);
								}
							}
							break;
					}
				});
			},
			{ timeout: 1000 }
		);
	});
	observer.observe(document, {
		attributeFilter: ["aria-hidden", "data-focus-method"],
		childList: true,
		subtree: true,
	});

	var mediaTags = document.querySelectorAll("video");

	mediaTags.forEach(function (video) {
		video.vsc = new tc.videoController(video);
	});

	var frameTags = document.getElementsByTagName("iframe");
	Array.prototype.forEach.call(frameTags, function (frame) {
		// Ignore frames we don't have permission to access (different origin).
		try {
			var childDocument = frame.contentDocument;
		} catch (e) {
			return;
		}
		initializeWhenReady(childDocument);
	});
	log("End initializeNow", 5);
}

function setSpeed(video, speed) {
	log("setSpeed started: " + speed, 5);
	var speedvalue = speed.toFixed(2);

	video.playbackRate = Number(speedvalue);

	var speedIndicator = video.vsc.speedIndicator;
	speedIndicator.textContent = speedvalue;

	refreshCoolDown();
	log("setSpeed finished: " + speed, 5);
}

function runAction(action, value, e) {
	log("runAction Begin", 5);

	var mediaTags = tc.mediaElements;

	// Get the controller that was used if called from a button press event e
	if (e) {
		var targetController = e.target.getRootNode().host;
	}

	mediaTags.forEach(function (v) {
		var controller = v.vsc.div;

		// Don't change video speed if the video has a different controller
		if (e && !(targetController == controller)) {
			return;
		}

		showController(controller);

		if (!v.classList.contains("vsc-cancelled")) {
			if (action === "rewind") {
				log("Rewind", 5);
				v.currentTime -= value;
			} else if (action === "advance") {
				log("Fast forward", 5);
				v.currentTime += value;
			} else if (action === "faster") {
				log("Increase speed", 5);
				// Maximum playback speed in Chrome is set to 16:
				// https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/media/html_media_element.cc?gsn=kMinRate&l=166
				var s = Math.min(
					(v.playbackRate < 0.1 ? 0.0 : v.playbackRate) + value,
					16
				);
				setSpeed(v, s);
			} else if (action === "slower") {
				log("Decrease speed", 5);
				// Video min rate is 0.0625:
				// https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/media/html_media_element.cc?gsn=kMinRate&l=165
				var s = Math.max(v.playbackRate - value, 0.07);
				setSpeed(v, s);
			} else if (action === "reset") {
				log("Reset speed", 5);
				resetSpeed(v, 1.0);
			} else if (action === "display") {
				log("Showing controller", 5);
				controller.classList.add("vsc-manual");
				controller.classList.toggle("vsc-hidden");
			} else if (action === "blink") {
				log("Showing controller momentarily", 5);
				// if vsc is hidden, show it briefly to give the use visual feedback that the action is excuted.
				if (
					controller.classList.contains("vsc-hidden") ||
					controller.blinkTimeOut !== undefined
				) {
					clearTimeout(controller.blinkTimeOut);
					controller.classList.remove("vsc-hidden");
					controller.blinkTimeOut = setTimeout(
						() => {
							controller.classList.add("vsc-hidden");
							controller.blinkTimeOut = undefined;
						},
						value ? value : 1000
					);
				}
			} else if (action === "drag") {
				handleDrag(v, e);
			} else if (action === "fast") {
				resetSpeed(v, value);
			} else if (action === "pause") {
				pause(v);
			} else if (action === "muted") {
				muted(v);
			} else if (action === "mark") {
				setMark(v);
			} else if (action === "jump") {
				jumpToMark(v);
			}
		}
	});
	log("runAction End", 5);
}

function pause(v) {
	if (v.paused) {
		log("Resuming video", 5);
		v.play();
	} else {
		log("Pausing video", 5);
		v.pause();
	}
}

function resetSpeed(v, target) {
	if (v.playbackRate === target) {
		if (v.playbackRate === getKeyBindings("reset")) {
			if (target !== 1.0) {
				log("Resetting playback speed to 1.0", 4);
				setSpeed(v, 1.0);
			} else {
				log('Toggling playback speed to "fast" speed', 4);
				setSpeed(v, getKeyBindings("fast"));
			}
		} else {
			log('Toggling playback speed to "reset" speed', 4);
			setSpeed(v, getKeyBindings("reset"));
		}
	} else {
		log('Toggling playback speed to "reset" speed', 4);
		setKeyBindings("reset", v.playbackRate);
		setSpeed(v, target);
	}
}

function muted(v) {
	v.muted = v.muted !== true;
}

function setMark(v) {
	log("Adding marker", 5);
	v.vsc.mark = v.currentTime;
}

function jumpToMark(v) {
	log("Recalling marker", 5);
	if (v.vsc.mark && typeof v.vsc.mark === "number") {
		v.currentTime = v.vsc.mark;
	}
}

function handleDrag(video, e) {
	const controller = video.vsc.div;
	const shadowController = controller.shadowRoot.querySelector("#controller");

	// Find nearest parent of same size as video parent.
	var parentElement = controller.parentElement;
	while (
		parentElement.parentNode &&
		parentElement.parentNode.offsetHeight === parentElement.offsetHeight &&
		parentElement.parentNode.offsetWidth === parentElement.offsetWidth
	) {
		parentElement = parentElement.parentNode;
	}

	video.classList.add("vcs-dragging");
	shadowController.classList.add("dragging");

	const initialMouseXY = [e.clientX, e.clientY];
	const initialControllerXY = [
		parseInt(shadowController.style.left),
		parseInt(shadowController.style.top),
	];

	const startDragging = (e) => {
		let style = shadowController.style;
		let dx = e.clientX - initialMouseXY[0];
		let dy = e.clientY - initialMouseXY[1];
		style.left = initialControllerXY[0] + dx + "px";
		style.top = initialControllerXY[1] + dy + "px";
	};

	const stopDragging = () => {
		parentElement.removeEventListener("mousemove", startDragging);
		parentElement.removeEventListener("mouseup", stopDragging);
		parentElement.removeEventListener("mouseleave", stopDragging);

		shadowController.classList.remove("dragging");
		video.classList.remove("vcs-dragging");
	};

	parentElement.addEventListener("mouseup", stopDragging);
	parentElement.addEventListener("mouseleave", stopDragging);
	parentElement.addEventListener("mousemove", startDragging);
}

var timer = null;
function showController(controller) {
	log("Showing controller", 4);
	controller.classList.add("vcs-show");

	if (timer) clearTimeout(timer);

	timer = setTimeout(function () {
		controller.classList.remove("vcs-show");
		timer = false;
		log("Hiding controller", 5);
	}, 2000);
}

/*
//Old part
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
*/
