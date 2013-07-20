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
		this.showTab(opts.tabId);
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
				
				var tab = _this.tabsIndexed[_this.currentTab];
				if(tab.file){
					tab = _this.newTab({});
				}
				
				tab.setFile(fileReader);
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
		for(tabId in this.tabs){
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