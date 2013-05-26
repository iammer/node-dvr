#!/usr/bin/env node

var argv = require('optimist')
	.alias({
		y: 'year',
		m: 'month',
		d: 'day',
		c: 'channel',
		s: 'start',
		o: 'out'})
	.argv;
var _=require('underscore');
var DVR=new require('./dvr.js').DVR;
		
var dvr=new DVR({host: '10.0.0.21', port: 9000});

var year,day,month;
if (argv.date) {
	var m=/(\d{4})-(\d\d)-(\d\d)/.exec(argv.date);
	if (m) {
		year=m[1];
		month=m[2];
		day=m[3];
	} else {
		console.log('Use date format yyyy-mm-dd');
		process.exit(1);
	}
} else {
	year=argv.year;
	month=argv.month;
	day=argv.day;
}

if (argv.list) {
	
	dvr.getRecordingList(year,month,day,function(list) {
		_.each(list,function(i) {
			console.log('Ch' + i.channel + ':' + i.startTimeStr + '-' + i.endTimeStr);
		});
	});
} else if (argv.get) {
	var format=false;
	if (argv.mp4) {
		format='mp4';
	} else if (argv.flv) {
		format='flv';
	}
	
	dvr.getRecordingList(year,month,day,function(list) {
		var name=false;
		_.each(list,function(i) {
			if (i.channel==argv.channel
				&& (
					(i.startTime.hour==argv.start && i.startTime.minute<5)
					|| (i.startTime.hour==argv.start-1 && i.startTime.minute>55)
				)
			){
				name=i.name;
			}
		});
		
		if (name) {
			if (format) {
				var convert=require('./ffmpegConverter.js').convert;
				var i=0;
				convert(dvr.getRecording(name,function() {
					if (i++==1000) {
						process.stdout.write('.')
						i=0;
					}
				}),format,argv.out,function() {
					console.log('Done');
				});
			} else {
				var fs=require('fs');
				var w=fs.createWriteStream(argv.out);
				dvr.getRecording(name).pipe(w);
			}
			console.log("Writing to " + argv.out);
		} else {
			console.log('No match found');
		}
	});
} else if (argv.live) {
	var cp=require('child_process');
	
	var child=cp.spawn('mplayer',['-fps','30.1','-demuxer','h264es','-'],{stdio: ['pipe',process.stdout,process.stderr], encoding: 'binary'});
	
	child.on('exit',function() {
		process.exit();
	});
	
	dvr.getChannel(argv.channel).pipe(child.stdin);
}
	
