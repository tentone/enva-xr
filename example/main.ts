import {BoxGeometry, LightProbe, Mesh, MeshBasicMaterial, MeshPhysicalMaterial} from "three";
import {ARRenderer, Cursor} from "../src/Main";

const renderer = new ARRenderer();

let box: Mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
box.scale.setScalar(0.1);
renderer.scene.add(box);


box = new Mesh(new BoxGeometry(), new MeshPhysicalMaterial());
box.scale.setScalar(0.1);
box.position.set(0, 0, -1);
renderer.scene.add(box);

// const probe = new LightProbe();
// renderer.scene.add(probe);

// const cursor = new Cursor();
// renderer.scene.add(cursor);

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
