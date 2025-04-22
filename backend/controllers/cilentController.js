//recieve data from cilentRoute, use functioanlity from cilentServices
import * as cilentServices from "../services/cilentServices.js";

export const getPlaces = async (req, res) => {
    try {
        const { origin, dest } = req.query;
        
        if (!origin || !dest) {
            return res.status(400).json({ message: "Missing origin or destination parameter" });
        }

        const pathDetails = await cilentServices.getPlaces(origin, dest);

        // Extract path details
        const record = pathDetails.records[0];
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

        const shortestPathDetails = { 
            nodes, 
            edges, 
            total_distance: totalDistance,  // Total in meters
            total_time_cost: totalTimeCost  // Total in seconds
        };


        res.status(200).json(shortestPathDetails);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}
