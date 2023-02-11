import {ARApp} from "../src/ARApp";

const app = new ARApp();

var button = document.getElementById("start");
button.onclick = () =>
{
    app.start();
};
