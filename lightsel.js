'use strict';
//TODO
// Remove click after drag
// Add object
// Remove object
// Infinite scroll
// Autoscroll delay

//Firing events:
//lightsel_objectClicked -> detail.leightselID, detail.objectId
//lightsel_dragStart -> detail.leightselID
//lightsel_dragEnd -> detail.leightselID
//lightsel_dragged -> detail.leightselID, detail.dragAmount
//lightsel_moved -> detail.leightselID, detail.moveAmount

/* Notes
    element.children in IE8 returns comment nodes
*/
var Lightsel = window.Lightsel || {};


Lightsel = (function() {
    function Lightsel(import_settings) {
        this.settings = {
            //If the use can spin infinitely to the right or left
            infiniteSpin: false,
            //Local settings for infinite spin
            realFirst: null,
            realFirstID: 0,
            copyFirst: null,
            realLast: null,
            realLastID: 0,
            copyLast: null,
            //If the lightsel scrolls automatically
            autoscroll: false,
            autoscroll_interval: 3000,

            //If there are not enough objects to fill the container, it will create copies of it
            fillWithCopies: false,
            filledWithCopies: false,

            //If the user is allowed to spin the lightsel if the objects fill entirely
            //in the container and don't overflow
            spinOnLessObjects: false,

            id: "lightsel1",

            //The amount of time that is passed to the
            //SetInterval function that changes object every iteration
            //When the arrow button is holded (mouse pressed)
            arrowHoldInterval: 100,



            //Turn on or off events
            //If the browser doesn't support events, an console error log will be written
            events: false,

            //Global objects
            lightsel: null,
            movingWrapper: null,
            moving: null,
            objects: null,
            toFirst: null,
            toLast: null,

            //The decaying of the inertion after a drag
            inertionStartSpeed: 20,

            dragStarted: false,

            //local
            totalObjects: 0,
            previousActiveObject: -1,
            currentActiveObject: 0,
            currentRelativePosition: 0,

            hasTransform: true,

            //Whether it should have arrows or not
            arrows: false
        };

        //Override the current this.settings
        for (var key in import_settings) {
            this.settings[key] = import_settings[key];
        }

        var _ = this;

        _.Init();

    }

    return Lightsel;

}());


Lightsel.prototype.Init = function() {
    var _ = this;

     //Main container

    _.settings.lightsel = document.getElementById(_.settings.id);

    //Add all the elements
    var children_objects = _.settings.lightsel.children;

    var control_wrapper = document.createElement("div");
    control_wrapper.className = "control-wrapper";
    var moving_wrapper = document.createElement("div");
    moving_wrapper.className = "moving-wrapper";
    var movingElement = document.createElement("div");
    movingElement.className = "moving";
    movingElement.style.transform = "translate3d(0px, 0px, 0px)";
    movingElement.style.left = "0px";


    while (children_objects.length > 0) {
        movingElement.appendChild(children_objects[0]);
    }
    moving_wrapper.appendChild(movingElement);

    if (_.settings.arrows) {
        _.settings.lightsel.className += " arrows";
    }

    if (_.settings.arrows) {
        var left_arrow = document.createElement("button");
        left_arrow.className = "arrow lightsel-left";
        var left_arrow_div = document.createElement("div");
        left_arrow_div.className = "arrow-inner";
        left_arrow_div.innerHTML = "&lsaquo;";
        left_arrow.appendChild(left_arrow_div);
        control_wrapper.appendChild(left_arrow);
    }

    control_wrapper.appendChild(moving_wrapper);


    if (_.settings.arrows) {
        var right_arrow = document.createElement("button");
        right_arrow.className = "arrow lightsel-right";
        var right_arrow_div = document.createElement("div");
        right_arrow_div.className = "arrow-inner";
        right_arrow_div.innerHTML = "&rsaquo;";
        right_arrow.appendChild(right_arrow_div);
        control_wrapper.appendChild(right_arrow);
    }
    _.settings.lightsel.appendChild(control_wrapper);


    _.settings.movingWrapper = _.settings.lightsel.querySelector(".moving-wrapper");
    _.settings.moving = _.settings.lightsel.querySelector(".moving");
    _.settings.objects = _.settings.lightsel.querySelectorAll(".object");


    //Total number of objects
    _.settings.totalObjects = _.settings.movingWrapper.children.length;

    //Arrows
    _.settings.toFirst = _.settings.lightsel.querySelector(".lightsel-left");
    _.settings.toLast = _.settings.lightsel.querySelector(".lightsel-right");

    var elem = _.settings.lightsel;

    if (elem === 'undefined') {
        console.log("Wrong lightsel id");
    }

    if (_.settings.events == false) {
        console.log("Lightrousel: Events turned off");
    }

    _.settings.objects[0].className += " active";

    if (_.settings.fillWithCopies) {
        _.FillWithCopies();
    }

    _.settings.hasTransform = _.DetectCSSFeature("transform");

    _.settings.totalObjects = _.settings.objects.length;

    if (_.settings.infiniteSpin) {
        if (!_.settings.filledWithCopies) {
            _.FillWithCopies();
        }
        _.InfiniteSpin();
    }


    if (_.settings.autoscroll) {
        setInterval(function() {
            _.SetActiveAndShow(_.GetNextObjectId());
        }, _.settings.autoscroll_interval);
    }

    //Add click events to objects
    _.ClickEvents();

    _.DragEvents();

    _.SwipeEvents();

    _.ClickEventsArrows();

    _.HoldArrowsEvents();


}

//Add listener


/* EVENTS */
//Generate custom events
//As well as dispatches them
Lightsel.prototype.GenEventAndDispatch = function(name, detail) {
    var _ = this;

    if (_.settings.events) {
        if (typeof CustomEvent === "function") {
            var e = new CustomEvent(name, {
                detail : detail,
                bubbles: true,
                cancelable: true,
            });
            _.settings.lightsel.dispatchEvent(e);
        }
    }
}

//Adds click events to the objects of the lightsel
//Clicking them will also generate an event [lightsel_objectClicked]
Lightsel.prototype.ClickEvents = function() {
    var _ = this;

    var clickAction = function(event) {
        event = event || window.event;
        var target = event.target || event.srcElement;
        while (!target.getAttribute("data-lightsel-id")) {
            target = target.parentNode;
        }

        _.GenEventAndDispatch("lightsel_objectClicked", {
                lightselID: _.settings.id,
                objectId: target.getAttribute("data-lightsel-id"),
        });

        var newCurrent = parseInt(target.getAttribute("data-lightsel-id"));
        _.SetActiveAndShow(newCurrent);
    }

    for (var i = 0; i<_.settings.objects.length; i++) {
        var obj = _.settings.objects[i];
        obj.setAttribute("data-lightsel-id", i);

        if (obj.addEventListener) {
            obj.addEventListener("click", clickAction);
        } else {
            obj.attachEvent("onclick", clickAction);
        }

    }
}

//Adds drag functionality to the lightsel
//Drag start will fire and even [lightsel_dragStart]
//Dragging will fire the event [lightsel_dragged]
//End of dragging will fire [lightsel_dragEnd]
Lightsel.prototype.DragEvents = function() {
    var _ = this;
    var elem = _.settings.lightsel;
    var moving = _.settings.moving;
    var movingWrapper = _.settings.movingWrapper;
    var lastDiff = 0;

    /**** DRAG ****/
    moving.onclick = function(event) {
        return false;
    }


    moving.onmousedown = function(event) {

        if (!event) event = window.event;

        var currPos = event.clientX;

        document.onmousemove = function(event) {
            if (!event) event = window.event;

            (event.preventDefault) ? event.preventDefault() : (event.returnValue = false);

            var eventPos = event.clientX;

            var diff = eventPos - currPos;
            currPos = eventPos;
            lastDiff = diff;

            if (Math.abs(lastDiff) > 0) {
                _.GenEventAndDispatch("lightsel_dragged", {
                    lightselID: _.settings.lightsel.id,
                    dragAmout: diff,
                });

                if (!_.settings.dragStarted) {
                    _.settings.dragStarted = true;
                    _.GenEventAndDispatch("lightsel_dragStart", {
                        lightselID: elem.id
                    });
                }
            }


            _.TranslateMoving(diff);
        }

        document.onmouseup = function(event) {
            if (!event) event = window.event;

            document.onmousemove = null;
            document.onmouseup = null;

            if (_.settings.dragStarted) {
                //Fire dragEnd event
                _.GenEventAndDispatch("lightsel_dragEnd", {
                    lightselID: _.settings.lightsel.id
                });
                _.settings.dragStarted = false;
            }


            if (Math.abs(lastDiff) > 3) {
                _.SpinInertion(lastDiff);
            }
            lastDiff = 0;

            event.preventDefault ? event.preventDefault() : (event.returnValue = false);
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        }

    }
    /**** /.DRAG ****/
};


//Adds drag functionality to the lightsel
//Swipe start will fire and even [lightsel_swipeStart]
//Swiping will fire the event [lightsel_swiped]
//End of swiping will fire [lightsel_swipeEnd]
Lightsel.prototype.SwipeEvents = function() {
    var xDown = null;
    var xDiff = null;

    var _ = this;

    if (_.settings.lightsel.addEventListener) {
        _.settings.lightsel.addEventListener("touchstart", function(event) {
            xDown = event.touches[0].clientX;
            _.GenEventAndDispatch("lightsel_swipeStart", {
                lightselID: _.settings.lightsel.id
            });

        }, false);

        _.settings.lightsel.addEventListener("touchmove", function(event) {
            if (!xDown) {
                return;
            }

            var xUp = event.touches[0].clientX;
            xDiff = xUp - xDown;
            xDown = xUp;

            if (Math.abs(xDiff) > 0) {
                _.GenEventAndDispatch("lightsel_swiped", {
                    lightselID: _.settings.lightsel.id,
                    swipeAmount: xDiff,
                });
            }
            _.TranslateMoving(xDiff);



        }, false);


        _.settings.lightsel.addEventListener("touchend", function(event) {
                if (Math.abs(xDiff) > 3) {
                    _.SpinInertion(xDiff);
                }
                xDiff = 0;

                _.GenEventAndDispatch("lightsel_swipeEnd", {
                    lightselID: _.settings.lightsel.id
                });
        }, false);
    }
}


//  Adds click events on left and right arrows
//  tofirst - the arrow that moves the lightsel to the first item
//  tolast - the arrow that moves the lightsel to the last item
Lightsel.prototype.ClickEventsArrows = function() {
    var _ = this,
        toFirst = _.settings.toFirst,
        toLast  = _.settings.toLast;

    //If neither toFirst nor toLast is set, the code will not execute
    if (
        (toFirst && toFirst.addEventListener) || (toLast && toLast.addEventListener)
       ) {

        if (toFirst) {
            toFirst.addEventListener("click", function() {
                _.SetActiveAndShow(_.GetPreviousObjectId(), false);
            });
        }

        if (toLast) {
            toLast.addEventListener("click", function() {
                _.SetActiveAndShow(_.GetNextObjectId(), false);
            });
        }

    } else {

        if (toFirst) {
            toFirst.attachEvent("onclick", function() {
                _.SetActiveAndShow(_.GetPreviousObjectId(), false);
            });
        }

        if (toLast) {
            toLast.attachEvent("onclick", function() {
                _.SetActiveAndShow(_.GetNextObjectId(), false);
            });
        }
    }
}

//Events of holding the mouse on the left and right arrows
Lightsel.prototype.HoldArrowsEvents = function() {
    var _ = this,
        toFirst = _.settings.toFirst,
        toLast  = _.settings.toLast;

    if (toFirst) {
       toFirst.onmousedown = function() {

            var timer = setInterval(function() {
                _.SetActiveAndShow(_.GetPreviousObjectId(), false);
            },  _.settings.arrowHoldInterval);

            toFirst.onmouseup = function() {
                clearInterval(timer);
            }
            toFirst.onmouseout = function() {
                clearInterval(timer);
            }
        }
    }


    if (toLast) {
        toLast.onmousedown = function() {

            var timer = setInterval(function() {
                _.SetActiveAndShow(_.GetNextObjectId(), false);
            },  _.settings.arrowHoldInterval);

            toLast.onmouseup = function() {
                clearInterval(timer);
            }
            toLast.onmouseout = function() {
                clearInterval(timer);
            }

        }
    }

}
/* END EVENTS */


//If the object is out of the view and it should be shown,
//This function will move the moving part with the needed amount so the object is shown
Lightsel.prototype.ShowObject = function(objIndex, showAsFirst) {

    var _ = this,
        elem = _.settings.lightsel,
        objects = _.settings.objects,
        movingWrapper = _.settings.lightsel.querySelector(".moving-wrapper"),
        moving = _.settings.lightsel.querySelector(".moving"),
        object = _.settings.objects[objIndex],

        movingWrapperRect = movingWrapper.getBoundingClientRect(),
        objectRect = object.getBoundingClientRect(),
        objectFirst,
        objectSecond,
        movingWFirst,
        movingWSecond;

    movingWrapperRect = movingWrapper.getBoundingClientRect(); // ie8 double-call
    objectRect = object.getBoundingClientRect(); // ie8 - double-call

    objectFirst  = objectRect.left;
    objectSecond = objectRect.right;

    movingWFirst  = movingWrapperRect.left;
    movingWSecond = movingWrapperRect.right;

    var nextPos = _.settings.currentRelativePosition; // in case no need for there is not need for showing

    if (objectFirst < movingWFirst) {
        nextPos = _.settings.currentRelativePosition + movingWFirst - objectFirst;
    }

    if (objectSecond > movingWSecond) {
        nextPos = _.settings.currentRelativePosition - (objectSecond - movingWSecond);
    }

    if (showAsFirst) {
        nextPos = movingWFirst - objectFirst;
    }


    if (_.settings.hasTransform) {
        _.ApplyCSS(moving, "transform", "translate3d(" + nextPos + "px, 0px, 0px)");
    }
    else {
        _.ApplyCSS(moving, "left", nextPos + "px");
    }

    if (_.settings.currentRelativePosition != nextPos) {
        _.GenEventAndDispatch("lightsel_moved", {
            lightselID: _.settings.id,
            moveAmount: Math.abs(_.settings.currentRelativePosition - nextPos)
        })
    }
    _.settings.currentRelativePosition = nextPos;

}


/* SETTERS */
//Sets the new object active and the previous one is not active anymore
//Active keyword in the class is reserved
Lightsel.prototype.SetActive = function(newActive) {
    var _ = this;
    newActive = parseInt(newActive);

    var oldObj = _.settings.objects[_.settings.currentActiveObject];
    oldObj.className = oldObj.className.replace(" active", "");

    var newObj = _.settings.objects[newActive];
    newObj.className = newObj.className.replace(" active", "");
    newObj.className += " active";

    _.settings.currentActiveObject = newActive;
}

//Combines TODO
//@ShowObject
//@SetActive
Lightsel.prototype.SetActiveAndShow = function(objId, showAsFirst) {
    var _ = this;
    _.SetActive(objId);
    _.ShowObject(objId, showAsFirst);
}

/* END SETTERS */



/* GETTERS */

//Returns the Id the of the object that is previous to the current one
Lightsel.prototype.GetPreviousObjectId = function() {
    var _ = this;
    var currentActive = _.settings.currentActiveObject;
    if (currentActive > 0) {
        return currentActive - 1;
    } else {
        return _.settings.totalObjects - 1;
    }
}

//Returns the Id the of the object that is next to the current one
Lightsel.prototype.GetNextObjectId = function() {
    var _ = this;
    var currentActive = _.settings.currentActiveObject;
    if (currentActive < _.settings.totalObjects - 1) {
        return currentActive + 1;
    } else {
        return 0;
    }
}
/* END GETTERS */


/*
Makes three copies of the initial array
COPYLEFT | MAIN | COPYRIGHT
copyFirst .. | realFSirst .. realLast | .. copyLast
when copyFirst or copyLast gets reached by the spin
the main moving part gets reseted to it's real copy,
this way, you can infinitely spin in the same direction
*/
Lightsel.prototype.InfiniteSpin = function() {
    var _ = this,
        moving = _.settings.moving,
        currArray = _.settings.objects,
        newArray  = [];


    for (var i = 0; i<currArray.length; i++) {
        var newNode = currArray[i].cloneNode(true);
        newNode.className = newNode.className.replace(" active", "");
        newArray.push(newNode);
    }
    _.settings.copyFirst = newArray[0]; // the first element in the array that
    // is a copy of the realFirst

    var showNode = null;

    for (var i = 0; i<currArray.length; i++) {
        var newNode = currArray[i].cloneNode(true);
        newNode.className = newNode.className.replace(" active", "");
        newArray.push(newNode);
        if (i == 0) {
            showNode = newArray.length - 1;
            _.settings.realFirst = newNode;
            _.settings.realFirstID = showNode;
        }
    }
    _.settings.realLast = newArray[newArray.length-1];
    _.settings.realLastID = newArray.length-1;

    for (var i = 0; i<currArray.length; i++) {
        var newNode = currArray[i].cloneNode(true);
        newNode.className = newNode.className.replace(" active", "");
        newArray.push(newNode);
    }
    _.settings.copyLast = newArray[newArray.length-1];

    while (moving.firstChild) {
        moving.removeChild(moving.firstChild);
    }

    for (var i = 0; i<newArray.length; i++) {
        _.settings.moving.appendChild(newArray[i]);
    }

    _.settings.objects = newArray;
    _.settings.totalObjects = newArray.length;
    _.settings.currentActiveObject = _.settings.realFirstID;
    _.ClickEvents();
    _.SetActiveAndShow(_.settings.realFirstID, true);

}

Lightsel.prototype.CopyElementsReached = function() {

    var _ = this,
        copyFirst = _.settings.copyFirst,
        copyLast  = _.settings.copyLast,
        first     = _.settings.realFisrt,
        last      = _.settings.realLast;

    var cfb       = copyFirst.getBoundingClientRect();
    cfb = copyFirst.getBoundingClientRect(); //ie8 double-call
    var crb       = copyLast.getBoundingClientRect();
    crb = copyLast.getBoundingClientRect(); //ie8 double-call
    var movingWRect = _.settings.movingWrapper.getBoundingClientRect();
    movingWRect =  _.settings.movingWrapper.getBoundingClientRect();  //ie8 double-call


    var copyFirstPos = cfb.left,
        copyLastPos  = crb.right,
        movingWRectPosFirst = movingWRect.left,
        movingWRectPosLast  = movingWRect.right;

    if (copyFirstPos > movingWRectPosFirst) {
        _.ShowObject(_.settings.realLastID, false);
        return true;
    }
    if (copyLastPos < movingWRectPosLast) {
        _.ShowObject(_.settings.realFirstID, false);
        return true;
    }
    return false;
}


//Moves the "moving" element of the structure.
//It goes to the left in the positive direction or in the negative,
//Respectively moving left and right
//It will fire the [lightsel_moved] event
Lightsel.prototype.TranslateMoving = function(diff) {
    var _ = this;

    var moving = _.settings.moving;
    var movingWrapper = _.settings.movingWrapper;
    var elem = _.settings.lightsel;

    if (_.settings.infiniteSpin && _.CopyElementsReached()) {
        return true;
    }

    if (_.CheckInterval(diff)) {
        _.GenEventAndDispatch("lightsel_moved", {
            lightselID: elem.id,
            moveAmount: diff,
        });


        //If horizontal, move left,
        //If vertical, move top
        _.settings.currentRelativePosition += diff;
        if (_.settings.hasTransform) {
            _.ApplyCSS(moving, "transform", "translate3d("+ _.settings.currentRelativePosition +"px, 0px, 0px)");
        } else {
            _.ApplyCSS(moving, "left", _.settings.currentRelativePosition + "px");
        }
    }
}

//Adds inertion moving after the spin
Lightsel.prototype.SpinInertion = function(lastDiff) {
    var _ = this;
    var diff = (lastDiff < 0) ? -(_.settings.inertionStartSpeed) : _.settings.inertionStartSpeed;

    var timer = setInterval(function() {
        _.TranslateMoving(diff);

        if (diff == 0) {
            clearInterval(timer);
        } else {
            diff += (diff > 0) ? -1 : +1;
        }
    }, 20);

}

//Checks is the moving part is actually movable
Lightsel.prototype.CheckInterval = function(diff) {
    var _ = this;

    var movingWrapper = _.settings.movingWrapper;
    var moving = _.settings.moving;

    var objectDimension = moving.querySelector(".object").offsetWidth;

    var mFirst = moving.getBoundingClientRect().left;

    var mLast  = moving.getBoundingClientRect().right;

    var wFirst = movingWrapper.getBoundingClientRect().left;

    var wLast  = movingWrapper.getBoundingClientRect().right;
    // ie8 double-calls
    mFirst = moving.getBoundingClientRect().left;

    mLast  = moving.getBoundingClientRect().right;

    wFirst = movingWrapper.getBoundingClientRect().left;

    wLast  = movingWrapper.getBoundingClientRect().right;

    //If the drag or touch direction was to the first element (negative)
    //Or to the last element (positive)

    var toFirst = (diff > 0);
    var toLast = !toFirst;

    //It worn't go further than first element and further than the last one
    //If moving toLast
    var response = (toLast && mLast + diff > wFirst) && (mLast - objectDimension > wFirst);
    //If moving toFirst
    response |= (toFirst && mFirst + diff < wLast) && (mFirst + objectDimension < wLast);

    //If the moving part fits totally in the wrapper, it will not move
    //Unless the spinOnLessObjects is set to true
    if (_.settings.spinOnLessObjects == false
       && (mFirst > wFirst && mLast < wLast)) {
        response = false;
    }

    return response;

}

Lightsel.prototype.FillWithCopies = function() {


    var _ = this,
        newObjectArray = [];

    var movingWRect = _.settings.movingWrapper.getBoundingClientRect();
    movingWRect = _.settings.movingWrapper.getBoundingClientRect(); // Ie8 double-call

    _.settings.filledWithCopies = true;


    for (var i = 0; i<_.settings.objects.length; i++) {
        var object = _.settings.objects[i];
        newObjectArray.push(object);
    }


    var currentIndex = 0;
    while(true) {

        var lastObject = newObjectArray[newObjectArray.length-1];

        var lastObjectRect = lastObject.getBoundingClientRect();
        lastObjectRect = lastObject.getBoundingClientRect(); // Ie8 double-call

        var lastParam = lastObjectRect.right
        var movingWParam = movingWRect.right;



        if (lastParam < movingWParam) {

            var newNode = _.GetCopy(_.settings.objects[currentIndex]);
            newNode.className = newNode.className.replace(" active", "");
            newObjectArray.push(newNode);
            _.settings.moving.appendChild(newNode);
            currentIndex++;
            if (currentIndex == _.settings.objects.length) {
                currentIndex = 0;
            }

        } else {
            break;
        }
    }

    while (currentIndex < _.settings.objects.length) {
        var newNode = _.GetCopy(_.settings.objects[currentIndex]);
        newNode.className = newNode.className.replace(" active", "");
        newObjectArray.push(newNode);
        _.settings.moving.appendChild(newNode);
        currentIndex++;
    }
    _.settings.objects = newObjectArray;
}


//Accepts as keys only transform, left, right
Lightsel.prototype.ApplyCSS = function(element, key, value) {

    if (key == "transform") {
        element.style.WebkitTransform = value;
        element.style.MozTransform = value;
        element.style.msTransform = value;
        element.style.OTransform = value;
        element.style.transform = value;
    }
    else if (key === "left") {
        element.style.WebkitLeft = value;
        element.style.MozLeft = value;
        element.style.msLeft = value;
        element.style.OLeft = value;
        element.style.left = value;
    }
}

Lightsel.prototype.DetectCSSFeature = function(featurename){
    var feature = false,
    domPrefixes = 'Webkit Moz ms O'.split(' '),
    elm = document.createElement('div'),
    featurenameCapital = null;

    featurename = featurename.toLowerCase();

    if( elm.style[featurename] !== undefined ) { feature = true; }

    if( feature === false ) {
        featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
        for( var i = 0; i < domPrefixes.length; i++ ) {
            if( elm.style[domPrefixes[i] + featurenameCapital ] !== undefined ) {
              feature = true;
              break;
            }
        }
    }
    return feature;
}

//For IE8
// source: https://learn.javascript.ru/fixevent
Lightsel.prototype.FixEvent = function(e) {

   e.currentTarget = this;
   e.target = e.srcElement;

   if (e.type == 'mouseover' || e.type == 'mouseenter') e.relatedTarget = e.fromElement;
   if (e.type == 'mouseout' || e.type == 'mouseleave') e.relatedTarget = e.toElement;

   if (e.pageX == null && e.clientX != null) {
       var html = document.documentElement;
       var body = document.body;

       e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
       e.pageX -= html.clientLeft || 0;

       e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
       e.pageY -= html.clientTop || 0;
   }

   if (!e.which && e.button) {
       e.which = e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0));
   }

   return e;
}


Lightsel.prototype.GetCopy = function(node) {

    var newNode = node.cloneNode(true);
    newNode.className =  newNode.className.replace(" active", "");
    return newNode;
}


//PUBLIC API

Lightsel.prototype.next = function(callback, showAsFirst) {
    this.SetActiveAndShow(this.GetNextObjectId(), showAsFirst);

    if (typeof callback !== 'undefined') {
       callback();
    }
}

Lightsel.prototype.previous = function(callback, showAsFirst) {
    this.SetActiveAndShow(this.GetPreviousObjectId(), showAsFirst);

    if (typeof callback !== 'undefined') {
       callback();
    }
}

Lightsel.prototype.setObjectActive = function(callback, newActiveID) {
    this.SetActive(newActiveID);

    if (typeof callback !== 'undefined') {
       callback();
    }
}

Lightsel.prototype.getCurrentActiveObject = function(callback) {

    if (typeof callback !== 'undefined') {
       callback(this.settings.currentActiveObject);
    }
}


Lightsel.prototype.showObject = function(callback, objectID, showAsFirst) {
    showObject(objId, showAsFirst);

    if (typeof callback !== 'undefined') {
       callback();
    }
}

Lightsel.prototype.getObjects = function(callback) {
    if (typeof callback !== 'undefined') {
       callback(this.settings.objects);
    }
}



