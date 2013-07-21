;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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

},{"./pane.js":2,"./filereaderchrome.js":3}],3:[function(require,module,exports){
function FileReaderChrome(file){
	if(file){
		this.name = file.getAsFile().name;
		this.setFile(file);
	}
}
FileReaderChrome.prototype = {
	setFile : function(file){
		this.setFileEntry(file.webkitGetAsEntry());
	},
	setFileEntry : function(fileEntry){
		this.fileEntry = fileEntry;
	},
	loadFromDialog : function(opts){
		var _this = this;
		try{
			chrome.fileSystem.chooseEntry({type:'openFile'},function(readOnlyEntry){
				_this.setFileEntry(readOnlyEntry);
				opts.complete(this);
			});
		} catch (e) {
			opts.complete(false);
		}
	},
	
	load : function(opts){
		this.fileEntry.file(function(file){
			var reader = new FileReader();
			reader.onerror = function(){
				throw "Couldn't read file."
			};
			reader.onloadend = function(e){
				opts.complete(e.target.result);
			};
			reader.readAsText(file);
		});
	},
	
	save : function(opts){
		var _this = this;
		chrome.fileSystem.getWritableEntry(this.fileEntry,function(writableFileEntry){
			writableFileEntry.createWriter(function(writer) {
				writer.onerror = function(){
					throw "Couldn't write file.";
				};
				writer.onwriteend = function(){
					opts.complete();
				};

				var blob = new Blob([opts.val],{type: 'text/plain'});
				
				writer.truncate(blob.size);
				_this.waitForIO(writer,function(){
					writer.seek(0);
					writer.write(blob);
				});

				//~ this.fileEntry.file(function(file) {
					//~ writer.write(file);
				//~ });   
			},function(){
				throw "couldn't write file."
			});
		});
	},
	waitForIO : function(writer, callback) {
		// set a watchdog to avoid eventual locking:
		var start = Date.now();
		// wait for a few seconds
		var reentrant = function() {
			if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
				setTimeout(reentrant, 100);
				return;
			}
			if (writer.readyState===writer.WRITING) {
				console.error("Write operation taking too long, aborting!"+
				" (current writer readyState is "+writer.readyState+")");
				writer.abort();
			} else {
				callback();
			}
		};
		setTimeout(reentrant, 100);
	}
}

module.exports = FileReaderChrome;

},{}],2:[function(require,module,exports){
var crel = require("../crel.js");
var Tab = require("./tab.js");
var FileReaderChrome = require('./filereaderchrome.js');

var Pane = function(opts){
	this.tabIds = 0;
	this.tabs = opts.tabs || {};
	this.tabsIndexed = [];
	this.currentTab = false;
	
	this.ele = opts.ele;
	
	this.createTabBar();

	this.newTab({});

}

Pane.prototype = {
	
	newTab : function(opts){
		
		var tab;
		if( typeof this.tabsIndexed[this.currentTab] == 'undefined' || this.tabsIndexed[this.currentTab].file){
			tab = this.buildTab(opts);
		} else {
			tab =  this.tabsIndexed[this.currentTab];
			tab.setFile(opts.file);
		}
		
		this.showTab(tab.tabId);
		return tab;
	},
	
	buildTab : function(opts){
		var _this = this;
		opts.tabId = this.tabIds++;
		
		opts.tabEle = crel('div',{'data-id':opts.tabId},opts.name||'Untitled');
		
		opts.parentEle = crel('div',{class:'tab'});
	
		opts.ele = crel('div', {class:'editor'});
		
		opts.parentEle.appendChild(opts.ele);
		this.tabBarEle.appendChild(opts.tabEle);
		this.ele.appendChild(opts.parentEle);
		
		opts.keybindings = [
			{
				name: 'previousTab',
				bindKey: {
					win: 'Ctrl-pageup',
					mac: 'Command-pageup',
					sender: 'editor|cli'
				},
				exec: function(env, args, request) {
					_this.prevTab();
				}
			},
			{
				name: 'nextTab',
				bindKey: {
					win: 'Ctrl-pagedown',
					mac: 'Command-pagedown',
					sender: 'editor|cli'
				},
				exec: function(env, args, request) {
					_this.nextTab();
				}
			},
			{
				name: 'openDocument',
				bindKey: {
					win: 'Ctrl-o',
					mac: 'Command-o',
					sender: 'editor|cli'
				},
				exec: function(env, args, request) {
					_this.openFile();
				}
			},
			{
				name: 'closeTab',
				bindKey: {
					win: 'Ctrl-w',
					mac: 'Command-w',
					sender: 'editor|cli'
				},
				exec: function(env, args, request) {
					_this.closeTab(_this.currentTab);
				}
			}
		];
		
		var tab = new Tab(opts);
		this.tabs['t'+opts.tabId] = tab;
		this.tabsIndexed.push(tab);
		return tab;
	},
	
	openFile : function(){
		var _this = this;
		var fileReader = new FileReaderChrome();
		fileReader.loadFromDialog({
			complete : function(hasCompleted){
				if(!hasCompleted){
					return;
				}
				_this.newTab({file:fileReader});
			}
		});
	},
	
	closeTab : function(id){
		var tab = this.tabs['t'+id];
		
		if(!tab){
			return;
		}
		
		tab.ele.parentNode.removeChild(tab.ele);
		tab.tabEle.parentNode.removeChild(tab.tabEle);
		delete this.tabs['t'+id];
		this.tabsIndexed.splice(id,1);
		
		// Show the previous tab, or create an empty one.
		if(id > 0){
			this.showTab(id-1);
		} else {
			this.newTab({});
		}
	},
	
	createTabBar : function(){
		var _this = this;
		this.tabBarEle = crel('div', {class:'tab-bar'});
		this.ele.appendChild(this.tabBarEle);
		
		this.tabBarEle.onclick = function(e){
			var tabId = e.target.getAttribute('data-id');
			if(tabId){
				_this.showTab(tabId);
			}
		};
		
	},
	
	prevTab : function(){
		this.showTab(this.getTab(this.currentTab,'previous').tabId);
	},
	
	nextTab : function(){
		this.showTab(this.getTab(this.currentTab,'next').tabId);
	},
	
	showTab : function(id){
		if(isNaN(id)){
			return;
		}
		var className = 'visible';
		var focusedTab = false;
		for(var tabId in this.tabs){
			var tab = this.tabs[tabId];
			var action = 'remove';
			if(tabId == 't'+id){
				focusedTab = tab;
				action = 'add';
			}
			
			tab.parentEle.classList[action]('visible');
			tab.tabEle.classList[action]('visible');
		}
		this.currentTab = id;
		
		// This is awkward, why isn't it working? FIXME.
		window.setTimeout(function(){
			focusedTab.editor.focus();
		},10);
	},
	
	getTab : function(searchId,type){
		for(var i=0; i<this.tabsIndexed.length; i++){
			var tabId = this.tabsIndexed[i].tabId;
			
			if(tabId == searchId){
				var returnId = i;
				
				if(!type){
					// Return i;
				} else if(type == 'next'){
					if(i+1 >= this.tabsIndexed.length){
						returnId = 0;
					} else {
						returnId = i+1;
					}
				} else {
					if(i-1 < 0){
						returnId = this.tabsIndexed.length-1;
					} else {
						returnId = i-1;
					}
				}
				return this.tabsIndexed[returnId];
			}
		}
	}
}

module.exports = Pane;

},{"../crel.js":4,"./tab.js":5,"./filereaderchrome.js":3}],4:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.
    
    However, the code's intention should be transparent.
    
    *** IE SUPPORT ***
    
    If you require this library to work in IE7, add the following after declaring crel.
    
    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');    
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;
    

    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;
    
    

*/

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
    }
}(this, function () {
    // based on http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    var isNode = typeof Node === 'object'
        ? function (object) { return object instanceof Node }
        : function (object) {
            return object
                && typeof object === 'object'
                && typeof object.nodeType === 'number'
                && typeof object.nodeName === 'string';
        };

    function crel(){
        var document = window.document,
            args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = document.createElement(args[0]),
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel.attrMap;

        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(typeof settings !== 'object' || isNode(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string    
        if((argumentsLength - childIndex) === 1 && typeof args[childIndex] === 'string' && element.textContent !== undefined){
            element.textContent = args[childIndex];
        }else{    
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];
                
                if(child == null){
                    continue;
                }
                
                if(!isNode(child)){
                    child = document.createTextNode(child);
                }
                
                element.appendChild(child);
            }
        }
        
        for(var key in settings){
            if(!attributeMap[key]){
                element.setAttribute(key, settings[key]);
            }else{
                var attr = crel.attrMap[key];
                if(typeof attr === 'function'){     
                    attr(element, settings[key]);               
                }else{            
                    element.setAttribute(attr, settings[key]);
                }
            }
        }
        
        return element;
    }
    
    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    // String referenced so that compilers maintain the property name.
    crel['attrMap'] = {};
    
    // String referenced so that compilers maintain the property name.
    crel["isNode"] = isNode;
    
    return crel;
}));

},{}],5:[function(require,module,exports){
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
		this.editor.setValue(text);
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

},{}]},{},[1])
;