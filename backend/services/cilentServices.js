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
        const record = response.records[0];
        const path = record.get("p");

        // Extract nodes
        const nodes = path.segments.map(segment => segment.start.properties)
            .concat(path.segments.length ? [path.end.properties] : []);

        // Extract edges and calculate total values
        let totalDistance = 0;
        let totalTimeCost = 0;

        const edges = path.segments.map(segment => {
            const distance = segment.relationship.properties.distance || 0;
            const time_cost = segment.relationship.properties.time_cost || 0;
            
            totalDistance += distance;
            totalTimeCost += time_cost;

            return {
                src: segment.start.properties.name,
                dest: segment.end.properties.name,
                distance,
                time_cost,
                geometry: segment.relationship.properties.coordinates || [],
                layer: segment.end.properties.layer || "Unknown"
            };
        });

        return { 
            nodes, 
            edges, 
            total_distance: totalDistance,  // Total in meters
            total_time_cost: totalTimeCost  // Total in seconds
        };

    } catch (err) {
        console.error("Error fetching shortest path:", err);
        return { error: "Internal Server Error" };
    } finally {
        await session.close();
    }
}
