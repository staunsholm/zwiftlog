var fs = require('fs');
var cc = require('config-multipaas');
var restify = require('restify');
var log = require('color-log');

var logtxt = fs.readFileSync('Logs/log.txt').toString();

// Heard area message from 53762 (What's the score on sprints...allowed?)
function allChatMessages() {
	var lines = logtxt.match(/.*Heard area message from.*/gi);
	for (var i = 0, l = lines.length; i < l; i++) {
		lines[i] = lines[i].replace(/\[(.*)\].*Heard area message from .* \((.*)\)/gi, '$1 $2');
	}
	return lines;
}

// Creating new nameplate for "F.Hemsley [MZGR]"
function allRiders() {
	var lines = logtxt.match(/.*Creating new nameplate for.*/gi);
	var riders = {};
	for (var i = 0, l = lines.length; i < l; i++) {
		var line = lines[i].replace(/\[(.*)\].*Creating new nameplate for "(.*)".*/gi, '$1,$2').split(',');
		riders[line[1]] = {
			time: line[0]
		};
	}
	return riders;
}

function countAllRiders() {
	var riders = allRiders();
	var cnt = 0;

	for (var i in riders) {
		cnt++;
	}

	return cnt;
}

// Received broadcast segment results for segment 9634088118 with a time of 1622.09 for user id=44654
function allSegments() {
	var lines = logtxt.match(/.*Received broadcast segment results for segment.*/gi);
	var result = {};
	for (var i = 0, l = lines.length; i < l; i++) {
		var line = lines[i].replace(/.*Received broadcast segment results for segment (.*) with a time of (.*) for user id=(.*)/gi, '$1,$2,$3').split(',');
		var segmentId = parseInt(line[0], 10);
		if (segmentId >= 0) {
			result[segmentId] = result[segmentId] || [];
			result[segmentId].push({
				time: line[1] * 1,
				user: line[2] * 1
			});
		}
	}

	for (i in result) {
		result[i].sort(function(a,b) {
			return a.time > b.time ? 1 : -1;
		});
	}

	return result;
}

// Delayed packet detected: Delay=86.24, Meters=125.3 networkID=32438, rider name=F.Campos'
function delayedPackets() {
	var lines = logtxt.match(/.*Delayed packet detected.*/gi);
	return lines;
}

var app = restify.createServer();

app.use(restify.CORS());
app.use(restify.fullResponse());
app.use(restify.queryParser());

// Routes
app.get('/status', function (req, res, next) {
	res.send({
		segments: allSegments(),
		delays: delayedPackets(),
		riders: allRiders(),
		countRiders: countAllRiders(),
		messages: allChatMessages()
	});
});

var config = cc();
app.listen(config.get('PORT'), config.get('IP'), function () {
	log.info("Listening on " + config.get('IP') + ", port " + config.get('PORT'))
});

