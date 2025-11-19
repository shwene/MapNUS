import neo4j from 'neo4j-driver';
import 'dotenv/config';

const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

export const getPlaces = async(origin, dest) => {
    const session = driver.session();

    try {
        const query = `
        MATCH p = shortestPath((a:Node{Name: $origin})-[:CONNECTED_TO*]->(b:Node{Name: $dest}))
        RETURN p
        `;

        const response = await session.run(query, { origin, dest });

        if (response.records.length === 0) {
            return { message: "No path found" };
        }

        return response;

    } catch (err) {
        console.error("Error fetching shortest path:", err);
        return { error: "Internal Server Error" };
    } finally {
        await session.close();
    }
}

export const getVenueCoordinate = async(venueName) => {
    const session = driver.session();

    try {
        const query = `
        MATCH (a:Node {Name: $venueName})
        RETURN a.Coordinate as coordinate
        `;

        const response = await session.run(query, { venueName });

        if (response.records.length === 0) {
            return { message: "Venue not found" };
        }

        const coordinate = response.records[0].get('coordinate');
        
        return { coordinate };

    } catch (err) {
        console.error("Error fetching venue coordinate:", err);
        return { error: "Internal Server Error" };
    } finally {
        await session.close();
    }
}

export const keepDatabaseAlive = async () => {
    const session = driver.session();

    try {
        const query = `
        MERGE (keep:KeepAlive {id: 'ping'})
        SET keep.lastPing = timestamp()
        RETURN keep.lastPing as lastPing
        `;

        const response = await session.run(query);
        const lastPing = response.records[0].get('lastPing');

        return { success: true, lastPing: lastPing.toString() };

    } catch (err) {
        console.error("Error keeping database alive:", err);
        return { error: "Failed to keep database alive" };
    } finally {
        await session.close();
    }
}
