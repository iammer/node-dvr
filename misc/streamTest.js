#!/usr/bin/env node

var fs=require('fs');

var r=fs.createReadStream('test.in');
var w=fs.createWriteStream('test.out');

var buf2=new Buffer(16);
buf2.fill(0x88);

var reads=16384;

r.on('readable',function() {
	var buf;
	while(reads-- > 0 && (buf=r.read(256))) {
		console.log(reads);
		w.write(buf);
		if (buf.length==256) {
			r.unshift(buf2);
		}
	}
});