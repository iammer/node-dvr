#!/usr/bin/env node

var net=require('net');

listVideos(function(vl) {
	console.log('Got Videos:');
	vl.forEach(function(v,i) {
		console.log(v);
	});
});

function listVideos(cb) {
	
	var dvr=net.createConnection({host: '10.0.0.21', port: '9000'});
	
	dvr.on('connect',function() {
		var gotSize=false;
		var size=0;
		var videoList=[];
		var start=12;
		var end=71;
		var remainder='';


		dvr.on('data',function(b) {
			if (!gotSize) {
				size=b.readUInt32LE(0) - b.length;
				gotSize=true;
			} else {
				if (remainder!='')  {
					videoList.push(remainder + b.toString('ascii',0,end));
					remainder='';
					start+=148;
					end+=148;
				}
				
				while (end<b.length) {
					videoList.push(b.toString('ascii',start,end));
					start+=148;
					end+=148;
				}
											
				if (start<b.length) {
					remainder=b.toString('ascii',start,b.length);
				}
				
				start-=b.length;
				end-=b.length;
				size-=b.length;
				
				if (size<=0) {
					dvr.end();
					cb(videoList);
				}
			}
		});
		
		var getStream=new Buffer(
			'00000000000000000000010000000904' + 
			'0000000cf8e0010000002803000000ff' +
			'ff00000d0405000000173b3b1beb0000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +		
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'00000000000000000000000000000000' +
			'0000000000000000000000','hex');
			
		dvr.write(getStream);
	});
}