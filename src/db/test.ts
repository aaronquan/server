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

export async function testInsert(connection, callback, errorCallback){
    /*const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test',
    });
    connection.connect(function(err){
        console.log(err);
    });*/

    const query = await connection.query('INSERT INTO test SET ?', {string: 'metoo'}).then(result => {
        console.log(result);
    }) 
    /*function(error, results, fields) {
        if(error){
            console.log(error.message);
            errorCallback(error);
        }else{
            console.log(fields);
            callback(results, fields);
        }
    });*/
    //console.log(query.sql);
    return query;
    //connection.end();
}

//not working (connection.query not a promise)
/*
export function testSelect(connection){
    let r = null;
    connection.query('SELECT * FROM test')
    .then(result => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });
    return r;
}*/

export function testGet(connection, callback, errorCallback){
    const query = connection.query('SELECT * FROM test',
        queryCallback(callback, errorCallback));
    console.log(query.sql);
}

export function testDelete(connection, callback, errorCallback){
    const query = connection.query('DELETE FROM test WHERE string=?', 'happy',
        queryCallback(callback, errorCallback));
    console.log(query.sql);
}

function queryCallback(callback, errorCallback){
    return function(error, results, fields){
        if(error){
            console.log(error.message);
            errorCallback(error);
        }else{
            //console.log(fields);
            callback(results, fields);
        }
    }
}