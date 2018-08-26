const JsonResponse = require('./jsonResponse')
const express = require('express')
const TimeUtil = require('./timeUtil')
const cors = require('cors')
const bodyParser = require('body-parser')
const Moment = require('moment');


// Constants
const PORT = 8080
const HOST = '0.0.0.0'

const app = express()
app.use(cors());
app.use(bodyParser.json());

// Global routes
app.get('/tiempo', (req, res) => {
    const {Wit, log} = require('node-wit');

    const client = new Wit({
        accessToken: 'LLXW2VZK4DD4FSGLDRSEK36XOED6KCZ2',
        logger: new log.Logger(log.DEBUG) // optional
    });
    client.message(req.query.query, {}).then( function(result) {
        console.log(JSON.stringify(result));
        JsonResponse.sendResponse(res, result);
    });
});


app.get('/', (req, res) => {
    JsonResponse.sendResponse(res, { error: { message: "Please send POST request"} });
});

app.post('/', (req, res) => {

    const start = Moment();
    const googleCal = require('./google-calendar-adapter').module
    const { userBusy, startingAt, gapInMinutes, timeRequested } = req.body

    let newList = [];
    userBusy.map(item => {
        newList.push({ start: item.start.dateTime, end: item.end.dateTime })
    })
    const formatedUserBusy = newList;

    let calendar = {};
    googleCal.getEvents().then(list => {
        const untilWhen = Moment.duration(1, "day");
        const concatedList = list.concat(formatedUserBusy)
        const busyList = concatedList.sort((a, b) => {
            const momentA = Moment(a.start)
            const momentB = Moment(b.start)
            return momentA.diff(momentB);
        })

        const result = TimeUtil.getAvailableTimeSlot(busyList, timeRequested, untilWhen, gapInMinutes, startingAt);

        JsonResponse.sendResponse(res, result);
        const end = Moment();
        console.log("Takes " + end.diff(start))
    })

});

app.listen(PORT, HOST)
console.log(`Running on http://${HOST}:${PORT}`)



