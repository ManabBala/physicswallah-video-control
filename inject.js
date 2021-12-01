//assigning all variable(default values)
var tc = {
	settings: {
		lastSpeed: 1,
		speeds: {},
		//default values
		volJump: 0.1, //volume range 0 to 1-(volume go up/down by 0.1)
		vidSpeedJump: 0.1, //speed range 0 to 10-(vid speed go up/down by 0.1)
		vidSeekJump: 5, //in seconds-(vid forward/backward by 5 sec)
		/*
		Shrotcut for media controller
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		->Change Shortcut by changing 'Key: ' value
		  e.g.volUpKey: 38,

		->TO note your desired key press, set "findKeyCode: true"
		  Open console by pressing crtl+shift+J,
			press any key and note the keyName/keyCode
		*/
		findKeyCode: false, //default true
		speedDownKey: 109, //default key: 109 =>NUMPAD '-' for slowdown the video
		speedUpKey: 107, //default key: 107 => NUMPAD '+' for speedup the video
		backwardKey: 37, //default key: 37 =>left arrow for video backwarding
		forwardKey: 39, //default key: 39 =>rigt arrow for video forwarding
		volUpKey: 38, //default key: 38 =>up arrow key for volume up
		volDownKey: 40, //default key: 40 =>down arrow key for volume down
		volMuteKey: 77, //dfault key: 77 =>'m' letter to mute the video
		playPauseKey: 32, //default key: 32 =>Space Bar to play and pause the video

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
	// UPDATE
	tc.settings.keyBindings.push({
		action: "slower",
		key: tc.settings.speedDownKey || 109,
		value: tc.settings.vidSpeedJump || 0.1,
		force: false,
		predefined: true,
	}); // default S
	tc.settings.keyBindings.push({
		action: "faster",
		key: tc.settings.speedUpKey || 107,
		value: tc.settings.vidSpeedJump || 0.1,
		force: false,
		predefined: true,
	}); // default: D
	tc.settings.keyBindings.push({
		action: "rewind",
		key: tc.settings.backwardKey || 37,
		value: tc.settings.vidSeekJump || 10,
		force: false,
		predefined: true,
	}); // default: Z
	tc.settings.keyBindings.push({
		action: "advance",
		key: tc.settings.forwardKey || 39,
		value: tc.settings.vidSeekJump || 10,
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
		action: "volUp",
		key: tc.settings.volUpKey || 38,
		value: tc.settings.volJump || 0.1,
		force: false,
		predefined: true,
	});
	tc.settings.keyBindings.push({
		action: "volDown",
		key: tc.settings.volDownKey || 38,
		value: tc.settings.volJump || 0.1,
		force: false,
		predefined: true,
	});
	tc.settings.keyBindings.push({
		action: "muted",
		key: tc.settings.volMuteKey || 38,
		value: 0,
		force: false,
		predefined: true,
	});
	tc.settings.keyBindings.push({
		action: "pause",
		key: tc.settings.playPauseKey || 32,
		value: 1,
		force: false,
		predefined: true,
	});
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

		if (!storedSpeed) {
			log(
				"Overwriting stored speed to 1.0 due to rememberSpeed being disabled",
				5
			);
			storedSpeed = 1.0;
		}

		log("Explicitly setting playbackRate to: " + storedSpeed, 5);
		target.playbackRate = storedSpeed;

		this.div = this.initializeControls();

		var mediaEventAction = function (event) {
			storedSpeed = tc.settings.speeds[event.target.currentSrc];

			if (!storedSpeed) {
				log("Overwriting stored speed to 1.0 (rememberSpeed not enabled)", 4);
				storedSpeed = 1.0;
			}

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
		const durationSec = this.video.duration;

		// getBoundingClientRect is relative to the viewport; style coordinates
		// are relative to offsetParent, so we adjust for that here. offsetParent
		// can be null if the video has `display: none` or is not yet in the DOM.
		const offsetRect = this.video.offsetParent?.getBoundingClientRect();
		const top = Math.max(rect.top - (offsetRect?.top || 0), 0) + "px";
		const left = Math.max(rect.left - (offsetRect?.left || 0), 0) + "px";
		const right = Math.max(rect.right - (offsetRect?.right || 0), 0) + "px";

		log("Speed variable set to: " + speed, 5);
		log("duration set to: " + durationSec, 5);

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
				<div id="controllerDura" style="top:${top}; right:${right}">
				<span>-</span>
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

		//updating the Left Duration on the top rihgt
		this.durationIndicator = shadow.querySelector("#controllerDura");
		this.video.addEventListener("timeupdate", (event) => {
			let leftDurationSec = durationSec - this.video.currentTime;
			const vidSpeed = this.video.playbackRate.toFixed(2);
			function leftDuration(secTime, speed) {
				return new Date((secTime * 1000) / speed).toISOString().substr(11, 8);
			}
			this.durationIndicator.innerHTML =
				"- " + leftDuration(leftDurationSec, vidSpeed);
		});

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
		tc.settings.lastSpeed = speed;
		log("Speed setting saved: " + speed, 5);
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
				var keyName = event.key;
				var keyCode = event.keyCode;

				if (tc.settings.findKeyCode == true) {
					console.log(`keydown event: keyName = "${keyName}"
					keyCode = ${keyCode}`);
				}
				// log("Processing keydown event: " + keyCode, 6);

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
					}
				});
			},
			{ timeout: 1000 }
		);
	});
	observer.observe(document, {
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
	tc.settings.lastSpeed = speed;
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
			} else if (action === "pause") {
				pause(v);
			} else if (action === "volUp") {
				volUp(v, value);
			} else if (action === "volDown") {
				volDown(v, value);
			} else if (action === "muted") {
				muted(v);
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
			log("Resetting playback speed to 1.0", 4);
			setSpeed(v, 1.0);
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

function volUp(v, volJump) {
	console.log(v.volume);
	if (v.volume === 1) {
		alert("Max Volume");
	} else if (v.volume < 1) {
		v.volume += volJump;
		log("Volume Up", 4);
	}
}

function volDown(v, volJump) {
	console.log(v.volume);
	if (v.volume > 0 && v.volume < 0.1) {
		alert("Minnimum Volume");
	} else if (v.volume > 0.1) {
		v.volume -= volJump;
		log("Volume Down", 4);
	}
}

function muted(v) {
	v.muted = v.muted !== true;
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
