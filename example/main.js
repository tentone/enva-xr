import {ARRenderer} from "../src/ARRenderer";

const app = new ARRenderer();
app.initialize();

const gui = new GUI(app);
gui.create();

