<?php

// Stylesheets ('style/*' included automatically)
$stylesheets = [
    "https://fonts.googleapis.com/css?family=Droid+Sans", // Google Fonts: Droid Sans
    "fonts/font-awesome-4.7.0/css/font-awesome.min.css",  // Font Awesome
];

// Scripts
$scripts = [
    "https://unpkg.com/vue", // Vue JS
    "script/lib.js",         // Custom JS library
    "script/api.js",         // TBA API
    "script/state.js"        // Global app state
];

// Links
$links = [
    "2017 Game Manual"      => "https://firstfrc.blob.core.windows.net/frc2017/Manual/2017FRCGameSeasonManual.pdf",
    "2017 Challenge Video"  => "https://www.youtube.com/watch?v=RwwnbLSW6hY&feature=youtu.be&t=798",
    "The Blue Alliance API" => "https://www.thebluealliance.com/apidocs"
];

// Footer text
$footer = "Copyright &copy; " . date("Y") . " Nick Barkhuff. All Rights Reserved.";

?>



<!DOCTYPE html>
<html lang="en">
<head>
    <title>FRC Stream Dashboard</title> 
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width">

    <!-- Stylesheets -->
    <?php foreach(array_merge($stylesheets, glob("style/*")) as $path): ?>
        <link type='text/css' rel='stylesheet' href='<?= $path ?>'>
    <?php endforeach; ?>

</head>
<body onload="state.update();setInterval(state.update,5000)">
    <div id="app">
        <div id="content">

            <!-- Left Sidebar -->
            <div id="left" class="bubble sidebar">

                <!-- Leaderboard -->
                <h3 class="top-header" v-if="rankings.length">Leaderboard</h3>
                <h3 class="top-header" v-else>Teams</h3>
                <div id="leaderboard">
                    <ul v-if="rankings.length">
                        <li v-for="team in rankings" style="display:flex">
                            <span style="flex:1" :class="{watching: is_watched_team(team.team_number)}">{{team.place|ordinal}} - {{team.number}}</span>
                        </li>
                    </ul>
                    <ul v-else>
                        <li v-for="team in teams" style="display:flex">
                            <span style="flex:1" :class="{watching: is_watched_team(team.team_number)}">
                                <strong>{{team.team_number}}</strong> (<a :href="team.website" target="_blank">{{team.nickname}}</a>)
                            </span>
                        </li>
                    </ul>
                </div>

                <!-- Watching -->
                <div id="watching">
                <hr>
                    <div v-if="!watched_team">
                        <h3>Watching</h3>
                        <input type="text" v-model="watched_team_tmp" v-on:keyup="select_watched_team">
                        <p>Enter a team here to track their progress and upcoming matches.</p>
                    </div>
                    <div v-else>
                        <h3>Watching (<a v-on:click="reset_watched_team" title="Change team" class="watching">#{{watched_team}}</a>)</h3>
                        <div v-if="watched_standing">
                            <div style="font-size: 2em"><strong>{{watched_standing | ordinal}}</strong> Place</div>
                            <div style="font-size: 1.2em">(out of {{teams.length}})</div>
                        </div>
                        <div v-else>
                            Stats will be displayed when they are available.
                        </div>
                        <br>
                        <div><strong>Upcoming Matches: </strong></div>
                        <ul>
                            <li v-for="match in watched_matches">
                                {{ match.comp_level | uppercase }}{{ match.match_number }} at {{ match.time | time }} ({{ match.time | time_until }})
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Center -->
            <div id="center">

                <!-- Event Selection / Stream -->
                <div id="stream">
                    <iframe v-if="event_key"
                            :src="event_embed_url"
                            frameborder="0"
                            scrolling="no"
                            allowfullscreen="true">
                    </iframe>
                    <div v-else style="height: 100%">
                        <div style="height: 50px">
                            Filter events: <input type="text" v-model="event_search">
                            <hr>
                        </div>
                        <div style="height: calc(100% - 50px); overflow-y:scroll;">
                            <ul>
                                <li v-for="event in events" :data-id="event.id" v-on:click="select_event" v-if="event.days_until_end >= 0" style="display:flex">
                                    <div style="flex:1" v-if="event.days_until <= 0" class="active">In Progress</div>
                                    <div style="flex:1" v-else-if="event.days_until == 1">In 1 day</div>
                                    <div style="flex:1" v-else>In {{event.days_until}} days</div>
                                    <div style="flex:4">{{event.name}}</div>
                                    <div style="flex:2">{{event.event_type_string}}</div>
                                    <div style="flex:3">{{event.location}}</div>
                                    <div style="flex:2">{{event.start_date|date}} to {{event.end_date|date}}</div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- General Info -->
                <div id="bottom" class="bubble"></div>
            </div>

            <!-- Right Sidebar -->
            <div id="right" class="bubble sidebar">

                <!-- Matches -->
                <h3 class="top-header">Upcoming Matches</h3>
                <div id="matches">
                    <div v-if="event_key">
                        <ul>
                            <li v-for="match in matches">
                                <strong>
                                    {{ match.comp_level | uppercase }}{{ match.match_number }} at {{ match.time | time }} <br>
                                    ({{ match.time | time_until }}) <br>
                                </strong>
                                <div v-for="n in 3">
                                    <span class="red" :class="{watching: is_watched_team(match.red[n-1])}">{{match.red[n-1] | pad_zeros}}</span>
                                    &nbsp;-&nbsp;
                                    <span class="blue" :class="{watching: is_watched_team(match.blue[n-1])}">{{match.blue[n-1] | pad_zeros}}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div v-else></div>
                </div>

                <!-- Links -->
                <div id="links">
                    <hr>
                    <h3>Links</h3>
                    <ul>
                        <?php foreach($links as $name => $url): ?>
                            <li><a target='_blank' href='<?= $url ?>'><?= $name ?></a></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div id="footer">
            <span v-on:click="reset_event">
                <i class="fa fa-rotate-left" title="Select another event"></i>
            </span>
            <span><?= $footer ?></span>
            <span>
                <a target="_blank" href="https://www.github.com/nickbarkhuff/frc-streamer">
                    <i class="fa fa-github" title="GitHub source code"></i>
                </a>
            </span>
        </div>
    </div>
</body>
</html>

<!-- Scripts -->
<?php foreach($scripts as $path): ?>
    <script src="<?= $path ?>"></script>
<?php endforeach; ?>
