import {Vector3, SphereBufferGeometry, Euler, Quaternion, MeshPhysicalMaterial, TextureLoader} from "three";
import {Sphere} from "cannon-es";
import {Measurement} from "../object/Measurement";
import {PhysicsObject} from "../object/PhysicsObject";
import {GUIUtils} from "./GUIUtils";

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

		this.container.appendChild(GUIUtils.createButton("./assets/icon/stopwatch.svg", () =>
		{
			this.app.timeMeter.reset();
			this.app.timeMeterFrame.reset();
		}));

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
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/porsche_911/scene.gltf", new Euler(0, 0, 0), 0.003);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/bottle.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/WaterBottle.glb", new Euler(0, 0, 0), 1.0);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/tripod.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/AntiqueCamera.glb", new Euler(0, 0, 0), 0.1);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/shoe.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/Shoe.glb", new Euler(0, 0, 0), 1.0);
		}));

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/dots.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/MetalRoughSpheresNoTextures.glb", new Euler(0, 0, 0), 100.0);
		})); */

		this.container.appendChild(GUIUtils.createButton("./assets/icon/fish.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/BarramundiFish.glb", new Euler(0, 0, 0), 1.0);
		}));

		this.container.appendChild(GUIUtils.createButton("./assets/icon/flower.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/flower/scene.gltf", new Euler(0, 0, 0), 0.007);
		}));

		/* this.container.appendChild(GUIUtils.createButton("./assets/icon/toy-car.svg", () =>
		{
			if(!this.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.cursor.matrix, "./assets/3d/ToyCar.glb", new Euler(0, 0, 0), 10.0);
		})); */

		this.container.appendChild(GUIUtils.createButton("./assets/icon/rocks.svg", () =>
		{
			if (this.app.pose !== null)
			{
				var viewOrientation = this.app.pose.transform.orientation;
				var viewPosition = this.app.pose.transform.position;

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
