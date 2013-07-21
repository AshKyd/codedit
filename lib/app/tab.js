var Tab = function(opts){
	console.log('setting up new tab');
	var _this = this;
	
	this.tabId = opts.tabId;
	
	// Set DOM elements
	this.ele = opts.ele;
	this.parentEle = opts.parentEle;
	this.tabEle = opts.tabEle;
	
	// Load editor
	this.editor = ace.edit(this.ele);
    this.editor.setTheme("ace/theme/monokai");
    
    this.editor.commands.addCommand({
		name: 'saveFile',
		bindKey: {
			win: 'Ctrl-S',
			mac: 'Command-S',
			sender: 'editor|cli'
		},
		exec: function(env, args, request) {
			console.log('saving file');
			if(_this.file){
				_this.file.save({val:_this.editor.getValue()});
			}
		}
	});
	
	for(var i=0; i<opts.keybindings.length; i++){
		this.editor.commands.addCommand(opts.keybindings[i]);
	}
    
    if(opts.content){
		this.loadText(opts.content);
	}
	
	if(opts.file){
		this.setFile(opts.file);
	}
    
}

Tab.prototype = {
	setupTab : function(){
		
	},
	loadText : function(text){
		this.editor.session.setValue(text);
		this.editor.gotoLine(0); //Go to end of document
	},
	setFile : function(file){
		var _this = this;
		this.file = file;
		this.file.load({
			complete : function(text){
				_this.tabEle.innerHTML = _this.file.fileEntry.name;
				_this.loadText(text);
			}
		});
	}
}

module.exports = Tab;
