window.onload = function(){
	var Pane = require('./pane.js');
	var FileReaderChrome = require('./filereaderchrome.js');

	var pane1 = new Pane({
		ele : document.getElementById('editor')
	});
	
	
	var body = document.getElementsByTagName('body')[0];

	/**
	 * Set drag & drop handlers.
	 */
	body.ondragover = function () { this.className = 'hover'; return false; };
	body.ondragend = function () { this.className = ''; return false; };
	body.ondrop = function (e) {
		var _this = this;
		e.preventDefault();
		var files = e.dataTransfer.items;
		console.log(files);
		
		for(var i=0; i<files.length; i++){
			var dtItem = files[i];
			
			pane1.newTab({
				file:new FileReaderChrome(dtItem)
			});
		}
		return false;
	};

}
