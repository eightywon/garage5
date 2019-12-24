var theInterval;
var theProgress=0;
var updateGarageStatus;
var prefix;
var ticks;

(function () {
	ticks=0;
	setInterval(updateHeartbeat,5000);
	
	getGarageStatus();
	
	function onScreenStateChanged(previousState, changedState) {
		console.log('Screen state changed from' + previousState + 'to' + changedState);
		
		//here I would use tizen.power.turnScreenOn():
		//tizen.power.request("SCREEN", "SCREEN_NORMAL");
		if (changedState=="SCREEN_NORMAL") {
			var app = tizen.application.getCurrentApplication();
			//app is launched just in case it is currently in background
			tizen.application.launch(app.appInfo.id, launchSuccess);
			function launchSuccess() {
				console.log("app launched");
			}
		}
	}
	tizen.power.setScreenStateChangeListener(onScreenStateChanged);
	
	window.addEventListener("tizenhwkey", function (ev) {
		var activePopup = null,
			page = null,
			pageId = "";

		if (ev.keyName === "back") {
			activePopup = document.querySelector(".ui-popup-active");
			page = document.getElementsByClassName("ui-page-active")[0];
			pageId = page ? page.id : "";

			if (pageId === "main" && !activePopup) {
				try {
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}
	});
	
	window.addEventListener("visibilitychange", function() {
	    console.log("visibilitychange");
	    if (document.hidden) {
	    	//pageHideHandler();
	        console.log('document hidden');
	    } else  {
	    	getGarageStatus();
	    	//pageBeforeShowHandler();
	        console.log('document visible');
	    }
	}, false);
	
    var page=document.getElementById('main'),
             progressBar=document.getElementById('circleprogress'),
             isCircle = tau.support.shape.circle,
             progressBarWidget;

    function unbindEvents() {
    	page.removeEventListener('pageshow', pageBeforeShowHandler);
    	page.removeEventListener('pagehide', pageHideHandler);
    	if (isCircle) {
    		clearInterval(theInterval);
    		clearInterval(updateGarageStatus);
    	}
    }

    function pageBeforeShowHandler() {
    	if (isCircle) {
    		document.getElementById("toggleGarage").addEventListener('click', toggleGarage);
    	} else {
    		progressBarWidget = new tau.widget.CircleProgressBar(progressBar, {size: 'large'});
    	}
    }

    function toggleGarage() {
    	var text=document.getElementById("toggleGarage").textContent;
    	if (text.search("Opening")!==-1 || text.search("Closing")!==-1) {
    		console.log("returning false");
    		return false;
    	}
    	if (document.getElementById("toggleGarage").textContent==="Open Door") {
    		document.getElementById("toggleGarage").textContent="Opening";
    		prefix="Opening";
    	} else {
    		document.getElementById("toggleGarage").textContent="Closing";
    		prefix="Closing";
    	}
    	var client = new XMLHttpRequest();
    	client.open('POST','http://garage/index.php',true);
    	client.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
    	client.send('p1=clicked');
    	client.onreadystatechange = function() {
    		if (client.readyState === XMLHttpRequest.DONE) {
    			//document.getElementById("result").textContent=client.responseText;
    		}
    	};
	
    	updateGarageStatus=setInterval(getGarageStatus,15000);
	   
    	/* Make the circular progressbar object */
    	progressBarWidget = new tau.widget.CircleProgressBar(progressBar, {size: 'full'});
    	progressBarWidget.value(0);
    	theProgress=0;
		theInterval=setInterval(updateProgress,100);	
    }

    function updateProgress() {
    	theProgress++;
    	if (theProgress>150) {
    		pageHideHandler();
    		theProgress=0;
    	} else {
    		if (theProgress%5==0) {
    			var str=document.getElementById("toggleGarage").textContent;
    			if (str.indexOf("...")>-1) {
    				document.getElementById("toggleGarage").textContent=prefix;
    			} else if (str.indexOf("..")>-1) {
    				document.getElementById("toggleGarage").textContent=prefix+"...";
    			} else if (str.indexOf(".")>-1) {
    				document.getElementById("toggleGarage").textContent=prefix+"..";
    			} else {
    				document.getElementById("toggleGarage").textContent=prefix+".";
    			}
    		}
    		progressBarWidget.value(theProgress);
    	}
    }

    function pageHideHandler() {
    	unbindEvents();
    	/* Release the object */
    	if (progressBarWidget) {
    		progressBarWidget.destroy();	
    	}
    }

    page.addEventListener('pagebeforeshow', pageBeforeShowHandler);
    page.addEventListener('pagehide', pageHideHandler);
}());

function getGarageStatus() {
	console.log("getting garage status");
	document.getElementById("result").textContent="getting status";
	var client = new XMLHttpRequest();
	client.open('POST','http://garage/query.php');
	client.onreadystatechange = function() {
	    if (client.readyState === XMLHttpRequest.DONE) {
	    	console.log("got status");
	    	document.getElementById("result").textContent="ok";
	    	if (client.responseText==="CLOSED") {
	    		document.getElementById("toggleGarage").disabled=false;
	    		document.getElementById("toggleGarage").textContent="Open Door";	
	    	} else if (client.responseText==="OPEN") {
	    		document.getElementById("toggleGarage").disabled=false;
	    		document.getElementById("toggleGarage").textContent="Close Door";
	    	} //do we need an else here to handle a default case?
	    	clearInterval(updateGarageStatus);
	    }
	};
	client.onerror = function() {
		console.log("err");
		document.getElementById("toggleGarage").disabled=true;
		document.getElementById("toggleGarage").textContent="";
		document.getElementById("result").textContent="Connection Failed";
	};
	
	client.send();
  }

function updateHeartbeat() {
	ticks=ticks+5;
	console.log(ticks);
}