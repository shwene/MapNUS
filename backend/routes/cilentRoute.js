//map HTTP request from server.js to different GET methods in Controller
import express from 'express';
import * as cilentController from "../controllers/cilentController.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.send('<h1>Hello World Nice</h1>');
});

router.get('/map/path', cilentController.getPlaces);

export default router;
