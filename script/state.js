// Global application state, stored in a Vue object
var state = new Vue({
    el: "#app",
    data: {

        // Variables to be set from API data
        raw_events: [],
        raw_teams: [],
        raw_matches: [],
        raw_rankings: [],

        // 2-way binds
        event_search: "",
        watched_team_tmp: "",

        // Set from internal logic
        event_key: null,
        event_embed_url: null,
        watched_team: null
    },
    computed: {


        // Events
        events: function(){
            var that = this;

            // Filter search results
            var events = this.raw_events.filter(function(x){
                return x.name.toLowerCase().indexOf(that.event_search.toLowerCase()) != -1;
            })

            // Sort events by start date
            .sort(function(a, b){
                return utime(a.start_date) - utime(b.start_date);
            });

            // Assign each event:
            // a unique ID (via map's index)
            // an integer denoting the number of days until the event starts
            // an integer denoting the number of days until the event ends
            events.forEach(function(x, index){
                var cur_time   = utime() / 86400;
                var start_time = utime(x.start_date) / 86400;
                var end_time = utime(x.end_date) / 86400;

                var days_until = Math.ceil(start_time - cur_time);
                var days_until_end = Math.ceil(end_time - cur_time);

                x.id = index;
                x.days_until = days_until;
                x.days_until_end = days_until_end;
            });

            return events;
        },


        // Teams
        teams: function(){
            return this.raw_teams
                
            // Sort by team number
            .sort(function(a, b){
                return a.team_number - b.team_number;
            });
        },


        // Matches
        matches: function(){

            // Sort by time
            var matches = this.raw_matches.sort(function(a, b){
                return a.time - b.time;
            })
            
            // Remove past matches
            .filter(function(x){
                return x.time - utime("", false) > 0;
            });

            // Extract teams
            matches.forEach(function(x){

                // Blue teams
                x.blue = [];
                for(var i=0;i<3;i++){
                    var str = x.alliances.blue.teams[i].substring(3);
                    x.blue.push(str);
                }

                // Red teams
                x.red = [];
                for(var i=0;i<3;i++){
                    var str = x.alliances.red.teams[i].substring(3);
                    x.red.push(str);
                }
            });

            return matches;
        },


        // Rankings
        rankings: function(){
            return this.raw_rankings
                
            // Remove the first element (its just label info from TBA)_
            .slice(1, this.raw_rankings.length)
                
            // Make a new array objects with only the data we want
            .map(function(x){
                return {
                    number: x[1],
                    place: x[0]
                }
            });
        },


        // Watched team standing
        watched_standing: function(){
            for(var i = 0;i < this.rankings.length;i++){
                if(this.rankings[i].number == this.watched_team)
                    return this.rankings[i].place;
            }
            return 0;
        },


        // Watches team matches
        watched_matches: function(){

            var that = this;

            return this.matches
                
            // Filter out matches the watched team is not in 
            .filter(function(x){
                return x.red.includes(that.watched_team) || x.blue.includes(that.watched_team);
            })

            // Get the first 3 matches
            .slice(0,3);
        }


    },
    methods: {


        // Select event
        select_event: function(e){

            // Get the event that the user clicked on
            var cur_event = this.events.filter(function(x){
                return x.id == e.currentTarget.getAttribute("data-id");
            })[0];

            // Get all of the streams associated with the selected event
            var streams = cur_event.webcast.filter(function(x){
                return x.type == "twitch" || x.type == "youtube";
            });

            // If there are no channels...
            if(streams.length == 0){
                alert("There are no streams associated with this event.");
                return;
            }

            var selected = 1;
            if(streams.length > 1){

                // Prompt the user to select an event
                var all_channels = streams.reduce(function(acc, x, index){
                    return acc + "\n" + (index + 1) + ": " + x.channel + "(" + x.type + ")";
                }, "");
                selected = window.prompt("There are multiple streams associated with this event; please select one to use:\n" + all_channels, "1");

                // If the user clicked cancel
                if(selected == null) return;

                // If the user did not input a valid channel number
                if(selected < 1 || selected > streams.length){
                    alert("That stream does not exist");
                    return;
                }
            }

            // Construct embed URL
            var url;
            switch(streams[selected-1].type){
                case "twitch":
                    url = "http://player.twitch.tv/?channel=";
                    break;
                case "youtube":
                    url = "https://www.youtube.com/embed/";
                    break;
            }
            url += streams[selected-1].channel;

            this.event_embed_url = url;     // Activate iframe
            this.event_key = cur_event.key; // Update event key

            this.update();
        },


        // Reset event
        reset_event: function(){
            this.event_key = null;
            this.reset_watched_team();

            this.raw_teams = [];
            this.raw_matches = [];
            this.raw_rankings = [];
        },


        // Select watched team
        select_watched_team: function(e){
            if(e.keyCode == 13){    // If enter was pressed
                if(this.event_key){ // If an event is selected

                    // Check if the supplied team is participating in the current event
                    var is_in_event = this.teams.map(function(x){
                        return x.team_number;
                    }).indexOf(parseInt(this.watched_team_tmp, 10)) != -1;

                    if(is_in_event)
                        this.watched_team = this.watched_team_tmp;
                    else
                        alert("Invalid team number.");
                }
                else{
                    alert("Please select an event.");
                }
            }
        },


        // Reset watched team
        reset_watched_team: function(){
            this.watched_team = null;
            this.watched_team_tmp = null;
        },


        // Is watched team
        is_watched_team: function(team){
            return this.watched_team == team;
        },


        // Update data from API
        update: function(){
            if(this.event_key){
                get_teams(this.event_key);
                get_matches(this.event_key);
                get_rankings(this.event_key);
            }
            else{
                get_events();
            }
        }


    },
    filters: {
        ordinal, // Ordinal suffix (1st, 2nd, etc.)
        date,    // Date string to 'Month day' (e.g. 'March 18th')
        time,    // Unix timestamp to pretty printed time
        uppercase: function(x){ return x.toUpperCase(); },


        // Given a Unix time, return the amount of time left until
        // then in this format: "<hours>h <minutes>m"
        time_until: function(x){
            var seconds       = x - utime("", false);
            var minutes_total = Math.ceil(seconds / 60);
            var minutes       = minutes_total % 60;
            var hours         = (minutes_total - minutes) / 60;
            if      (hours <=0 && minutes <= 0) return "Now!";
            else if (hours <= 0 && minutes > 0) return minutes + "m"; 
            else if (hours > 0 && minutes <= 0) return hours + "h";
            else                                return hours + "h " + minutes + "m";
        },


        // Left pad zeros
        pad_zeros: function(x){
            var str = "0000" + x;
            return str.substring(str.length - 4, str.length);
        }


    }
});
