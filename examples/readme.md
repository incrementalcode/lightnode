The examples in the delegation folder represent the preferred usage. 
The examples directly in this folder are simpler examples and used custom route logic instead of the delegation system, 
they are therefore useful if just want to see how to the server integrates with node and how you would usually do something in node, 
beginners to node might want to start there, as well advanced users that would like to compare the difference.


# Techniques used in the examples


## Create a File Server

	var mySite = new lightnode.FileServer("/home/web/mysite.com")
	
## Send a request to be processed by a server

	mySite.receiveRequest(request, response)
	
## Delegate to another server when a request is received

	mySite.delegateRequest = function(req, resp) {
		return someOtherServer
	}
	
## Create or get a child server

	mySite.getChild('images')
	
## Specify a special constructor used to create any child servers

	mySite.constructChild = function(name) {
		return new MyServerType()
	}


## Delegate to an existing child server
	
	// the server will automatically look for a child server for a request,
	// you can control what the name it looks for the child server under.
	mySite.getChildName = function(req) {
		if (req.url.startsWith('images'))
			return 'images'
		else if (req.url.startsWith('posts'))
			return 'posts'
	}
		
	// any child server that is found under the name will be delegated to,
	// if it doesn't exist then no delegation is done and the server handles the request itself.
	
	// so there is no need to do anything else except
	// create the child servers before any requests come in
	mySite.getChild('images')
	mySite.getChild('posts')

