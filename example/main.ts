import {AmbientLight, BoxGeometry, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, SphereGeometry, TextureLoader, Vector2} from "three";
import {ARRenderer, Cursor, LightProbe, FloorPlane, AugmentedBasicMaterial, AugmentedMaterial} from "../src/Main";

(async function (): Promise<void> {
	const renderer = new ARRenderer({
		depthSensing: true,
		depthTexture: true,
		lightProbe: true
	});

	let loader = new TextureLoader();
	let texture = await loader.loadAsync('assets/texture/ball/color.jpg');

	let material: any = new MeshPhysicalMaterial({map: texture, color: (Math.random() * 0xFFFFFF)});
	material = AugmentedMaterial.transform(material);

	let box = new Mesh(new BoxGeometry(), material);
	box.receiveShadow = true;
	box.castShadow = true;
	box.scale.setScalar(0.4);
	box.position.set(0, 0, -2);
	renderer.scene.add(box);

	// const ambient = new AmbientLight(0x111111);
	// renderer.scene.add(ambient);

	const probe = new LightProbe();
	renderer.scene.add(probe);

	// const planes = new Planes();
	// renderer.scene.add(planes);

	const floor = new FloorPlane();
	renderer.scene.add(floor);

	// const ruler = new Measurement([new Vector3(0, 0, 0), new Vector3(1, 0, -2)]);
	// renderer.scene.add(ruler);

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
			let material: any = new MeshPhysicalMaterial({color: (Math.random() * 0xFFFFFF)});
			material = AugmentedMaterial.transform(material);
			
			let sphere = new Mesh(new SphereGeometry(), material);
			sphere.receiveShadow = true;
			sphere.castShadow = true;
			sphere.scale.setScalar(0.1);
			sphere.position.copy(cursor.position);
			sphere.position.y += sphere.scale.y / 2.0;
			renderer.scene.add(sphere);
		}
	};

	renderer.onFrame = function(time: number, renderer: ARRenderer) {
		// if (renderer.xrDepth.length > 0) {
		// 	material.updateMaterial(renderer);
		// }
		// box.rotation.x += 0.01;
	};

	var button = document.getElementById("start");
	button.onclick = () =>
	{
		renderer.start();
	};

})();
