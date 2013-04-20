var _=require('underscore');
var net=require('net');

var H264Stripper=require('./h264Stripper2.js');

var REQUEST_SIZE=507;

var DVR=function(options) {
	this.options=options;
};

_.extend(DVR.prototype,{
	sendRequest: function(req) {
		var sock=net.createConnection(this.options);
		sock.on('connect',function() {
			sock.write(req.buffer);
		});
		
		return sock;
	},
	getRecording: function (recordingName) {
		//return new H264Stripper(fs.createReadStream('test2.nvh'));
		return new H264Stripper(this.sendRequest(new RecordingRequest(recordingName)));
	},
	getChannel: function(channel) {
		return new H264Stripper(this.sendRequest(new LiveStreamRequest(channel)));
	},
	getRecordingList: function(year,month,date,cb) {
		var sock=this.sendRequest(new RecordingListRequest(year,month,date));
		
		var recordingList=[];
		
		sock.on('end',function() {
			cb(recordingList);
		});

		var readHeader=false;
		
		sock.on('readable',_.bind(function() {
			var buf;
			if (readHeader || sock.read(8)) {
				readHeader=true;
				while(buf=sock.read(148)) {
					recordingList.push(this.createRecordingItem(buf.toString('ascii',12,71)));
				}
			}
		},this));
	},
	recordingItemRE: /ch0{13}(\d)-(\d{6})-(\d{6})-(\d{6})/,
	createRecordingItem: function(name) {
		var res=this.recordingItemRE.exec(name);
		return {
			name: name,
			channel: res[1],
			date: res[2],
			startTime: res[3],
			endTime: res[4]
		};
	}
});

var Request=function() {
	this.buffer=new Buffer(REQUEST_SIZE);
	this.buffer.fill(0);
	this.buffer[10]=1;
};

_.extend(Request.prototype,{
	setNumber: function(n) {
		this.buffer.writeUInt16BE(n,14);
	},
	setData: function(pos,data) {
		if (Buffer.isBuffer(data)) {
			data.copy(this.buffer,pos);
		} else {
			this.buffer.write(data,pos,null,'hex');
		}
	}
});

var LiveStreamRequest=function(channel) {
	Request.call(this);
	this.channel=channel;
	this.setNumber(0x0304);
	this.setData(16,	'00000000000000000000680000000100' +
					'00001000000001000000010000000061' +
					'646d696e000000094060200000000022' +
					'0100000000000000cf112000000e0100' +
					'02917c0400000048070e0100000e0190' +
					'113501e4f012000000000028f3120000');
	this.buffer[38]=1<<(channel-1);
};

_.extend(LiveStreamRequest.prototype,Request.prototype);
	
var RecordingListRequest=function(year,month,day) {
	Request.call(this);
	this.setNumber(0x0904);
	this.setData(16,	'0000000cf8e0010000002803000000ff' +
					'ff00000d0405000000173b3b1beb0000');
	if (year>2000) year-=2000;
	this.buffer[35]=year;
	this.buffer[36]=month;
	this.buffer[37]=day;
};

_.extend(RecordingListRequest.prototype,Request.prototype);

var RecordingRequest=function(recording) {
	Request.call(this);
	this.setNumber(0x0705);
	this.buffer.write('ac0000000100',26,null,'hex');
	this.buffer.write(recording,51,null,'ascii');
};

_.extend(RecordingRequest.prototype,Request.prototype);	


module.exports={
	Request: Request,
	LiveStreamRequest: LiveStreamRequest,
	RecordingListRequest: RecordingListRequest,
	RecordingRequest: RecordingRequest,
	DVR: DVR
};
