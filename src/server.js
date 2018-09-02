const JsonResponse = require('./jsonResponse')
const express = require('express')
const TimeUtil = require('./timeUtil')
const cors = require('cors')
const bodyParser = require('body-parser')
const Moment = require('moment');
const MongoClient = require('mongodb').MongoClient



// Constants
const PORT = 8080
const HOST = '0.0.0.0'

const app = express()
// Connection URL
const url = 'mongodb+srv://TimeIn:Aa123456@timein-hptkt.mongodb.net/';
var db;

MongoClient.connect(url, (err, client) => {
    if (err) return console.log(err)
    db = client.db('TimeIn') // whatever your database name is
    app.use(cors());
    app.use(bodyParser.json());

    app.get('/Businesses/:name', (req, res) => {
        db.collection('Business').find({ 'name': req.params.name }).toArray((err, result) => {
            if (err) return console.log(err)
            // renders index.ejs
            res.json({ businesses: result });
        })
    });

    app.post('/Businesses', (req, res) => {
        // Get the documents collection
        const collection = db.collection('Business');
        // Insert some documents
        collection.insertOne(req.body, function (err, result) {
            res.json(result);
        });
    });

    // Global routes
    app.get('/tiempo', (req, res) => {
        const { Wit, log } = require('node-wit');

        const client = new Wit({
            accessToken: 'LLXW2VZK4DD4FSGLDRSEK36XOED6KCZ2',
            logger: new log.Logger(log.DEBUG) // optional
        });
        client.message(req.query.query, {}).then(function (result) {
            if(result.entities.intent && result.entities.service && result.entities.business && result.entities.datetime){
                var date = new Date(Date.parse(result.entities.datetime[0].value));
                response = {
                    intent: result.entities.intent[0].value,
                    service: result.entities.service[0].value,
                    business: result.entities.business[0].value,
                    date: date,
                    text: `Are you sure you want to ${result.entities.intent[0].value} ${result.entities.service[0].value} at ${result.entities.business[0].value} for ${date.getDate()}/${date.getMonth()+1}?`
                }
                JsonResponse.sendResponse(res, response)
            } else {
                JsonResponse.sendResponse(res, result);
            }
        });
    });

    app.get('/', (req, res) => {
        JsonResponse.sendResponse(res, { error: { message: "Please send POST request" } });
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
})
