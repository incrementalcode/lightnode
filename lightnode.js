/*
	Lightnode web server platform. Author: Tim Lind (Next Generation Spinners)
*/


var http = require('http')
var util = require('util')
util.fs = require('fs')
util.path = require('path')
util.url = require('url')
util.events = require('events')




// this emitter shows the receive / delegate / emit pattern,
// but in reality the pattern is hard coded for each event type as seen in Server.
// in future it may emit events that indicate event reception / delegation,
// so that the delegation logic can be applied through listeners as opposed requiring passage through hardcoded event reception functions,
// until then the delegation system is only relevant to http servers (they have the request event).
var EventEmitter = type(util.events.EventEmitter, function() {
	
	this.constructor = function() {
		util.events.EventEmitter.call(this)
	}
	
	// receive an event to emit, potentially delegating as opposed to emitting from this object
	this.receive = function(event /* , ... */) {
		this.delegate.apply(this, arguments)
	}

	// will either pass the event on to another emitter or emit the event from itself.
	this.delegate = function(event /* , ... */) {
		this.emit.apply(this, arguments)
	}

	// emit an event to all of the event's listeners on this emitter
	// this.emit = function(event /* , ... */) {
	//	return util.events.EventEmitter.prototype.emit.apply(this, arguments)
	// }
	
})

/* This is a general server type, it uses the pattern of receiving / delegating / emitting requests.
*/
var Server = type(EventEmitter, function() {
	
	this.constructor = function() {
		EventEmitter.call(this)
	}
	
	// A request will be received through this function,
	// which will pass it to delegate,
	// which decides whether this server handles the request, 
	// otherwise it will be received by (delegated to) another server by the delegate function.
	this.receiveRequest = function(req, resp) {
		var delegateTo = this.delegateRequest(req, resp)
		
		if (!delegateTo)
			return
			
		if (delegateTo == this)
			this.emitRequest(req, resp)
		else {
			if (delegateTo instanceof Server)
				delegateTo.receiveRequest(req, resp)
			else if (typeof delegateTo == 'function')
				delegateTo(req, resp)
			else
				logError("Couldn't delegate the request to the specified object.")
		}
	}
	
	// This function returns a Server object that the request should be delegated to, to not delegate it must return itself.
	// It can also a return a function instead, which will be executed with the same parameters as receiveRequest().
	this.delegateRequest = function(req, resp) {
		return this
	}
	
	// This function emits a request event with a given request and response pair.
	// It's presence reinforces the pattern of accepting a request to process, and enables easy hooking up from one request emitting to another.
	this.emitRequest = function(request, response) {
		this.emit('request', request, response)
	}
	
})

/* A collection of custom named child servers is lazily created and maintained throughout the life of this server.
	- getting a child server with any name will create it if it does not exist
	- if you want to customize the serving of just a portion of the request, on initialization of this server, access a child server to create and customize it, then use delegation
*/
var HierarchicalServer = type(Server, function() {
	
	// should this accept a parent server?
	this.constructor = function(fullName, name, parent) {
		Server.call(this)
		this.name = name
		this.fullName = fullName
		this.parent = parent
		this.children = {}
	}
	
	// when getChild needs to create a child it calls this function, which can be a constructor itself,
	// or it can instantiate and return and object, there is no type requirement for the object returned.
	this.constructChild = function(name) {
		return new this.constructor(this.fullName + name, name, this)
	}

	/* Return the name of the child server for a given request. 
		It's recommended to keep a consistent means of naming child servers in a parent server,
		so that the same naming pattern is used for all children of one server, 
		this function can be overriden by external code or subclasses for that purpose.
		- This will be used by the delegation aspect to get the next server to delegate to.
		- Can also prevent any delegation by returning falsy.
		- Customize to delegate for example, based on the request host or based on the next folder name.
	*/
	this.getChildName = function(req) {
		return null
	}
	
	/* Lazily creates a child server and caches under the given name for the duration of this object's life.
		- This is used by the delegate function which will use getChildName as the parameter to this call.
		- Can be called publicly, but becareful that the name pattern used doesn't clash with what getChildName provides.
		- Not intended for overriding
	*/
	this.getChild = function(name) {
		if (!(name in this.children)) {
			this.children[name] = this.constructChild(name)
		}
		return this.children[name]
	}
	
})

/* 
*/
var DelegatingServer = type(HierarchicalServer, function() {
	
	this.constructor = function() {
		HierarchicalServer.apply(this, arguments)
		// run the delegate function for each request
		// if we don't want the server to do any delegation, we can override the delegate function with a noop (it is already a noop anyway).
		// note: we make sure here that we lookup the delegate function for each request, so that it can be overriden.
		/* this.addListener('request', function(request, response) {
			this.delegate(request, response)
		})*/
	}
	

	// The delegate function accepts a request and either calls receiveRequest on some other server it delegates the request to,
	// or it calls emitRequest on this server if not delegated to another.
	// the getChildName function is used to decide on the delegation process, so this function need not be overriden.
	// This implementation will delegate if getChildName returns a non falsy value and a child already exists for that name
	// the desirably delegation settings are : 'no', 'all', 'preconfigured', and the default here is 'preconfigured'.
	this.delegateRequest = function(req, resp) {
		var name = this.getChildName(req)
		if (name && this.getChild(name)) {
			return this.getChild(name)
		}
		else
			return this
	}

	
	
})


exports.HttpServer = type(DelegatingServer, function() {
	
	this.constructor = function() {
		DelegatingServer.apply(this, arguments)
		
		this.addListener('request', function(req, resp) {
			this.serveRequest(req, resp)
		})
	}
	
	
	// serving
		
	this.serveRequest = function(req, resp) {
		
	}

	// responding
	
	// these functions can be overriden to provide custom logic
	
	this.sendNone = function(req, resp) {
		resp.writeHead(404, { server: 'lightnode' })
		resp.end()
	}
	
	this.sendAuthorize = function(req, resp) {
		throw new Error("sendAuthorize is Not Implemented")
	}
	
	this.sendForbidden = function(req, resp) {
		resp.writeHead(403, { server: 'lightnode' })
		resp.end()
	}
	
	this.sendClientError = function(req, resp, error) {
		resp.writeHead(400)
		// TODO include error message
		resp.end()
	}
	
	this.sendServerError = function(req, resp, error) {
		resp.writeHead(500)
		resp.end()
	}

})

exports.FileServer = type(exports.HttpServer, function() {
	
	this.constructor = function(fullName, name, parent) {
		exports.HttpServer.call(this, fullName, name, parent)
		
		this.mimeTypes = Object.create(exports.FileServer.MimeTypes)
		
		this.directoryIndices = [
			'index.html',
			'home.html',
			'index.js'
		]
	}
	
	// hierarchy
	
	this.constructChild = function(name) {
		return new exports.FileServer(util.path.join(this.fullName, name), name, this)
	}

	// delegation
		
	this.getNextPathElement = function(req, resp) {
		// TODO I think this relies on the fullName vs name properties, which prob aren't very reliable.
	}
	
	// TODO use the result of getNextPathElement as the default child scheme
	this.getChildName = function(req) {
		// TODO
		return null
	}
	
	// serving
	
	this.serveRequest = function(req, resp) {
		this.locate(req, resp)
	}
		
		// file caching (class level)
		
		var fileCache = {} // file path => exports.File
		
		var getFile = function(path) {
			if (!fileCache[path])
				fileCache[path] = new exports.File(path)
			
			return fileCache[path]
		}
				
		// find the corresponding physical file based on the url as well as headers and file existance / characteristics
		this.locate = function(req, resp) {
						
			var filename = this.translateUrl(req, resp)
			
			log("\t translating to filename " + filename)
			// check that the file requested is an existing, accessible file that can be served through this server. 
			
			// check that the resolved file is still within this file server's root
			if (filename.indexOf(this.fullName) != 0) {
				// assuming translateUrl would get rid of any '..' elements that hide the following security violation:
				// trying to access a file not within this file, could be an attempted security violation
				// call serve without setting the file property of the exchange, which means a 404 is served.
				log("\t that file is outside of this file server")
				return this.sendFile(req, resp)
			}
			
			// check that the file exists
			var self = this
			var file = getFile(filename)
			file.stat(function(error, stat) {
				if (error) {
					// if it doesn't exist, serve nothing
					log("\t requested file doesn't exist")
					return self.sendFile(req, resp)
				}
				
				else if (!stat.isDirectory()) {
					log("\t serving " + filename)
					return self.sendFile(req, resp, file)
				}
				
				else if (stat.isDirectory()) {
					log("\t request file is a directory, looking for index file  in " + JSON.stringify(self.directoryIndices) )
					// if it is a directory we find the index file here
					// (this method is called 'locate' after all ... and we want to encapsulate the creation of the File object that goes to sendFile())
					var a = 0, indexFilename
					(function statNextFile() {
						if (a < self.directoryIndices.length) {
							indexFilename = util.path.join(filename, self.directoryIndices[a++])
							indexFile = getFile(indexFilename)
							indexFile.stat(function(error, stat) {
								if (error)
									statNextFile()
								else {
									log("\t found an index file (" + indexFilename + ") for the directory")
									// found an index file, serve it
									// use set timeout to clear up the call stack a bit
									setTimeout(function() { self.sendFile(req, resp, indexFile) }, 0)
								}
							})
						
						}
						else {
							log("\t no index file could be found for directory, tried " + a + " options")
							// no index found
							self.sendFile(req, resp)
						
						}
					})()
				}
			})

		}
		
			// translate the url to the corresponding file
			this.translateUrl = function(req, resp) {
				return util.path.join(this.fullName, util.url.parse(req.url).pathname)
			}
		
		
	this.sendFile = function(req, resp, file) { var self = this
		if (!file)
			return this.sendNone(req, resp)
			
		log("\t sending file " + file.name)
		// TODO allow customization of caching procedure (expiration), and allow usage of caching aspect in non file servers.
		
		file.stat(function(statErr) {
			
			if (statErr)
				return self.sendNone(req, resp)
			
			// send headers
			var headers = {}
			var mimeTypes = self.mimeTypes
			var ext = util.path.extname(file.path);
			if (ext && ext.indexOf('.') === 0) {
				ext = ext.slice(1);
			}
			
			if (ext in mimeTypes)
				headers['content-type'] = mimeTypes[ext]
			
			headers['last-modified'] = new(Date)(file.header.mtime).toUTCString()
			headers['transfer-encoding'] = 'chunked'
			headers['server'] = 'lightnode'
			
			if (Date.parse(file.header.mtime) <= Date.parse(req.headers['if-modified-since'])) {
				resp.writeHead(304, headers)
				resp.end()
				return
			}
			else {
				resp.writeHead(200, headers)
				if (req.method == "HEAD")
					resp.end()
				else {
					// send contents
					file.readFile(function(err, data) {
						if (err)
							console.log(err)
						//console.log('sending ' + data)
						resp.write(data)
						// end
						resp.end()
					})
				}
			}
			
		})
	}

		
})

exports.FileServer.MimeTypes = {
	"": "text/plain",
	"html": "text/html",
	"css": "text/css",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"js": "text/javascript",
	"json": "application/json",
	"png": "image/png",
	"svg": "image/svg+xml",
	"swf": "application/x-shockwave-flash",
	"tar": "application/x-tar",
	"tgz": "application/x-tar-gz",
	"txt": "text/plain",
	"wav": "audio/x-wav",
	"xml": "text/xml",
	"zip": "application/zip",
	"ico": "image/x-icon",
	"flv": "video/x-flv",
	"gif": "image/gif"
}

// Provides an interface to the file system for one file with the given name.
// Will lazily fetch and cache the stat result for 0.5 seconds so you can just call stat() as frequently as needed from a frequently executed code block.
// More importantly, the file contents itself will be lazily fetched and cached on calling readFile(),
exports.File = function(filename) {
	
	this.path = filename
	this.header = null
	this.contents = null
	
	var statLastCalled = null
	var statResult = null // 0: error, 1: stat
	var statWaitors = []
	
	var hasCalledReadFile = false
	var readFileWaitors = []
	var readFileResult = null
	
	this.stat = function(F) {
		var self = this
		
		// a 0.5 sec stat interval seems as efficient as a 5 second, it should be suitable for development and production.
		if (statLastCalled && statLastCalled > Date.now() - 500) {
			if (!statResult)
				statWaitors.push(F)
			else
				F(statResult[0], statResult[1])
		}
		else {
			statWaitors.push(F)
			statLastCalled = Date.now()
			statResult = null
			util.fs.stat(self.path, function() {
				statResult = [arguments[0], arguments[1]]
				if (arguments[1] && self.header && (arguments[1].mtime > self.header.mtime)) {
					// invalidate the file contents that have been read. TODO what if readfile has been called before this, but has not returned till after this, is it the new contents that stat reflects or old?
					hasCalledReadFile = false
					readFileResult = null
				}
				self.header = arguments[1]
				while(statWaitors.length > 0)
					statWaitors.pop().call(null, arguments[0], arguments[1])
			})
		}
	}
	
	this.readFile = function(F) {
		// TODO we don't want to cache files that are too big.
		var self = this
		self.stat(noop)
		if (hasCalledReadFile) {
			if (!readFileResult)
				readFileWaitors.push(F)
			else
				F(readFileResult[0], readFileResult[1])
		}
		else {
			readFileWaitors.push(F)
			hasCalledReadFile = true
			util.fs.readFile(this.path, function() {
				hasCalledReadFile = true
				readFileResult = [arguments[0], arguments[1]]
				self.contents = arguments[1]
				while(readFileWaitors.length > 0)
					readFileWaitors.pop().call(null, arguments[0], arguments[1])
			})
		}
	}
	
}

function log(msg) {
	if (log.on)
		console.log(msg)
}

function logError(msg) {
	console.log(msg)
}

log.on = false

/* The type() function below is a gem from the Jay project. 
	It's a novel way of conceptualizing the nature and creation of constructors and prototypes,
	and acts as a simple common denominator in type declaration systems. */

function type(parent, definition) {
	// All that happens before the definition is a prototype object is created that inherits from the parent's prototype
	var proto = Object.create(parent.prototype)
	definition.call(proto)
	
	// Now the user has had a chance to define their own constructor function.
	if (!proto.hasOwnProperty('constructor')) {
		// We must override the parent constructor if the user hasn't, otherwise this type doesn't exist.
		proto.constructor = function() {
			// TODO calling initialize can be very useful. it allows aspects to override initialize (not possible for constructor).
			return parent.apply(this, arguments)
		}
	}
	// Mix the parent type's function properties into this constructor (other properties are ignored to avoid issues).
	for (var prop in parent) if (parent[prop] instanceof Function) {
		if (!(proto.constructor[prop] instanceof Function))
			proto.constructor[prop] = parent[prop]
	}
	// Make sure the constructor points to the prototype object the user created
	proto.constructor.prototype = proto
	
	return proto.constructor
}

// it's important to have a noop function, so you can pass the noop when a function is required as a parameter to another function,
// and there is no need to create a new empty closure just to pass to the function, of course it's best if functions are designed so that they don't require you to give a function unnecessarily.
function noop() {}
