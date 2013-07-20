# Codedit
Look, the state of development tools on Chrome OS is pretty average.
This is a code editor with no more lofty goal than bringing offline
code editing to Chrome.

This is a really young project and not ready for production so take
care, yeah? Also, check out the official [Google code-editor-app](https://github.com/GoogleChrome/code-editor-app).

## Requirements
This project depends on these libraries:

* [Ace](http://ace.ajax.org) - only the *best* code editor out there.
* Crel - For some light element manipulation.

The project uses some [proprietary Chrome APIs](http://developer.chrome.com/apps/api_index.html)
particularly to deal with file management, though I'd like to keep this
open to cross-platform use where possible in future.

## Usage
First of all, you'll need to [check out and build the Ace repo](https://github.com/ajaxorg/ace)
in the lib/ directory. This will give you a lib/ace/build/src/ace/
directory. 

This is a Chrome app, so you'll need Chrome or (maybe) Chromium. Follow
the [instructions on the Chrome site](http://developer.chrome.com/apps/first_app.html#five)
to get started.

## Bedtime
It's rather late and I'm going to bed. I'm sure you can work out the
rest.
