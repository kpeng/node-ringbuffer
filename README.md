node-ringbuffer
===============

A simple ring buffer implementation based on the basic Buffer class that node.js
provides.  It basically keeps track of the current position in the buffer (mark)
and the remaining bytes based on how much data has been inserted so far.  It will
also automatically "rotate" the buffer to the zero position when the buffer
doesn't have enough free space to put additional data.

The API interacts with Buffers, so you aren't restricted to fixed size: you put()
existing Buffers and get() bytes placed into a Buffer object you pass in.  This
makes it particularly useful for consuming and managing data from the network if
you are working with your own serialization protocol, which was the initial onus
for this (cracking a proprietary messaging protocol over a TCP connection).

To Do
-----

I actually want to rewrite this as a native node.js library, so that it is more
performant.
