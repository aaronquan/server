import {SandSim, SandSimUpdates, Emmiter} from './sims';
import {sendJson} from '../scripts/Response';
import NodeCache from "node-cache"; 

const tickTime = 32;

function initSim(cache:NodeCache){
    const sim = new SandSim(50, 50);
    const emmiter = new Emmiter(3);
    emmiter.setPosition(25,0);
    sim.setEmmiter(emmiter);
    cache.set<SandSim>('sandsim', sim);

    const simUpdates = new SandSimUpdates();
    cache.set<SandSimUpdates>('simupdates', simUpdates)
}

export function sims(app:any, cache:NodeCache){
    if(!cache.has('sandsim')){
        initSim(cache);
    }
    setInterval(() => {
        const sim:SandSim | undefined = cache.get('sandsim');
        const simUpdates:SandSimUpdates | undefined = cache.get('simupdates');
        if(sim && simUpdates){
            sim.update(simUpdates);
            sim.step();
            simUpdates.clear();
        }
        cache.set('sandsim', sim);
        cache.set('simupdates', simUpdates);
    }, tickTime);
    app.get('/sandsim', (req:any, res:any) => {
        const sim:SandSim | undefined  = cache.get('sandsim');
        if(sim){
            const grid = sim.grid.grid;
            sendJson(res, {objects: sim.getObjects(), colours: sim.colours()});
        }
        sendJson(res);
    });

    app.post('/sandsim', (req:any, res:any) => {
        const sim:SandSim | undefined  = cache.get('sandsim');
        if(sim){
            const grid = sim.grid.grid;
            sendJson(res, {objects: sim.getObjects(), colours: sim.colours()});

            //updates for user input
            if('updates' in req.body){
                const upd = cache.get<SandSimUpdates>('simupdates');
                if(upd){
                    upd.updates(req.body.updates);
                    if(req.body.updates.wallAdds.length > 0) console.log(req.body.updates);
                    /*
                    if('walls' in req.body.updates){
                        //console.log(req.body.updates);
                        req.body.update.wallAdds.forEach((wall) => {
                            upd.addWallAdds(wall[0], wall[1]);
                        })
                    }*/

                    cache.set<SandSimUpdates>('simupdates', upd);
                }
            }
        }
        else{
            sendJson(res);
        }
    });

    app.get('/resetsim', (req:any, res:any) => {
        initSim(cache);
        res.json({});   
    });

    app.get('/sandsimconnect', (req:any, res:any) => {
        const sim:SandSim | undefined = cache.get('sandsim');
        if(sim) res.json({width:sim.width, height:sim.height});
        else{
            res.json({});  
        }
    })
}