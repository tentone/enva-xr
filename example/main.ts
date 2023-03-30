import {BoxGeometry, Mesh, MeshBasicMaterial} from "three";
import {ARRenderer} from "../src/ARRenderer";

const renderer = new ARRenderer();

const box = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
box.scale.setScalar(0.1);
renderer.scene.add(box);


renderer.onFrame = function() {
    box.rotation.y += 0.01;
};

// const gui = new GUI(app, app.domContainer);
// gui.create();

var button = document.getElementById("start");
button.onclick = () =>
{
    renderer.start();
};
