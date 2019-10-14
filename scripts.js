var currentPolylines = null;

var elevationsChart = null;
var elevationsDataset = null;

var speedChart = null;
var speedDataset = null;

function upload_gpx_pressed() {

    if (currentPolylines != null){
        currentPolylines.remove();
    }

    var read = new FileReader();
    file = $("#bigBut").prop('files')[0];

    if (file.name.split('.').pop() != "gpx"){
	$("#butLab").unbind('mouseover');
	$("#butLab").unbind('mouseout');
	$("#butLab").css("background-color", "RED");
	$("#uploadTxt").html("Upload GPX! File");
	return;
    }

    read.readAsBinaryString(file);

    read.onloadend = function() {
	var gpx = read.result.replace(/(<\/*)([^<>]*:)(hr|cad|TrackPointExtension)/ig, '$1$3');
	    xmlDoc = $.parseXML(gpx);
        display_xml(xmlDoc);
    };
    $("#uploadTxt").html("Upload A New GPX File");
    $("#butLab").css("background-color","#381051");
    $("#rb").css("padding-top", "2%");

$("#butLab").mouseover(function() {
    $(this).css("background-color","#2A2A2A");
}).mouseout(function() {
    $(this).css("background-color","#381051");
});

    /*$("#butLab").hover(function() {
  	$(this).css("background-color","#2A2A2A");
	});*/

}

function get_speed(first_lat, first_lng, second_lat, second_lng, first_time, second_time){ // This totally works and is incredibly accurate

    var date_diff = Math.abs((new Date(second_time[0]['innerHTML']).getTime()) - (new Date(first_time[0]['innerHTML']).getTime())) / (1000*60*60);
    d = get_dist(first_lat, first_lng, second_lat, second_lng);  
    return d/date_diff; //km/h

}

function get_dist(first_lat, first_lng, second_lat, second_lng){ // This totally works and is incredibly accurate
	var unit = "K";
	if ((first_lat === second_lat) && (first_lng === second_lng)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * first_lat/180;
		var radlat2 = Math.PI * second_lat/180;
		var theta = first_lng-second_lng;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		dist = dist * 1.609344; // Convert to km
		return dist;
	}
}

function computeBMI() {

	var height = Number(document.getElementById("height").value);
	var weight = Number(document.getElementById("weight").value);

	var BMI = Math.round((weight*10000) / Math.pow(height, 2));

	document.getElementById("output").innerText = Math.round(BMI * 100) / 100;

	var output = Math.round(BMI * 100) / 100;

	if (output < 18.5)
	    document.getElementById("comment").innerText = "Underweight";
	else if (output >= 18.5 && output <= 25)
	    document.getElementById("comment").innerText = "Normal";
	else if (output >= 25 && output <= 30)
	    document.getElementById("comment").innerText = "Obese";
	else if (output > 30)
	    document.getElementById("comment").innerText = "Overweight";

        $('.bmi').css("visibility", "visible");

}

function format_time(time){
    date = new Date(time);
    return date.getHours() + ":" + date.getMinutes();
}

function display_xml(xml) {
    $('#bmicalc').css("padding-top", "10%");
    var track = $(xml).find("trk").first();
    $("#track_name").html("<b id='name'>" + $(track).find("name")[0]['innerHTML'] + "</b>");
    var points = $(track).find("trkpt");
    var linePoints = [];
    /*var elevations = [];*/
    var speeds = [];
    var speedList = [];

    var elevationList = [];
    var timeList = [];

    var heartRates = 0;
    var ratesCount = 0;
    var dist = 0;
    var tmp = 0;
    var topSpeed = 0;

    var firstTime = $(points[0]).find('time').first();
    var lastTime = $(points[points.length-1]).find('time').first();

    var minEle = 100000;
    var maxEle = 0;

    for (var i = 0; i < points.length; i++) {
        linePoints.push([points[i].getAttribute('lat'), points[i].getAttribute('lon')]);
	    var elevation = $(points[i]).find("ele")[0]['innerHTML'];
	elevation = Math.round(elevation*100)/100;
	if (elevation > maxEle){
	    maxEle = elevation;	
	}
	if (elevation < minEle){
	    minEle = elevation;
	}

	if (elevation < 1){
		elevation = 1;
	}	
        elevationList.push(elevation);

        var time = $(points[i]).find("time")[0]['innerHTML'];
        timeList.push(format_time(time));

        heartRates += parseInt($(points[i]).find("hr")[0]['innerHTML']);
        ratesCount += 1;
        if (i===0){
	    continue;
	}
	tmp = get_speed(points[i-1].getAttribute('lat'), points[i-1].getAttribute('lon'),points[i].getAttribute('lat'), points[i].getAttribute('lon'),$(points[i-1]).find('time').first(),$(points[i]).find('time').first());
	tmp = Math.round(tmp*100)/100;
	if (tmp > topSpeed){
		topSpeed = tmp;
	}
	if (tmp < 1){
		tmp = 1; // To make the map look nicer
	}
	speeds.push(tmp);
        dist += get_dist(points[i-1].getAttribute('lat'), points[i-1].getAttribute('lon'),points[i].getAttribute('lat'), points[i].getAttribute('lon'));
    }

    totTime = Math.abs((new Date(firstTime[0]['innerHTML']).getTime()) - (new Date(lastTime[0]['innerHTML']).getTime())) / (1000*60*60);

    var hrHighTips = ["try decreasing your speed to lower it!", "try lowering your arms to decrease it!", "try picking flatter routes to lower it!"];
    var hrLowTips = ["try increasing your speed to raise it!", "try raising your arms to increase it!", "try picking routes with steeper inclines to raise it!"];

    var eleLowTips = ["for a more challenging run try and pick routes with more hills, the scenery will also be more beautiful!"];
    var eleHighTips = ["if you find going up hills too challenging but love the scenic views, try hiking!"];

    var speedLowTips = ["if you want to go faster, try mixing sprints into your exercise routine!", "create a playlist to help keep you motivated!", "make sure to warm up before exercising!"];

    var generalTips = ["Go for distance rather than time, slow down and be patient, don't worry about your pace!", "Good job today, remember to take rest days so you don't hurt yourself!", "Don't forget to stretch and warm down afterwards to help prevent muscle pain!", "Don't forget to inhale through your nose and exhale through your mouth!"];

    var tips = "";

    if (Math.round(heartRates / ratesCount) > 185){
	tips = "Your heart rate is dangerously high, " + hrHighTips[Math.floor(Math.random() * hrHighTips.length)];
    }else if(Math.round(heartRates / ratesCount) < 160){
	tips = "Your heart rate is quite low, " + hrLowTips[Math.floor(Math.random() * hrHighTips.length)];
    }

    if (maxEle - minEle > 100){
	tips += "  You went on a mountainous route, " + hrHighTips[Math.floor(Math.random() * hrHighTips.length)];
    }else{
	tips += "  Your route was quite flat, " + eleLowTips[Math.floor(Math.random() * eleLowTips.length)];
    }

    if ((dist/totTime) < 12){
	tips += "  You didn't go very fast, " + speedLowTips[Math.floor(Math.random() * speedLowTips.length)];
    }

    tips += "  " + generalTips[Math.floor(Math.random() * generalTips.length)];
    tips += "  " + generalTips[Math.floor(Math.random() * generalTips.length)];

    $("#tips").html("<b>" + tips + "</b>");

    Chart.scaleService.updateScaleDefaults('linear', {
    	ticks: {
            maxTicksLimit: 6
   	 }
	});

    currentPolylines = L.polyline(linePoints, {
        color: 'red'
    }).addTo(mymap);
    // zoom the map to the polyline
    mymap.fitBounds(currentPolylines.getBounds());
    $('#heart_rate').html("<b>Average Heart Rate : </b>" + Math.round(heartRates / ratesCount) + "<b>bpm</b>");
    $('#distance').html("<b>Distance : </b>" + Math.round(dist*10)/10 + "<b>km</b>");
    //$('#top_speed').html("<b>Top Speed : </b>" + Math.round(topSpeed*10)/10 + "<b>km/h</b>");
    $('#avg_speed').html("<b>Average Speed : </b>" + Math.round((dist/totTime)*10)/10 + "<b>km/h</b>");
    $('#time_taken').html("<b>Total Time : </b>" + Math.round(totTime*10)/10 + "<b>hours</b>");

    $('#heart_rate').css("background-color", "#2A2A2A");
    $('#distance').css("background-color", "#2A2A2A");
    $('#avg_speed').css("background-color", "#2A2A2A");
    $('#time_taken').css("background-color", "#2A2A2A");

    $('#heart_rate').css("border-radius", "10px 0 0 10px");
    $('#time_taken').css("border-radius", "0 10px 10px 0");

    $('#name').css("background-color", "#2A2A2A");
    $('#name').css("border-radius", "10px 10px 10px 10px");
    $('#name').css("padding", "10px");

    $("#mapid").css("visibility", "visible");
    Chart.defaults.global.defaultFontColor = 'white';

    elevationsDataset = {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            labels:timeList,
            datasets: [{
                label: "Elevations",
                backgroundColor: '#FFE4FB',
                borderColor: '#FFE4FB',
                data: elevationList,
		pointRadius: 1,
            }]
        },

        // Configuration options go here
        options: {scales: {
            xAxes: [{
                ticks: {
                    beginAtZero:true,
                    maxTicksLimit: 7
                }
            }]
        }}
    };

    if (elevationsChart != null) {
        elevationsChart.destroy();
    }

    var ctx = document.getElementById('elevations').getContext('2d');
    elevationsChart = new Chart(ctx, elevationsDataset);

    speedDataset = {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            labels:timeList,
            datasets: [{
                label: "Speed",
                backgroundColor: '#FFE4FB',
                borderColor: '#FFE4FB',
                data: speeds,
		pointRadius: 1,
            }]
        },

        // Configuration options go here
        options: {scales: {
            xAxes: [{
                ticks: {
                    beginAtZero:true,
                    maxTicksLimit: 7
                }
            }]
        }}
    };

    if (speedChart != null) {
        speedChart.destroy();
    }

    var ctx = document.getElementById('speeds').getContext('2d');
    speedChart = new Chart(ctx, speedDataset);


}
