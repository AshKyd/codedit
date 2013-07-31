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
		
		opts.tabEle = crel('div',{'data-id':opts.tabId,'class':'tab-ele'});
		opts.tabEleLabel = crel('span',{'class':'label'},opts.name||'Untitled');
		opts.tabEleClose = crel('span',{'data-action' : 'close','class':'close'});
		opts.tabEle.appendChild(opts.tabEleLabel);
		opts.tabEle.appendChild(opts.tabEleClose);
		
		opts.parentEle = crel('div',{class:'tab-target'});
	
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
			var tabId = e.target.getAttribute('data-id') || e.target.parentElement.getAttribute('data-id');
			var action = e.target.getAttribute('data-action');
			console.log('clicked tab',tabId,action);
			if(!tabId){
				return
			}
			
			if(!action){
				_this.showTab(tabId);
			} else if(action == 'close') {
				_this.closeTab(id);
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
		var _this = this;
		var className = 'visible';
		var focusedTab = false;
		for(var i=0; i<this.tabsIndexed.length; i++){
			var tab = this.tabsIndexed[i];
			var action = 'remove';
			if(tab.tabId == id){
				focusedTab = i;
				action = 'add';
			}
			
			tab.parentEle.classList[action]('visible');
			tab.tabEle.classList[action]('visible');
		}
		this.currentTab = focusedTab;
		
		document.title = this.tabsIndexed[focusedTab].name;
		
		// This is awkward, why isn't it working? FIXME.
		var thisEditor = _this.tabsIndexed[focusedTab].editor;
		window.setTimeout(function(){
			thisEditor.focus();
			thisEditor.renderer.onResize(true);
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
