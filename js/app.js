function turnON(id) {
    var object = document.getElementById(id);
    object.style.backgroundColor = "rgba(204,0,0, 0.8)";
    object.style.color = "#fff";
}

function turnOFF(id) {
    var object = document.getElementById(id);
    object.style.backgroundColor = "#fff";
    object.style.color = "#000";
}

var activeMovedTimeout = false;

document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("lightsel_objectClicked", function(e) {

        turnON("object_clicked");
        setTimeout(function(){
            turnOFF("object_clicked");
        }, 400);
    });

    document.addEventListener("lightsel_dragStart", function(e) {
        turnON("drag_start");
        setTimeout(function(){
            turnOFF("drag_start");
        }, 400);
        turnOFF("drag_end");
    });

    document.addEventListener("lightsel_dragEnd", function(e) {
        turnON("drag_end");
        setTimeout(function() {
            turnOFF("drag_end");
        }, 400);

        turnOFF("drag_start");
        turnOFF("dragged");
    });

    document.addEventListener("lightsel_dragged", function(e) {
        turnON("dragged");
        turnOFF("drag_end");
        turnON("moved");
        if (!activeMovedTimeout) {
            activeMovedTimeout = true;
            setTimeout(function() {
                turnOFF("moved");
                activeMovedTimeout = false;
                clearTimeout(this);
            }, 500);
        }

    });

    document.addEventListener("lightsel_moved", function(e) {
        turnON("moved");
        if (!activeMovedTimeout) {
            activeMovedTimeout = true;
            setTimeout(function() {
                turnOFF("moved");
                activeMovedTimeout = false;
                clearTimeout(this);
            }, 500);
        }
    });

    document.addEventListener("lightsel_swipeStart", function(e) {
        turnON("swipe_start");
        setTimeout(function() {
            turnOFF("swipe_start");
            clearTimeout(this);
        }, 500);
    });

    document.addEventListener("lightsel_swipeEnd", function(e) {
        turnON("swipe_end");
        setTimeout(function() {
            turnOFF("swipe_end");
            clearTimeout(this);
        }, 500);
    });

    document.addEventListener("lightsel_swiped", function(e) {
        turnON("swiped");
        setTimeout(function() {
            turnOFF("swiped");
            clearTimeout(this);
        }, 500);
    });
});



function start() {
    this.num = 0;
    this.output = function() {
        console.log(this.num);
    }
    this.change = function() {
        this.num++;
    }
}



