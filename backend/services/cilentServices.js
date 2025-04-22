//interact with neo4j db
import neo4j from 'neo4j-driver';
import 'dotenv/config';

const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic(username, password));

export const getPlaces = async(origin, dest) => {
    const session = driver.session();

    try {
        const query = `
        MATCH p=shortestPath((a:Room {name: $origin})-[:CONNECTS_TO*]-(b:Room {name: $dest}))
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
