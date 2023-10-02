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

export function sims(app, cache:NodeCache){
    if(!cache.has('sandsim')){
        initSim(cache);
    }
    setInterval(() => {
        const sim:SandSim = cache.get('sandsim');
        const simUpdates:SandSimUpdates = cache.get('simupdates');
        sim.update(simUpdates);
        sim.step();
        simUpdates.clear();
        cache.set('sandsim', sim);
        cache.set('simupdates', simUpdates);
    }, tickTime);
    app.get('/sandsim', (req, res) => {
        const sim:SandSim = cache.get('sandsim');
        const grid = sim.grid.grid;
        sendJson(res, {objects: sim.getObjects(), colours: sim.colours()});
    });

    app.post('/sandsim', (req, res) => {
        const sim:SandSim = cache.get('sandsim');
        
        const grid = sim.grid.grid;
        sendJson(res, {objects: sim.getObjects(), colours: sim.colours()});

        //updates for user input
        if('updates' in req.body){
            const upd = cache.get<SandSimUpdates>('simupdates');
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
    });

    app.get('/resetsim', (req, res) => {
        initSim(cache);
        res.json({});   
    });

    app.get('/sandsimconnect', (req, res) => {
        const sim:SandSim = cache.get('sandsim');
        res.json({width:sim.width, height:sim.height});
    })
}