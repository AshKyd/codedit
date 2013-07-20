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
