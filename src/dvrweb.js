#!/usr/bin/env node

var express=require('express');

var DVR=require('./dvr.js').DVR;
var convertToFLV=require('./flvconverter.js').convertToFLV;

var dvr=new DVR({host: '10.0.0.21', port: 9000});

var app=express();

app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret: 'dvr secret',key: 'sid'}));
app.use(express.static(__dirname+'/public_html'));
app.use(function(req,resp,next) {
	if (req.path=='/login' || req.session.isAuth==true) {
		next();
	} else {
		resp.send(403,'Forbidden');
	}
});

app.post('/login',function(req,resp) {
	var user=req.body.user;
	var password=req.body.password;

	if (user=='michael' && password=='testpass') {
		req.session.isAuth=true;
		resp.send({success: true});
	} else {
		req.session.isAuth=false;
		resp.send(403,'Forbidden');
	}
});

app.get('/loginCheck',function(req,resp) {
	resp.send({loggedIn: true});
});

app.get('/logout',function(req,resp) {
	req.session.destroy();
	resp.send({loggedIn: false});
});

var flvExtRE=/\.flv^/;

app.get('/channel/:cid',function(req,resp) {
	var cid=req.params.cid;
	if (flvExtRE.test(cid)) {
		cid=cid.substr(0,cid.length-4);
	}
	resp.writeHead(200,{'Content-Type': 'video/x-flv'});
	
	var flv=convertToFLV(dvr.getChannel(cid));
	
	resp.on('close',function() {
		flv.unpipe();
		resp.end();
		if (flv.close) flv.close();
	});
	
	flv.pipe(resp);
});

app.listen(8081);
	
	

