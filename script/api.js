// The Blue Alliance API
var tba_base       = "https://www.thebluealliance.com";      // Base URL
var tba_identifier = "?X-TBA-App-Id=2002:event-dashboard:1"; // Required by TBA

// Endpoints
var tba_events    = "/api/v2/events/2017";        // Events
var tba_teams     = "/api/v2/event/KEY/teams";    // Teams
var tba_matches   = "/api/v2/event/KEY/matches";  // Matches
var tba_rankings  = "/api/v2/event/KEY/rankings"; // Rankings

// Returns the full API URL of a given endpoint
// If the endpoint requires an event key, it can
// be passed as the second argument
function url(endpoint, key = null){
    return tba_base + endpoint.replace("KEY", key) + tba_identifier;
}



// Get all events
function get_events(){
    get(url(tba_events), function(res){
        state.raw_events = res;
    });
}


// Get teams from an event
function get_teams(key){
    get(url(tba_teams, key), function(res){
        state.raw_teams = res;
    });
}


// Get matches from an event
function get_matches(key){
    get(url(tba_matches, key), function(res){
        state.raw_matches = res;
    });
}


// Get rankings from an event
function get_rankings(key){
    get(url(tba_rankings, key), function(res){
        state.raw_rankings = res;
    });
}
