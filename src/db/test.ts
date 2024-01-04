import mysql, { Pool } from 'mysql2';


export function initialiseDatabaseConnection(){
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test',
    });
    connection.connect(function(err){
        console.log(err);
        return null;
    });
    return connection;
}

export async function testInsert(connection:any, callback:any, errorCallback:any){
    const query = await connection.query('INSERT INTO test SET ?', {string: 'metoo'}).then((result:any) => {
        console.log(result);
    }) 
    return query;
}


export function testGet(connection:any, callback:any, errorCallback:any){
    const query = connection.query('SELECT * FROM test',
        queryCallback(callback, errorCallback));
    console.log(query.sql);
}

export function testDelete(connection:any, callback:any, errorCallback:any){
    const query = connection.query('DELETE FROM test WHERE string=?', 'happy',
        queryCallback(callback, errorCallback));
    console.log(query.sql);
}

function queryCallback(callback:any, errorCallback:any){
    return function(error:any, results:any, fields:any){
        if(error){
            console.log(error.message);
            errorCallback(error);
        }else{
            //console.log(fields);
            callback(results, fields);
        }
    }
}