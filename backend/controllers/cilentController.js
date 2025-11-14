import * as cilentServices from "../services/cilentServices.js";
import { processPath } from "../utils/pathUtils.js";

export const getPlaces = async (req, res) => {
    try {
        const { origin, dest } = req.query;
        if (!origin || !dest) return res.status(400).json({ message: "Missing origin or destination" });

        const pathDetails = await cilentServices.getPlaces(origin, dest);
        if (!pathDetails.records || !pathDetails.records.length) {
            return res.status(404).json({ message: "No path found" });
        }

        const path = pathDetails.records[0].get("p");
        const shortestPathDetails = processPath(path);

        res.status(200).json(shortestPathDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getVenueCoordinate = async (req, res) => {
    try {
        const { venueName } = req.params;
        if (!venueName) return res.status(400).json({ message: "Missing venue name" });

        const venueData = await cilentServices.getVenueCoordinate(venueName);
        
        if (venueData.message === "Venue not found") {
            return res.status(404).json({ message: "Venue not found" });
        }
        
        if (venueData.error) {
            return res.status(500).json({ message: venueData.error });
        }

        res.status(200).json({ coordinate: venueData.coordinate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
