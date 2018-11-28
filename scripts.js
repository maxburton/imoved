function clicked() {

    var infos = document.getElementsByClassName("info");

    var swap = 0;
    var first = true;
    var top = 0;

    for (i = 0; i < infos.length; i++) {
        if (first === true) {
            top = $('#' + infos[i].id).css("top");
            first = false;
        }

        swap = i + 1;
        if (swap >= infos.length) {
            swap = 0;
        }
        if (swap === 0) {
            $('#' + infos[i].id).css('top', top);
        } else {
            $('#' + infos[i].id).css('top', $('#' + infos[swap].id).css("top"));
        }
    }

}

function upload_gpx_pressed() {
    var read = new FileReader();
    file = $("#input").prop('files')[0];

    read.readAsBinaryString(file);

    read.onloadend = function() {
	var gpx = read.result.replace(/gpxtpx:/ig, 'gpxtpx');
	//alert(gpx);
        xmlDoc = $.parseXML(gpx);
        display_xml(xmlDoc);
    };
    $("#form").css("visibility", "hidden");
	$(".buttons").css("padding-top", "0");
}

function get_speed(first_lat, first_lng, second_lat, second_lng, first_time, second_time){ // This totally works and is incredibly accurate

    var date_diff = Math.abs((new Date(second_time[0]['innerHTML']).getTime()) - (new Date(first_time[0]['innerHTML']).getTime())) / (1000*60*60);
    d = get_dist(first_lat, first_lng, second_lat, second_lng)   
    return d/date_diff; //km/h

}

function get_dist(first_lat, first_lng, second_lat, second_lng){ // This totally works and is incredibly accurate
/*
    var lat_diff = Math.abs(second_lat - first_lat);
    var lng_diff = Math.abs(second_lng - first_lng);

    var R = 6371; // Radius of the earth in km

    var a = Math.sin(lat_diff/2) * Math.sin(lat_diff/2) +
    Math.cos(deg2rad(lat_diff)) * Math.cos(deg2rad(lat_diff)) * 
    Math.sin(lng_diff/2) * Math.sin(lng_diff/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d; //km
*/
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


function display_xml(xml) {
    $('#bmicalc').css("padding-top", "10%");
    var track = $(xml).find("trk").first();
    $("#track_name").html("<b>" + $(track).find("name")[0]['innerHTML'] + "</b>");
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

    for (var i = 0; i < points.length; i++) {
        linePoints.push([points[i].getAttribute('lat'), points[i].getAttribute('lon')]);
	/*elevations.push([$(points[i]).find("time")[0]['innerHTML'], $(points[i]).find("ele")[0]['innerHTML']]);*/

        var elevation = $(points[i]).find("ele")[0]['innerHTML'];
	if (elevation < 5){
		elevation = 5;
	}	
        elevationList.push(elevation);

        var time = $(points[i]).find("time")[0]['innerHTML'];
        timeList.push(time);

        heartRates += parseInt($(points[i]).find("gpxtpxhr")[0]['innerHTML']);
        ratesCount += 1;
        if (i===0){
	    continue;
	}
	tmp = get_speed(points[i-1].getAttribute('lat'), points[i-1].getAttribute('lon'),points[i].getAttribute('lat'), points[i].getAttribute('lon'),$(points[i-1]).find('time').first(),$(points[i]).find('time').first());
	if (tmp < 5){
		tmp = 5;
	}

	if (tmp > topSpeed){
		topSpeed = tmp;
	}

	speeds.push(tmp);
        dist += get_dist(points[i-1].getAttribute('lat'), points[i-1].getAttribute('lon'),points[i].getAttribute('lat'), points[i].getAttribute('lon'));
    }
    var polyline = L.polyline(linePoints, {
        color: 'red'
    }).addTo(mymap);
    // zoom the map to the polyline
    mymap.fitBounds(polyline.getBounds());
    $('#heart_rate').html("<b>Average Heart Rate : </b>" + Math.round(heartRates / ratesCount));
    $('#distance').html("<b>Distance : </b>" + Math.round(dist));
    $('#top_speed').html("<b>Top Speed : </b>" + Math.round(topSpeed) + "<b>km/h</b>");
    $("#mapid").css("visibility", "visible");

    var ctx = document.getElementById('elevations').getContext('2d');
    var chart = new Chart(ctx, {
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
        options: {}
    });
    var ctx = document.getElementById('speeds').getContext('2d');
    var chart = new Chart(ctx, {
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
        options: {legend:{labels:{fontColor: 'WHITE'},ticks:{fontColor:'WHITE'}}}
    });

}
