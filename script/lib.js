// GET request (JSON)
function get(url, callback){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function(){
        if(xhr.status === 200)
            callback(JSON.parse(xhr.responseText));
        else
            console.log("GET REQUEST ERROR (status code " + xhr.status + ")");
    };
    xhr.send();
}


// Query selector
function $(sel, all = false){
    var nodes = document.querySelectorAll(sel);
    if(all) return [...nodes];
    else return nodes[0];
}


// String to Unix Time (or current Unix time if str == "")
function utime(str = "", localize = true){
    var d;
    if(str == ""){
        d = new Date();
        if(localize) d.setHours(0,0,0,0);
    }
    else{
        d = new Date(str);
    }
    return Math.floor(d.getTime()/1000);
}


// Unix time to time string
function time(x, _24hr = false){
    var date = new Date(x*1000);
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    if(_24hr)           return formattedTime = hours + ':' + minutes.substr(-2);
    if(hours == 12)     return formattedTime = hours + ':' + minutes.substr(-2) + "pm";
    else if(hours > 12) return formattedTime = hours-12 + ':' + minutes.substr(-2) + "pm";
    else                return formattedTime = hours + ':' + minutes.substr(-2) + "am";
}


// Convert time string to "Month Day"
function date(str){
    var d = new Date(str);
    var month = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    var year = d.getUTCFullYear();
    return i_to_month(month) + " " + ordinal(day);
}


// Get month from month index (1-12)
function i_to_month(index){
    switch(index){
        case 1:  return "January";
        case 2:  return "February";
        case 3:  return "March";
        case 4:  return "April";
        case 5:  return "May";
        case 6:  return "June";
        case 7:  return "July";
        case 8:  return "August";
        case 9:  return "September";
        case 10: return "October";
        case 11: return "November";
        case 12: return "December";
        default: return "NOT A MONTH";
    }
}


// Ordinal suffix
function ordinal(i){
    var j = i % 10,
        k = i % 100;
    if(j == 1 && k != 11) return i + "st";
    if(j == 2 && k != 12) return i + "nd";
    if(j == 3 && k != 13) return i + "rd";
    return i + "th";
}
