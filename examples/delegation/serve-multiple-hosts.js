
var http = require('http')
var url = require('url')
var lightnode = require('../lightnode')


// 1 - create and start the node ip server
var server = new http.Server(); server.listen(8081)
		
// 2 - create the file server for the directory containing all the host root directories (named by their full host name www.mydomain.com)
var websites = new lightnode.FileServer('/home/web/')

// before any requests come in, setup the delegation
websites.getChildName = function(req) {
	// delegate based on hostname, remove the port from the host string
	return req.headers.host.split(':')[0]
}

websites.delegateRequest = function(req, resp) {
	// delegate all requests, creating the child server if it doesn't already exist
	return this.getChild(this.getChildName(req))
}

// when a request comes to the ip server
server.addListener('request', function(req, resp) {
	
	// pass all requests to the file server
	websites.receiveRequest(req, resp)
	
})
