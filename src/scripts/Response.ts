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