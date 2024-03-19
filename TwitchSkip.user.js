// ==UserScript==
// @name         TwitchSkip
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Skip by Using Mouse-double-right-click on Twitch-Videos. Press "strg" to have original Context-Menu
// @author       Phörd
// @match        https://www.twitch.tv/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
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
    simulatedKeyDownL = new KeyboardEvent('keydown', { //Very basic solution, but works pretty good without using React directly (if I have time will change to a more direct Solution)
        key: "L",
        keyCode: 76,
        which: 76,
        code: "KeyL",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false
    }),
    simulatedKeyDownJ = new KeyboardEvent('keydown', {
        key: "J",
        keyCode: 74,
        which: 74,
        code: "KeyJ",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false
    });

(function() {
    'use strict';
    var oldHref = document.location.href;
    window.onload = setTimeout(function() {
        var bodyList = document.querySelector("body")
        var observer = new MutationObserver(function(mutations) {
            if (oldHref != document.location.href) {
                oldHref = document.location.href;
                if(document.location.href.includes("twitch.tv/videos")){
                    check();
                }
            }
        });

        var config = {
            childList: true,
            subtree: true
        };

        observer.observe(bodyList, config);
        if(document.location.href.includes("twitch.tv/videos")){
            check();
        }
    }, 500);
})();

function loadMyFeatures(){
    let videoController = document.querySelector(".video-player__container"),
        CtrlPressed = false;
    if(videoController === null){
        controllerFound = false;
        check();
        return;
    }
    //FOR LATER //createMyUiElements();
    if(videoController !== null){
        videoController.onmouseover = function(){
            mouseIsOver = true;
        }
        videoController.onmouseout = function(){
            mouseIsOver = false;
        }
        //ContextCheck
        if (document.addEventListener) {
            document.addEventListener('contextmenu', function(e) {
                if(mouseIsOver && !CtrlPressed){
                    console.log("left Clicked");
                    clearTimeout(clickTimeOut);
                    clickTimeOut = setTimeout(resetClicks, 700);
                    recentlyClicked = true;
                    nmbrOfClicks++;
                    if(nmbrOfClicks == 2){
                        nmbrOfClicks = 0;
                        overAllNmbrOfClicks++;
                        skip(e);
                    }
                    e.preventDefault();
                }
                CtrlPressed = false;
            }, false);
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
        } else {
            document.attachEvent('oncontextmenu', function() {
                window.event.returnValue = false;
            });
        }
    }
}

//Just for reliability checks again if the VideoElement loaded, if not checks again after half a Second. the Timeout also increases chance the Element is already loaded the first time
function check(){
    if(!controllerFound){
        setTimeout(function (){
            if(location.href.includes("twitch.tv/videos")){
                controllerFound = true;
                loadMyFeatures();
            } else {
                checkSum++;
                controllerFound = false;
                check();
            }
        }, 500);}
}

//Twitch UI is structured diffrently, first quick attempt, but I would rather create a new small unintrusive pop-Up in a Corner, if it were necessary, for now a Ui-Element doesnt seem needed
function createMyUiElements(){
    let videoController = document.querySelector(".video-player__container");
    var myDivRight = document.createElement("DIV"),
        myDivLeft = document.createElement("DIV"),
        myBRight = document.createElement("b"),
        myBLeft = document.createElement("b");

    myDivRight.style.cssText = "position:relative; border-radius: 50px; width: 100px; height: 100px; background-color: black; border-color: black; text-align: center;  left: 75%; top: 50%;";
    // myDivRight.style.visibility = "hidden";
    myDivRight.id = "myDivRight";
    myBRight.style.cssText = "text-align: center;color: white; align-self: center; line-height: 100px;";
    myBRight.innerHTML = ">>";
    myDivRight.appendChild(myBRight);
    myDivRight.style.zIndex = 100;

    myDivLeft.style.cssText = "position:relative; border-radius: 50px; width: 100px; height: 100px; background-color: black; border-color: black; text-align: center;  left: 25%; top: 50%;";
    //myDivRight.style.visibility = "hidden";
    myDivLeft.id = "myDivLeft"
    myBLeft.style.cssText = "text-align: center;color: white; align-self: center; line-height: 100px;";
    myBLeft.innerHTML = "<<";
    myDivLeft.appendChild(myBLeft);
    myDivLeft.style.zIndex = 100;

    videoController.parentElement.appendChild(myDivRight);
    videoController.parentElement.appendChild(myDivLeft);
}

function resetClicks(){
    nmbrOfClicks = 0;
    overAllNmbrOfClicks = 0;
    recentlyClicked = false;
}

function skip(ev){
    var videoControllerProp = document.querySelector(".video-player__container"),
        viewportOffset = videoControllerProp.getBoundingClientRect(),
        middlePoint = videoControllerProp.offsetWidth/2 + viewportOffset.left,
        overAllSkip = overAllNmbrOfClicks * 10;
    if(ev.screenX >= middlePoint){
        //skip ahead
        document.dispatchEvent(simulatedKeyDownL);
    }
    if(ev.screenX < middlePoint){
        //skip backwards
        document.dispatchEvent(simulatedKeyDownJ);
    }
}
