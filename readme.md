Lightnode
=========

An http internet server playground, designed to have unprecented control meet simplicity and functionality.

Lightnode is an http (nodejs based) javascript library that aims to deliver the potential that node js makes available, in a offering similar to lighttpd or apache.  see <http://www.ngspinners.com/lightnode/> for more info.


Goals
-----

* a complete web server platform
* good integration with and enhancement of node philosophy and usage
* minimal / non-intrusive / non-assuming design
* support for taming the unprecedented control node provides
* robust static file serving with caching + virtual host + customizability
* simple to understand handling logic
* instructable functionality (bypass handling logic)
* built-in desirable functionality to utilize with node such as statistics (not yet implemented), file serving, control framework etc
* good documentation, understandable source

Mechanisms
----------

* request delegation (server receives -> delegates -> emits request)
* scaling server hierarchy (a section of requests can be delegated to a child server in the hierarchy)
* pre request customization of hierarchy (the server objects in the hierarchy can be created and customized before any requests come in)
* intercept requests directly from node before they go into the lightnode server
* server locates a physical file given request (overridable)
* serving logic can be bypassed and sendFile() function can be used directly


Status
------

Works. Alpha phase. As efficient as lighttpd, unsure if it scales as far.

Provides a nice framework for dynamic server applications (routing). Provides static file serving with caching, virtual hosts, some customization possible.

Tutorials still to come.


Examples
--------

see the examples folder. The examples using the delegation mechanism are usually preferred, those without are for demonstration of the difference and a different option.

* a simple single host server
* a simple single host server with api route
* virtual hosting with api (delegation version below is preferred)
* using delegation:
* * a simple single host server with api route
* * virtual hosting with api


Installation
------------

Just copy the lightnode.js file into your node library path (~/.node_libraries). 
It's best if you do this by making a symlink from there to the repo, instead of copying, that way you can update the repo or make your own edits and the installed version reflects the changes immediately.

Support for npm will be added soon I suppose.
