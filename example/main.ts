import {BoxGeometry, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, SphereGeometry, Vector3, PointLight} from "three";
import {ARRenderer, Cursor, LightProbe, Measurement, Planes, FloorPlane} from "../src/Main";

const renderer = new ARRenderer();

let box: Mesh = new Mesh(new BoxGeometry(), new MeshPhysicalMaterial());
box.receiveShadow = true;
box.castShadow = true;
box.scale.setScalar(0.1);
box.position.set(0, 0, 1);
renderer.scene.add(box);

box = new Mesh(new BoxGeometry(), new MeshPhysicalMaterial());
box.receiveShadow = true;
box.castShadow = true;
box.scale.setScalar(0.1);
box.position.set(0, 0, -1);
renderer.scene.add(box);

const probe = new LightProbe();
renderer.scene.add(probe);

const planes = new Planes();
renderer.scene.add(planes);

const floor = new FloorPlane();
renderer.scene.add(floor);

const light = new PointLight(0xFFFFFF);
light.position.set(0, 3, -2);
light.shadow.autoUpdate = true;
light.shadow.mapSize.set(1024, 1024);
light.shadow.camera.far = 20;
light.shadow.camera.near = 0.1;
light.castShadow = true;
renderer.scene.add(light);

const ruler = new Measurement([new Vector3(0, 0, 0), new Vector3(1, 0, -2)]);
renderer.scene.add(ruler);

const cursor = new Cursor();
renderer.scene.add(cursor);

renderer.domContainer.onclick = function() {
    if (cursor.visible) {
        let sphere = new Mesh(new SphereGeometry(), new MeshPhysicalMaterial());
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.scale.setScalar(0.1);
        sphere.position.copy(cursor.position);
        sphere.position.y += sphere.scale.y / 2.0;
        renderer.scene.add(sphere);
    }
};

renderer.onFrame = function() {
    box.rotation.y += 0.01;
};

var button = document.getElementById("start");
button.onclick = () =>
{
    renderer.start();
};
