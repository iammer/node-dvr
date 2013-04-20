#!/usr/bin/env node

var DVR=require('./dvr.js').DVR;

var dvr=new DVR({host: '10.0.0.21', port: 9000});
//dvr.getRecording('ch00000000000001-130405-235004-235959-10p00001000000400.nvr').pipe(fs.createWriteStream('test2.h264'));
dvr.getChannel(5).pipe(process.stdout);
//dvr.getRecordingList(2013,4,10,console.dir);