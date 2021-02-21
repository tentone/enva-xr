import {Vector3, SphereBufferGeometry, Euler, Quaternion, MeshPhysicalMaterial, TextureLoader, Sphere} from "three";
import {Measurement} from "../object/Measurement.js";
import {PhysicsObject} from "../object/PhysicsObject.js";
import {GUIUtils} from "./GUIUtils.js";

/**
 * Application user interface.
 *
 * The interface can be shown during AR presentation as a "dom-overlay" in the WebXR context.
 */
export class GUI
{
	constructor(app)
	{
		/**
		 * App that this GUI is controlling.
		 */
		this.app = app;

		/**
		 * The DOM element where the GUI should be created.
		 */
		this.parent = document.body;

		/**
		 * DOM container for the GUI.
		 */
		this.container = null;
	}

	create()
	{
		this.container = document.createElement("div");
		this.container.style.position = "absolute";
		this.container.style.top = "0px";
		this.container.style.left = "0px";
		this.container.style.width = "100%";
		this.container.style.height = "100%";
		this.parent.appendChild(this.container);

		this.container.appendChild(GUIUtils.createButton("./assets/icon/3d.svg", () =>
		{
			this.app.debugDepth = !this.app.debugDepth;
			this.app.depthCanvas.style.display = this.app.debugDepth ? "block" : "none";
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/ruler.svg", () =>
		{
			if (this.app.cursor.visible)
			{
				if (this.app.measurement)
				{
					this.app.measurement = null;
				}
				else
				{
					var position = new Vector3();
					position.setFromMatrixPosition(this.app.cursor.matrix);
					this.app.measurement = new Measurement(position);
					this.app.scene.add(this.app.measurement);
				}
			}
		}));

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/stopwatch.svg", () =>
		{
			this.app.performanceCounterFull = [];
			this.app.performanceCounterRender = [];
			this.app.performanceCounterEnabled = true;
		})); */

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/shadow.svg", () =>
		{
			this.app.nextShadowType();
		})); */

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/bug.svg", () =>
		{
			this.app.nextRenderMode();
		})); */

		this.container.appendChild(GUIUtils.createButton("./assets/icon/911.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/car/scene.gltf", new Euler(0, 0, 0), 0.003);
		}));

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/bottle.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/gltf/WaterBottle.glb", new Euler(0, 0, 0), 1.0);
		})); */

		this.container.appendChild(GUIUtils.createButton("./assets/icon/tripod.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/gltf/AntiqueCamera.glb", new Euler(0, 0, 0), 0.1);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/shoe.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/gltf/Shoe.glb", new Euler(0, 0, 0), 1.0);
		}));

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/dots.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/gltf/MetalRoughSpheresNoTextures.glb", new Euler(0, 0, 0), 100.0);
		})); */

		this.container.appendChild(GUIUtils.createButton("./assets/icon/fish.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/gltf/BarramundiFish.glb", new Euler(0, 0, 0), 1.0);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/flower.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/flower/scene.gltf", new Euler(0, 0, 0), 0.007);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/toy-car.svg", () =>
		{
			this.app.loadGLTFMesh("./assets/3d/gltf/ToyCar.glb", new Euler(0, 0, 0), 10.0);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/rocks.svg", () =>
		{
			if (pose !== null)
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
					normalMap: new TextureLoader().load('assets/texture/ball/normal.png')
				});

				material = this.app.createAugmentedMaterial(material, this.app.depthDataTexture);

				var shape = new Sphere(0.05);

				var ball = new PhysicsObject(geometry, material, this.app.world);
				ball.castShadow = true;
				ball.receiveShadow = true;
				ball.position.copy(position);
				ball.body.velocity.set(direction.x, direction.y, direction.z);
				ball.addShape(shape);
				ball.initialize();
				this.app.scene.add(ball);
			}
		}));
	}
}
