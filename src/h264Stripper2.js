var _=require('underscore');
var stream=require('stream');
var binary=require('binary');
var events=require('events');
//var amf=require('amf');

var H264Stripper=function(inStream,progress) {
	events.EventEmitter.call(this);
	this.inStream=inStream;
	var self=this;
    
	inStream.on('end',_.bind(function() {
		console.log('InStream end');
		this.emit('end');
	},this));
	
	this.on('end',function() {
		self.ender();
		inStream.destroy();
	});
	
	if (progress) {
		inStream.on('data',progress);
	}
    
	inStream.pipe(binary()
		.loop(function(end,vars) {
			self.ender=end;
			this
			.scan('junk','dcH264')
			.word32lu('chunkSize')
			.word32lu('headerSize')
			.tap(function(vars) {
				vars['headerSize']+=8;
				this
				.buffer('header','headerSize')
				.buffer('data','chunkSize')
				.tap(function(vars) {
					var junk=vars['junk'];
					self.emit('chunk',junk.toString('ascii',junk.length-1),vars['data']);
				});
			});
		})
	);
    
};

H264Stripper.prototype=Object.create(events.EventEmitter.prototype, { constructor: { value: H264Stripper } });

H264Stripper.prototype.close=function() {
	if (this.ender) this.ender();
	this.inStream.destroy();
}

var H264RawStream=function(inStream,progress) {
	stream.Stream.call(this);
	this.readable=true;
	this.writable=false;
	
	this.h264Stripper=new H264Stripper(inStream,progress);

	this.on('end',_.bind(function() {
		this.h264Stripper.close();
	},this));
	
	this.on('error',_.bind(function() {
		this.h264Stripper.close();
	},this));
	
	this.h264Stripper.on('end',_.bind(function() {
		this.emit('end');
	},this));
	
	this.h264Stripper.on('chunk',_.bind(function(chunkType,data) {
		this.emit('data',data);
	},this));
	
};
	
H264RawStream.prototype = Object.create(stream.Stream.prototype, { constructor: { value: H264RawStream }});

/*
var H264FLVStream=function(inStream) {
	stream.Stream.call(this);
	this.readable=true;
	this.writable=false;
	
	this.h264Stripper=new H264Stripper(inStream);

	this.on('end',_.bind(function() {
		this.h264Stripper.close();
	},this));
	
	this.h264Stripper.on('end',_.bind(function() {
		this.emit('end');
	},this));
	
	this.h264Stripper.on('chunk',_.bind(function(chunkType,data) {
		this.emit('data',data);
	},this));
	
};

	
H264FLVStream.prototype = Object.create(stream.Stream.prototype, { constructor: { value: H264FLVStream }});

_.extend(H264FLVStream.prototype,{
	TAG_BUFFER_SIZE: 65536,
	header: new Buffer([0x46,0x4c,0x56,0x01,0x01,0,0,0,0x09,0,0,0,0]),
	isFirstTag: true,
	tagAt: 0,
	startStream: function() {
		this.emit('data',header);
		this.isFirstTag=true;
	},
	endStream: function() {
		this.tagSizeBuffer.writeUInt32BE(previousTagSize,0);
		this.emit('end',this.tagSizeBuffer);
	},
	startTag: function(tagType) {
		this.tagBuffer=new Buffer(this.TAG_BUFFER_SIZE);
		this.tagAt=0;
		this.tagBuffer.writeUInt8(tagType,0);
		if (this.isFirstTag) {
			this.startTime=Date.now();
			this.tagBuffer.writeUInt32BE(0,4);
		} else {
			var time=Date.now()-this.startTime;
			this.tagBuffer.writeUInt16BE(time & 0xffff,5);
			time>>=16;
			this.tagBuffer.writeUInt8(time & 0xff,4);
			time>>=8;
			this.tagBuffer.writeUInt8(time,7);
		}
		this.tagBuffer.writeUInt32BE(0,8);
		this.tagAt=11;
	},
	endTag: function() {
		var tagType=this.tagBuffer.readUInt8(0);
		this.tagBuffer.writeUInt32BE(this.tagAt-11,0);
		this.tagBuffer.writeInt8(tagType,0);
		this.tagBuffer.writeUInt32BE(this.tagAt,this.tagAt);
		this.emit('data',this.tagBuffer.slice(0,this.tagAt+4));
	},
	writeScriptData: function() {
		var info={offset: this.tagAt};
		amf.write(this.tagBuffer,"onMetaData",info);
		info.type=amf.amf0Types.kECMAArrayType;
		amf.write(this.tagBuffer,{
			"width": 352,
			"height": 240,
			"framerate": 7,
			"videocodecid": 7
		},info);
		this.tagAt=info.offset;
	},
	writeVideoTag: function(frameType,data) {
		//var 
		
	},
	pause: function() {
		this.inStream.pause();
	},
	resume: function() {
		this.inStream.resume();
	}
	
});*/

module.exports={
	H264Stripper: H264Stripper,
	H264RawStream: H264RawStream//,
	//H264FLVStream: H264FLVStream
};
