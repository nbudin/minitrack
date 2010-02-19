var db;
var logDate;

function initDatabase() {
    if (!window.openDatabase) {
        alert("Your browser doesn't support offline databases, which miniTrack requires to function.");
    }

    db = window.openDatabase("minitrack", "", "Trackr Calorie database", 1048576);
    db.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS calorie_entries(\n\
                           id INTEGER PRIMARY KEY autoincrement,\n\
                           timestamp INTEGER,\n\
                           calories INTEGER,\n\
                           description TEXT\n\
                       );");
    });
}

function getDayStart() {
    var dayStart = new Date();
    dayStart.setMilliseconds(0);
    dayStart.setSeconds(0);
    dayStart.setMinutes(0);
    dayStart.setHours(0);

    return dayStart;
}

function updateCount() {
    var dayStart = getDayStart();
    db.transaction(function(tx) {
        tx.executeSql("SELECT SUM(calories) total FROM calorie_entries WHERE timestamp >= ?;",
                      [dayStart.getTime()], function (tx, results) {
                          var total = results.rows.item(0).total;
                          if (total) {
                              $('#currentCount').html(total);
                          }
        });
    })
}

function addCalories() {
    var $input = $(this).find("input[name=calories]");
    var calories = parseInt($input.val());
    var description = $(this).find("input[name=description]").val();
    if (calories) {
        var now = new Date().getTime();
        db.transaction(function(tx) {
            tx.executeSql("INSERT INTO calorie_entries (timestamp, calories, description) \n\
                           VALUES (?, ?, ?);",
                          [now, calories, description]);
        });

        $(this).find("input").val("");
        $input.focus();

        updateCount();
    } else {
        alert("Please enter a number of calories to add.");
    }

    return false;
}

function getLogDate() {
    if (logDate == null)
        logDate = getDayStart();

    return logDate;
}

function generateLogEntry(timestamp, calories, description) {
    var date = new Date(timestamp);
    var hours = date.getHours();

    var humanTime = "";
    if (hours == 0) {
        humanTime += "12"
    } else if (hours > 12) {
        humanTime += (hours - 12);
    } else {
        humanTime += hours;
    }
    humanTime += ":" + date.getMinutes();
    if (hours < 12) {
        humanTime += " AM";
    } else {
        humanTime += " PM";
    }

    return $("<tr>" +
             "<td>" + humanTime + "</td>" +
             "<td>" + calories + "</td>" +
             "<td>" + description + "</td>" +
             "</tr>");
}

function updateLog() {
    var logStart = getLogDate();
    var logEnd = new Date(logStart.getTime());
    logEnd.setDate(logStart.getDate() + 1);

    $('#logDate').html(logStart.toLocaleDateString());

    var $log = $('#logTable');
    $log.children(":not(:first)").remove();
    db.transaction(function(tx) {
        tx.executeSql("SELECT timestamp, calories, description FROM calorie_entries\n\
                       WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp;",
                      [logStart.getTime(), logEnd.getTime()], function (tx, results) {
                          for (var i=0; i<results.rows.length; i++) {
                              var row = results.rows.item(i);
                              $log.append(generateLogEntry(row.timestamp, row.calories, row.description));
                          }
                      });
    });
}

var jQT = new $.jQTouch({
    preloadImages: [

    ]
});

$(function() {
    initDatabase();
    $("form#addCalories").bind("submit", addCalories);

    updateCount();
    updateLog();
});