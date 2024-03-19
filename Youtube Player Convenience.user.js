// ==UserScript==
// @name         Youtube Player Convenience
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  skip forward/backward 10sec with your mouse-doubleRightClick, press "strg" to open Context-Menu; Controll Volume by using your Mousewheel
// @author       SomeoneWhoIsBored
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

var mouseIsOver = false,
    recentlyClicked = false,
    nmbrOfClicks = 0,
    overAllNmbrOfClicks = 0,
    clickTimeOut,
    lastClickTimeOut,
    checkSum = 0,
    controllerFound = false,
    listenerAttached = false,
    CtrlPressed = false,
    simulatedKeyDownL = new KeyboardEvent("keydown", { //Very basic Solution using existing shortcuts, but does work reliable and why reinvent the wheel (if I have time will change to a more direct Solution)
        key: "L",
        keyCode: 76,
        which: 76,
        code: "KeyL",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
    }),
    simulatedKeyDownJ = new KeyboardEvent("keydown", {
        key: "J",
        keyCode: 74,
        which: 74,
        code: "KeyJ",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
    }),
    simulatedKeyDownArrowDown = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        keyCode: 40,
        which: 40,
        code: "ArrowDown",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
    }),
    simulatedKeyDownArrowUp = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        keyCode: 38,
        which: 38,
        code: "ArrowUp",
        location: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        repeat: false,
    });

(function() {
    console.log("started change");
    if(!controllerFound){
        setTimeout(() => {
            console.log("started check");
            check();
        },200);
    } else {
        if(!location.href.includes("watch")){
            controllerFound = false;
        }
    }
})();

//TimerVersion: Because Youtube doesnt load the Site new when clicking on a Video; I check for href Change every 1.5 Seconds and inject my own contextlistener only when Href matches witch a "Watch" in href
//Could be replaced with an Mutation-Observer but this Version is reasonable reliable
function check() {
    if (!controllerFound) {
        setTimeout(function () {
            if (location.href.includes("watch") && location.href.includes("youtube")) {
                loadMyFeatures();
            } else {
                checkSum++;
                check();
            }
        }, 500);
    }
}

function historyStateCheck() {
    window.addEventListener("popstate", function (event) {
        //If historyStates become relevant to the loading of Videos, Not necessary at the Moment
    });
}

function loadMyFeatures() {
    var videoController;
    videoController = document.querySelector(".html5-video-player"); //If it causes Problem switch to firstElementChild (".html5-video-container")
    let volumeWrapper = document.querySelector(".ytp-bezel-text");
    volumeWrapper.style.fontSize = "xx-large";
    volumeWrapper.style.color = "red";
    if (videoController !== null) {
        //controllerFound is exit from recursive-function check()
        controllerFound = true;
        //Mouseover/out event sets boolean to work more reliable
        videoController.onmouseover = function () {
            mouseIsOver = true;
        };
        videoController.onmouseout = function () {
            if (!recentlyClicked) mouseIsOver = false;
        };
        //Mousewheel event for Volume Control (directly on Video to try something diffrent from the skip function)
        document.querySelector("video").addEventListener("wheel", function (event) {
            if(mouseIsOver){
                event.preventDefault();
                event.stopPropagation();
                //Stops Page from scrolling
                let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                window.scrollTo(scrollLeft, scrollTop);

                if (event.deltaY > 0) {
                    //Volume Down
                    videoController.dispatchEvent(simulatedKeyDownArrowDown); //EVENT HAS TO BE DISPATCHED ON ELEMENT WITH CLASS ("html5-video-player"), else it wont work
                }
                if (event.deltaY < 0) {
                    //Volume Up
                    videoController.dispatchEvent(simulatedKeyDownArrowUp); //EVENT HAS TO BE DISPATCHED ON ELEMENT WITH CLASS ("html5-video-player"), else it wont work
                }
            }

        });

        //ContextCheck
        if (document.addEventListener) { //check if addEventlistener is supported
            if(!listenerAttached){
                document.addEventListener("contextmenu", function (e) { //listener on document, because on videoController directly it tends to misfire?
                    listenerAttached = true;
                    if (mouseIsOver && !CtrlPressed) {
                        if (document.querySelector(".ytp-contextmenu.ytp-popup") !== null) {
                            document.querySelector(".ytp-contextmenu.ytp-popup").remove();
                        }
                        clearTimeout(clickTimeOut);
                        clickTimeOut = setTimeout(resetClicks, 700);
                        recentlyClicked = true;
                        nmbrOfClicks++;
                        if (nmbrOfClicks == 2) {
                            nmbrOfClicks = 0;
                            overAllNmbrOfClicks++;
                            skip(e);
                        }
                        e.preventDefault();
                    }
                    document.addEventListener('keydown', function(event) {
                        if (event.code === 'ControlLeft') {
                            CtrlPressed = true;
                        }
                    });
                    document.addEventListener('keyup', function(event) {
                        if (event.code === 'ControlLeft') {
                            CtrlPressed = false;
                        }
                    });
                },
                                          false
                                         );
            } else {
                //For Internet-Explorer
                document.attachEvent("oncontextmenu", function () {
                    window.event.returnValue = false;
                });
            }
        }

    }
}

function resetClicks() {
    nmbrOfClicks = 0;
    overAllNmbrOfClicks = 0;
    recentlyClicked = false;
}

function skip(ev) {
    var videoControllerProp = document.querySelector(".html5-video-container"),
        viewportOffset = videoControllerProp.getBoundingClientRect(),
        middlePoint = videoControllerProp.offsetWidth / 2 + viewportOffset.left,
        overAllSkip = overAllNmbrOfClicks * 10;
    if (ev.screenX >= middlePoint) {
        //skip ahead
        document.dispatchEvent(simulatedKeyDownL);
    }
    if (ev.screenX < middlePoint) {
        //skip backwards
        document.dispatchEvent(simulatedKeyDownJ);
    }
    setTimeout(function () {
        document.querySelector(".ytp-doubletap-tooltip-label").innerHTML =
            overAllSkip + " Seconds";
    }, 10);
}
