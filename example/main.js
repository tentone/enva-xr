import {ARApp} from "../src/ARApp";
import {GUI} from "./gui";

const app = new ARApp();

const gui = new GUI(app, app.domContainer);
gui.create();

var button = document.getElementById("start");
button.onclick = () =>
{
    app.initialize();
};
