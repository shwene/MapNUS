//recieve data from cilentRoute, use functioanlity from cilentServices
import * as cilentServices from "../services/cilentServices.js";

export const getPlaces = async (req, res) => {
    try {
        const places = await cilentServices.getPlaces();
        res.status(200).json(places);
    } catch (err) {
        res.status(500).json({message: "Internal Server Error"});
    }
}
