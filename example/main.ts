import {AmbientLight, BoxGeometry, Mesh, MeshPhysicalMaterial, SphereGeometry, Vector2, Vector3} from "three";
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

const ambient = new AmbientLight(0x333333);
renderer.scene.add(ambient);

const probe = new LightProbe();
renderer.scene.add(probe);

// const planes = new Planes();
// renderer.scene.add(planes);

const floor = new FloorPlane();
renderer.scene.add(floor);

const ruler = new Measurement([new Vector3(0, 0, 0), new Vector3(1, 0, -2)]);
renderer.scene.add(ruler);

const cursor = new Cursor();
renderer.scene.add(cursor);

renderer.domContainer.onclick = function(event: MouseEvent) {
    const size = new Vector2(window.innerWidth, window.innerHeight);
    const pos = new Vector2(event.clientX, event.clientY);
    const normalized = new Vector2((pos.x / size.x) * 2 - 1, (-pos.y / size.y) * 2 + 1);

    console.log('enva-xr: Normalized coordinates', normalized, pos, size);

    const intersections = renderer.raycast(normalized);
    if (intersections.length > 0) {
        console.log('enva-xr: Raycast results', intersections);
    }
};

renderer.domContainer.ondblclick = function(event: MouseEvent) {
    if (cursor.visible) {
        let sphere = new Mesh(new SphereGeometry(), new MeshPhysicalMaterial({color: (Math.random() * 0xFFFFFF)}));
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
