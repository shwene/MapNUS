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

        // Extract path details
        const record = response.records[0]; // Get the first record
        const path = record.get("p"); // Get the path from the record

        // Extract nodes and relationships
        const nodes = path.segments.map(segment => segment.start.properties)
            .concat(path.segments.length ? [path.end.properties] : []);

        const edges = path.segments.map(segment => ({
            src: segment.start.properties.name,
            dest: segment.end.properties.name,
            distance: segment.relationship.properties.Distance,
            time_cost: segment.relationship.properties.Time_Cost,
            geometry: segment.relationship.properties.coordinates
        }));

        return { nodes, edges };

    } catch (err) {
        console.error("Error fetching shortest path:", err);
        return { error: "Internal Server Error" };
    } finally {
        await session.close();
    }
}
