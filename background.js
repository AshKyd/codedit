chrome.app.runtime.onLaunched.addListener(function(launchData) {
	chrome.app.window.create('index.html', {},function(win){
		win.contentWindow.launchData = launchData;
	});
});
