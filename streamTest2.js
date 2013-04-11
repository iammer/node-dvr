#!/usr/bin/env node

var fs=require('fs');

var r=fs.createReadStream('test.in');
var w=fs.createWriteStream('test.out');

var buf2=new Buffer(5);
buf2.fill(0);

var result=0;
var totBytes=0;

r.on('end',function() {
	console.log(totBytes);
	console.log(result);
});

r.on('readable',function() {
	var buf;
	while(buf=r.read(254)) {
		w.write(buf);
		totBytes+=buf.length;
		if (buf.length==254) {
			r.unshift(buf2);
		}
		result^=buf[buf.length-1];
	}
});