const Moment = require('moment');
const MomentRange = require('moment-range');

const moment = MomentRange.extendMoment(Moment);

function getOverlap(list, eventRange){
    var counter = 0;

    for (let index = 0; index < list.length; index++) {
        const elementRange = moment.range(list[index].start, list[index].end);
        if (eventRange.overlaps(elementRange)){
            return elementRange;
        }
    }

    return null;
}

function getAvailableTimeSlot(occupationList, timeRequested = 30, untilWhen, gapInMinutes = 1, startingAt) {
    
    if (!occupationList || !timeRequested || !untilWhen) {
        throw {
            message: "one of the params is null"
        }
    }

    const eventDuration = moment.duration(timeRequested, "minutes")
    let cursorDateTime = moment();
    if (startingAt && moment(startingAt).isAfter(cursorDateTime)) {
        cursorDateTime = moment(startingAt)
    }
    cursorDateTime.seconds(0)
    cursorDateTime.milliseconds(0)
    let cloned = cursorDateTime.clone();
    const untilWhenTime = cloned.add(untilWhen)
    let eventRange = null;
    let freeTime = [];

    let index = 0

    while (cursorDateTime < untilWhenTime) {
        const endTime = cursorDateTime.clone().add(eventDuration)
        newEventRange = moment.range(cursorDateTime, endTime)

        while (cursorDateTime.isAfter(moment(occupationList[index].start))) {
            index++;
        }
        //console.log("break :" + (index > occupationList.length));
        if (index >= occupationList.length - 1) {
            index = occupationList.length - 1;
        }
        const calEvent = occupationList[index];
        const calEventRange = moment.range(calEvent.start, calEvent.end)

        console.log("Cursor: " + cursorDateTime.toString());
        /*console.log("newEventRange: " + newEventRange.toString());
        console.log("calEvent[" + index + "]: " + calEventRange.toString());
        console.log("overlap: " + newEventRange.overlaps(calEventRange));
        */

       const overlapRange = getOverlap(occupationList, newEventRange)

        if (!overlapRange && newEventRange.end.isBefore(untilWhenTime)) {
            freeTime.push({
                start: newEventRange.start.toJSON(),
                end: newEventRange.end.toJSON()
            });
            cursorDateTime.add(gapInMinutes, "minute");
            //console.log("check next min");
        } else {
            index++;
            if (!overlapRange || endTime.isAfter(overlapRange.end)) {
                cursorDateTime = endTime;
            } else {
                cursorDateTime = overlapRange.end;
            }
        }

        //console.log("-----------------------");

    }

    return freeTime;

}


module.exports = {
    getAvailableTimeSlot
}