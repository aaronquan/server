
import { DatabasePool } from "./pool";

export const connection = new DatabasePool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test',
});

export const deleteGuests = () => {
    console.log('deleting guests');
    connection.runQueryValues('DELETE FROM guests WHERE expire < ?', {expire: Date.now()}, 
    (results, fields) => {
        console.log(results);
        console.log(fields);
    });
};