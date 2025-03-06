//interact with neo4j db
import neo4j from 'neo4j-driver';
import 'dotenv/config';

const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic(username, password));

export const getPlaces = async() => {
    const session = driver.session();

    const response = await session.run("MATCH (n) RETURN n");
    
    session.close();

    const records = response.records.map((record) => {
        const node = record.toObject().n;
        return {
            name: node.properties.name,
            x: node.properties.coordinates.x,
            y: node.properties.coordinates.y
        };
    });

    return records;
}
