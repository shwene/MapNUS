//recieve data from cilentRoute, use functioanlity from cilentServices
import * as cilentServices from "../services/cilentServices.js";

export const getPlaces = async (req, res) => {
    try {
        const { origin, dest } = req.query;
        
        if (!origin || !dest) {
            return res.status(400).json({ message: "Missing origin or destination parameter" });
        }

        const pathDetails = await cilentServices.getPlaces(origin, dest);
        res.status(200).json(pathDetails);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}
