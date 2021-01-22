
/**
 * Application user interface.
 */
export class GUI {
	constructor()
	{

	}

	create()
	{

		container = document.createElement("div");
		container.style.position = "absolute";
		container.style.top = "0px";
		container.style.left = "0px";
		container.style.width = "100%";
		container.style.height = "100%";
		document.body.appendChild(container);

		container.appendChild(GUIUtils.createButton("./assets/icon/ruler.svg", function()
		{
			if (cursor.visible)
			{
				if (measurement)
				{
					measurement = null;
				}
				else
				{
					var position = new Vector3();
					position.setFromMatrixPosition(cursor.matrix);
					measurement = new Measurement(position);
					scene.add(measurement);
				}
			}
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/stopwatch.svg",  () =>
		{
			performanceCounterFull = [];
			performanceCounterRender = [];
			performanceCounterEnabled = true;
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/shadow.svg",  () =>
		{
			this.changeShadowType();
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/bug.svg", () =>
		{
			this.toggleDebugMode();
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/3d.svg", function()
		{
			debugDepth = !debugDepth;
			depthCanvas.style.display = debugDepth ? "block" : "none";
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/911.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/car/scene.gltf", scene, new Euler(0, 0, 0), 0.003);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/bottle.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/WaterBottle.glb", scene, new Euler(0, 0, 0), 1.0);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/tripod.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/AntiqueCamera.glb", scene, new Euler(0, 0, 0), 0.1);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/dots.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/MetalRoughSpheresNoTextures.glb", scene, new Euler(0, 0, 0), 100.0);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/fish.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/BarramundiFish.glb", scene, new Euler(0, 0, 0), 1.0);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/flower.svg",  () =>
		{
			this.loadGLTFMesh("./assets/3d/flower/scene.gltf", scene, new Euler(0, 0, 0), 0.007);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/rocks.svg", () =>
		{
			if(pose !== null)
			{
				var viewOrientation = pose.transform.orientation;
				var viewPosition = pose.transform.position;

				var orientation = new Quaternion(viewOrientation.x, viewOrientation.y, viewOrientation.z, viewOrientation.w);

				var speed = 0.0;

				var direction = new Vector3(0.0, 0.0, -1.0);
				direction.applyQuaternion(orientation);
				direction.multiplyScalar(speed);

				var position = new Vector3(viewPosition.x, viewPosition.y, viewPosition.z);

				var geometry = new SphereBufferGeometry(0.05, 24, 24);
				var material = new MeshPhysicalMaterial({
					map: new TextureLoader().load('assets/texture/ball/color.jpg'),
					roughness: 1.0,
					metalness: 0.0,
					roughnessMap: new TextureLoader().load('assets/texture/ball/roughness.jpg'),
					normalMap: new TextureLoader().load('assets/texture/ball/normal.png'),
				});

				material = this.createAugmentedMaterial(material, depthDataTexture);

				var shape = new Sphere(0.05);

				var ball = new PhysicsObject(geometry, material, world);
				ball.castShadow = true;
				ball.receiveShadow = true;
				ball.position.copy(position);
				ball.body.velocity.set(direction.x, direction.y, direction.z);
				ball.addShape(shape);
				ball.initialize();
				scene.add(ball);
			}
		}));

		this.resetDepthCanvas();

		var button = document.createElement("div");
		button.style.position = "absolute";
		button.style.backgroundColor = "#FF6666";
		button.style.width = "100%";
		button.style.height = "100%";
		button.style.top = "0px";
		button.style.left = "0px";
		button.style.textAlign = "center";
		button.style.fontFamily = "Arial";
		button.style.fontSize = "10vh";
		button.innerText = "Enter AR";
		button.onclick = function()
		{
			XRManager.start(renderer,
			{
				optionalFeatures: ["dom-overlay"],
				domOverlay: {root: container},
				requiredFeatures: ["depth-sensing", "hit-test", "light-estimation"]
			}, function(error)
			{
				alert("Error starting the AR session. " + error);
			});
		};
		document.body.appendChild(button);
	}

	destroy()
	{

	}
}
