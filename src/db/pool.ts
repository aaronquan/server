import { error } from 'console';
import mysql, { Pool } from 'mysql2';

//export const database = new DatabasePool() 

export class DatabasePool{
    connectionLimit: number;
    pool: Pool;
    constructor(config:mysql.ConnectionOptions, limit:number=10){
        this.connectionLimit = limit;
        this.pool = mysql.createPool({
            connectionLimit: this.connectionLimit,
            ...config
        });
        if(config.host) console.log('creating database pool for '+config.host);
    }
    selectAll(table:string, callback=(results:any, fields:any)=>{}, errorCallback=(err:any)=>{}){
        const query = 'SELECT * FROM ??';
        const inserts = mysql.format(query, [table]);
        this.runQuery(inserts,  callback, errorCallback);
    }
    simpleSelect(table:string, where:Record<string, any> | number=1, callback=(results:any, fields:any)=>{}, errorCallback=(err:any)=>{}){
        const query = 'SELECT * FROM ?? WHERE ?';
        const inserts = mysql.format(query, [table, where]);
        this.runQuery(inserts, callback, errorCallback);
    }
    simpleInsert(table:string, values:Record<string, any>, callback=(results:any, fields:any)=>{}, errorCallback=(err:any)=>{}){
        const query = 'INSERT INTO ?? SET ?';
        const inserts = mysql.format(query, [table, values]);
        //this.pool.query(inserts, queryCallback(callback, errorCallback));
        this.runQuery(inserts, callback, errorCallback);
    }
    simpleUpdate(table:string, values:Record<string, any>, where:Record<string, any>){
        const query = 'UPDATE ?? SET ? WHERE ?';
        const inserts = mysql.format(query, [table, values, where]);
        this.runQuery(inserts);
    }
    simpleDelete(table:string, values:Record<string, any>, callback:any, errorCallback:any){
        const query = 'DELETE FROM ?? WHERE ?';
        const inserts = mysql.format(query, [table, values]);
        this.runQuery(inserts, callback, errorCallback);
    }
    runQuery(query:string, callback=(results:any, fields:any)=>{}, errorCallback=(err:any)=>{}){
        const q = this.pool.query(query, queryCallback(callback, errorCallback));
        //console.log('running query: ', q.sql);
    }
    runQueryValues(query:string, values:any, callback=(results:any, fields:any)=>{}, errorCallback=(err:any)=>{}){
        const q = this.pool.query(query, values, queryCallback(callback, errorCallback));
    }
    runThrowQuery(query:string, values?:any, callback=(results:any, fields:any)=>{}){
        const q = values ? this.pool.query(query, values, queryThrowCallback(callback))
        : this.pool.query(query, queryThrowCallback(callback));
        //console.log('running query: ', q.sql);
    }
}

function fieldString(fields=['*']){

}

function queryThrowCallback(callback: (results:any, fields:any) => void){
    return function(error:any, results:any, fields:any){
        if(error) throw error;
        callback(results, fields);
    }
}

function queryCallback(callback: (results:any, fields:any) => void, 
errorCallback: (error:any) => void){
    return function(error:any, results:any, fields:any){
        if(error){
            console.log(error.message);
            errorCallback(error);
        }else{
            callback(results, fields);
        }
    }
}