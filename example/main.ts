import {BoxGeometry, Mesh, MeshBasicMaterial} from "three";
import {ARRenderer} from "../src/ARRenderer";

const renderer = new ARRenderer();

const box = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
renderer.scene.add(box);

// const gui = new GUI(app, app.domContainer);
// gui.create();

var button = document.getElementById("start");
button.onclick = () =>
{
    renderer.start();
};
