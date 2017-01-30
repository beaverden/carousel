'use strict';
//TODO
// Remove click after drag
// Add object
// Remove object
// Infinite scroll
// Autoscroll delay

//Firing events:
//objectClicked -> detail,carouselId, detail.objectId
//carouselDragStart -> detail.carouselId
//carouselDragEnd -> detail.carouselId
//carouselDragged -> detail.carouselId, detail.dragAmount
//carouselMoved -> detail.carouselId, detail.moveAmount

/* Notes
    element.children in IE8 returns comment nodes
*/
var Carousel = window.Carousel || {};


Carousel = (function() {
    function Carousel(import_settings) {
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
            //If the carousel scroll automatically
            autoscroll: false,
            autoscroll_interval: 3000,

            //If there are not enough objects to fill the container, it will create copies of it
            fillWithCopies: true,
            filledWithCopies: false,

            //If the user is allowed to spin the carousel if the objects fill entirely
            //in the container and don't overflow
            spinOnLessObjects: true,

            id: "carousel1",

            //The amount of time that is passed to the
            //SetInterval function that changes object every iteration
            //When the arrow button is holded (mouse pressed)
            arrowHoldChangeObjectInterval: 100,



            //Turn on or off events
            //If the browser doesn't support events, an console error log will be written
            events: true,

            //Global objects
            carousel: null,
            movingWrapper: null,
            moving: null,
            objects: null,
            toFirst: null,
            toLast: null,

            //The decaying of the inertion after a drag
            inertionStartSpeed: 20,

            //local
            totalObjects: 0,
            previousActiveObject: -1,
            currentActiveObject: 0,
            currentRelativePosition: 0,

            hasTransform: true,
        };

        //Override the current this.settings
        for (var key in import_settings) {
            this.settings[key] = import_settings[key];
        }


        var _ = this;

        _.init();

        //PUBLIC API
            /*
        this.next = function(callback) {
            setActiveAndShow(_.settings.mainElement, getNextObjectId());

            if (typeof callback !== 'undefined') {
               callback();
            }
        }

        this.previous = function(callback) {
            setActiveAndShow(_.settings.mainElement, getPreviousObjectId());

            if (typeof callback !== 'undefined') {
               callback();
            }
        }

        this.setActiveObject = function(newActive, callback) {
            setActive(_.settings.mainElement, newActive);

            if (typeof callback !== 'undefined') {
               callback();
            }
        }

        this.getCurrentActiveObject = function() {
            return _.settings.currentActiveObject;
        }

        this.showObject = function(objId, callback) {
            showObject(_.settings.mainElement, objId);

            if (typeof callback !== 'undefined') {
               callback();
            }
        }


        this.addObject = function(object, place, callback) {

            var main = _.settings.mainElement;
            var moving = main.querySelector(".moving");


            if (typeof callback !== 'undefined') {
               callback();
            }
        }
        */
    }

    return Carousel;

}());


Carousel.prototype.init = function() {
    var _ = this;

     //Main container
    _.settings.carousel = document.getElementById(_.settings.id);

    _.settings.movingWrapper = _.settings.carousel.querySelector(".moving-wrapper");
    _.settings.moving = _.settings.carousel.querySelector(".moving");
    _.settings.objects = _.settings.carousel.querySelectorAll(".object");


    //Total number of objects
    _.settings.totalObjects = _.settings.movingWrapper.children.length;

    //Arrows
    _.settings.toFirst = _.settings.carousel.querySelector(".carousel-left");
    _.settings.toLast = _.settings.carousel.querySelector(".carousel-right");

    var elem = _.settings.carousel;

    if (elem === 'undefined') {
        console.log("Wrong carousel id");
    }

    if (_.settings.events == false) {
        console.log("Lightrousel: Events turned off");
    }

    if (_.settings.fillWithCopies) {
        _.fillWithCopies();
    }

    _.settings.hasTransform = _.detectCSSFeature("transform");

    _.settings.totalObjects = _.settings.objects.length;

    if (_.settings.infiniteSpin) {
        if (!_.settings.filledWithCopies) {
            _.fillWithCopies();
        }
        _.infiniteSpin();
    }

    //Add click events to objects
    _.clickEvents();

    _.dragEvents();

    _.clickEventsArrows();

    _.holdArrowsEvents();

    _.keyBoardArrowsEvent();


}

//Add listener


/* EVENTS */
//Generate custom events
//As well as dispatches them
Carousel.prototype.genEventAndDispatch = function(name, detail) {
    var _ = this;

    if (_.settings.events) {
        if (typeof CustomEvent === "function") {
            var e = new CustomEvent(name, {
                detail : detail,
                bubbles: true,
                cancelable: true,
            });
            _.settings.carousel.dispatchEvent(e);
        }
    }
}

//Adds click events to the objects of the carousel
//Clicking them will also generate an event [objectClicked]
Carousel.prototype.clickEvents = function() {
    var _ = this;
    var clickAction = function(event) {
        var object = event.srcElement ? event.srcElement : event.target;

        _.genEventAndDispatch("objectClicked", {
                carouselId: _.settings.id,
                objectId: object.getAttribute("data-id"),
        });
        var newCurrent = parseInt(object.getAttribute("data-id"));
        _.setActive(newCurrent);
    }

    for (var i = 0; i<_.settings.objects.length; i++) {
        var obj = _.settings.objects[i];
        obj.setAttribute("data-id", i);

        if (obj.addEventListener) {
            obj.addEventListener("click", clickAction);
        } else {
            obj.attachEvent("onclick", clickAction);
        }

    }
}

//Adds drag functionality to the carousel
//Drag start will fire and even [carouselDragStart]
//Dragging will fire the event [carouselDragged]
//End of dragging will fire [carouselDragEnd]
Carousel.prototype.dragEvents = function() {
    var _ = this;
    var elem = _.settings.carousel;
    var moving = _.settings.moving;
    var movingWrapper = _.settings.movingWrapper;
    var lastDiff = 0;

    /**** DRAG ****/
    moving.onclick = function(event) {
        return false;
    }

    moving.onmousedown = function(event) {

        if (!event) event = window.event;

        _.genEventAndDispatch("carouselDragStart", {
                carouselId: elem.id
        });

        var currPos = event.clientX;

        document.onmousemove = function(event) {
            if (!event) event = window.event;

            (event.preventDefault) ? event.preventDefault() : (event.returnValue = false);

            var eventPos = event.clientX;

            var diff = eventPos - currPos;
            currPos = eventPos;
            lastDiff = diff;

            _.genEventAndDispatch("carouselDragged", {
                carouselId: _.settings.carousel.id,
                dragAmout: diff,
            });

            _.translateMoving(diff);
        }

        document.onmouseup = function(event) {
            if (!event) event = window.event;

            document.onmousemove = null;
            document.onmouseup = null;

            //Fire dragEnd event
            _.genEventAndDispatch("carouselDragEnd", {
                carouselId: _.settings.carousel.id
            });

            if (Math.abs(lastDiff) > 3) {
                _.spinInertion(lastDiff);
            }
            lastDiff = 0;

            event.preventDefault ? event.preventDefault() : (event.returnValue = false);
            event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
        }

    }
    /**** /.DRAG ****/
};


//Left and right keyboard arrows will do the same
//What left and right interface arrows do
Carousel.prototype.keyBoardArrowsEvent = function() {
    var _ = this;

    _.settings.carousel.onkeydown = function(e) {
        var key = e.which || e.keyCode;

        if ( key == 37) {
            _.setActiveAndShow(_.getPreviousObjectId(), false);
        } else if (key == 39) {
            _.setActiveAndShow(_.getNextObjectId(), false);
        }
    }
}

//  Adds click events on left and right arrows
//  tofirst - the arrow that moves the carousel to the first item
//  tolast - the arrow that moves the carousel to the last item
Carousel.prototype.clickEventsArrows = function() {
    var _ = this,
        toFirst = _.settings.toFirst,
        toLast  = _.settings.toLast;


    if (toFirst.addEventListener) {

        toFirst.addEventListener("click", function() {
            _.setActiveAndShow(_.getPreviousObjectId(), false);
        });

        toLast.addEventListener("click", function() {
            _.setActiveAndShow(_.getNextObjectId(), false);
        });

    } else {

        toFirst.attachEvent("onclick", function() {
            _.setActiveAndShow(_.getPreviousObjectId(), false);
        });

        toLast.attachEvent("onclick", function() {
            _.setActiveAndShow(_.getNextObjectId(), false);
        });
    }
}

//Events of holding the mouse on the left and right arrows
Carousel.prototype.holdArrowsEvents = function() {
    var _ = this,
        toFirst = _.settings.toFirst,
        toLast  = _.settings.toLast;

    toFirst.onmousedown = function() {

        var timer = setInterval(function() {
            _.setActiveAndShow(_.getPreviousObjectId(), false);
        },  _.settings.arrowHoldChangeObjectInterval);

        toFirst.onmouseup = function() {
            clearInterval(timer);
        }
        toFirst.onmouseout = function() {
            clearInterval(timer);
        }
    }

    toLast.onmousedown = function() {

        var timer = setInterval(function() {
            _.setActiveAndShow(_.getNextObjectId(), false);
        },  _.settings.arrowHoldChangeObjectInterval);

        toLast.onmouseup = function() {
            clearInterval(timer);
        }
        toLast.onmouseout = function() {
            clearInterval(timer);
        }

    }
}
/* END EVENTS */


//If the object is out of the view and it should be shown,
//This function will move the moving part with the needed amount so the object is shown
Carousel.prototype.showObject = function(objIndex, showAsFirst) {

    var _ = this,
        elem = _.settings.carousel,
        objects = _.settings.objects,
        movingWrapper = _.settings.carousel.querySelector(".moving-wrapper"),
        moving = _.settings.carousel.querySelector(".moving"),
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
        _.applyCSS(moving, "transform", "translate3d(" + nextPos + "px, 0px, 0px)");
    }
    else {
        _.applyCSS(moving, "left", nextPos + "px");
    }

    _.settings.currentRelativePosition = nextPos;


}


/* SETTERS */
//Sets the new object active and the previous one is not active anymore
//Active keyword in the class is reserved
Carousel.prototype.setActive = function(newActive) {
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
//@showObject
//@setActive
Carousel.prototype.setActiveAndShow = function(objId, showAsFirst) {
    var _ = this;
    _.setActive(objId);
    _.showObject(objId, showAsFirst);
}

/* END SETTERS */



/* GETTERS */

//Returns the Id the of the object that is previous to the current one
Carousel.prototype.getPreviousObjectId = function() {
    var _ = this;
    var currentActive = _.settings.currentActiveObject;
    if (currentActive > 0) {
        return currentActive - 1;
    } else {
        return _.settings.totalObjects - 1;
    }
}

//Returns the Id the of the object that is next to the current one
Carousel.prototype.getNextObjectId = function() {
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
copyFirst .. | realFirst .. realLast | .. copyLast
when copyFirst or copyLast gets reached by the spin
the main moving part gets reseted to it's real copy,
this way, you can infinitely spin in the same direction
*/
Carousel.prototype.infiniteSpin = function() {
    var _ = this,
        moving = _.settings.moving,
        currArray = _.settings.objects,
        newArray  = [];


    for (var i = 0; i<currArray.length; i++) {
        var newNode = currArray[i].cloneNode(true);
        newArray.push(newNode);
    }
    _.settings.copyFirst = newArray[0]; // the first element in the array that
    // is a copy of the realFirst

    var showNode = null;

    for (var i = 0; i<currArray.length; i++) {
        var newNode = currArray[i].cloneNode(true);
        newNode.className = newNode.className.replace(" active","");
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
    _.clickEvents();
    _.setActiveAndShow(_.settings.realFirstID, true);

}

Carousel.prototype.copyElementsReached = function() {

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
        _.showObject(_.settings.realLastID, false);
        return true;
    }
    if (copyLastPos < movingWRectPosLast) {
        _.showObject(_.settings.realFirstID, false);
        return true;
    }
    return false;
}


//Moves the "moving" element of the structure.
//It goes to the left in the positive direction or in the negative,
//Respectively moving left and right
//It will fire the [carouselMoved] event
Carousel.prototype.translateMoving = function(diff) {
    var _ = this;

    var moving = _.settings.moving;
    var movingWrapper = _.settings.movingWrapper;
    var elem = _.settings.carousel;

    if (_.settings.infiniteSpin && _.copyElementsReached()) {
        return true;
    }

    if (_.checkInterval(diff)) {
        _.genEventAndDispatch("carouselMoved", {
            carouselId: elem.id,
            moveAmount: diff,
        });


        //If horizontal, move left,
        //If vertical, move top
        _.settings.currentRelativePosition += diff;
        if (_.settings.hasTransform) {
            _.applyCSS(moving, "transform", "translate3d("+ _.settings.currentRelativePosition +"px, 0px, 0px)");
        } else {
            _.applyCSS(moving, "left", _.settings.currentRelativePosition + "px");
        }
    }
}

//Adds inertion moving after the spin
Carousel.prototype.spinInertion = function(lastDiff) {
    var _ = this;
    var diff = (lastDiff < 0) ? -(_.settings.inertionStartSpeed) : _.settings.inertionStartSpeed;

    var timer = setInterval(function() {
        _.translateMoving(diff);

        if (diff == 0) {
            clearInterval(timer);
        } else {
            diff += (diff > 0) ? -1 : +1;
        }
    }, 20);

}

//Checks is the moving part is actually movable
Carousel.prototype.checkInterval = function(diff) {
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

Carousel.prototype.fillWithCopies = function() {


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

            var newNode = _.getCopy(_.settings.objects[currentIndex]);

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
        var newNode = _.getCopy(_.settings.objects[currentIndex]);

        newObjectArray.push(newNode);
        _.settings.moving.appendChild(newNode);
        currentIndex++;
    }
    _.settings.objects = newObjectArray;
}


//Accepts as keys only transform, left, right
Carousel.prototype.applyCSS = function(element, key, value) {

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

Carousel.prototype.detectCSSFeature = function(featurename){
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

Carousel.prototype.getCopy = function(node) {

    var newNode = node.cloneNode(true);
    newNode.className =  newNode.className.replace(" active", "");
    return newNode;
}






