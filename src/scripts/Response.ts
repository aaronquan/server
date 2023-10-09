import { Response, Request } from "express";

type serverTimes = {
    incoming: number;
    outgoing: number;
    processing_time: number;
    ping_in: number;
}

type defaultResponseFields = {
    serverTimes: serverTimes;
    success: boolean;
}

const defFields:defaultResponseFields = {
    serverTimes: {
        incoming: Date.now(),
        outgoing: 0,
        processing_time: 0,
        ping_in: 0
    },
    success: false
};

export function updateDefFields(req:Request){
    defFields.serverTimes.incoming = Date.now();
    if(req.query.time){
        const n:number = parseInt(req.query.time as string);
        defFields.serverTimes.ping_in = defFields.serverTimes.incoming - n;
    }
    //defFields.serverTimes.ping_in = defFields.serverTimes.incoming - req.query.time;
    defFields.success = true;
}

export function sendJson(res:Response, json:any={}){
    defFields.serverTimes.outgoing = Date.now();
    defFields.serverTimes.processing_time = defFields.serverTimes.outgoing - defFields.serverTimes.incoming;
    res.json({...defFields, ...json});
};

//https://stackoverflow.com/questions/4810841/pretty-print-json-using-javascript
//not working
function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}