
module.exports.sendResponse = (res, json) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(json, null, 4));
    return res;
}