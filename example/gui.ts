import {Vector3} from "three";
import {Measurement} from "../src/object/Measurement";

let x = 20;
let y = 20;
const w = 50;
const h = 50;


/**
 * Application user interface.
 *
 * The interface can be shown during AR presentation as a "dom-overlay" in the WebXR context.
 */
export class GUI
{
	/**
	 * App that this GUI is controlling.
	 */
	public app: any = null;

	/**
	 * DOM container for the GUI.
	 */
	public container: any = null;

	constructor(app, container)
	{
		/**
		 * App that this GUI is controlling.
		 */
		this.app = app;

		/**
		 * DOM container for the GUI.
		 */
		this.container = container;
	}

	/**
	 * Create a button with an icon.
	 *
	 * @param {string} imageSrc - Source of the image used as icon.
	 * @param {Function} onclick - Method to be executed when the button is pressed.
	 */
	createButton(imageSrc, onclick)
	{
		var button = document.createElement("div");
		button.style.width = w + "px";
		button.style.height = h + "px";
		button.style.position = "absolute";
		button.style.left = x + "px";
		button.style.bottom = y + "px";
		button.style.backgroundColor = "#FFFFFF33";
		button.style.borderRadius = "20px";
		button.style.opacity = "0.2";
		button.style.zIndex = "1000";
		button.onclick = onclick;

		var icon = document.createElement("img");
		icon.src = imageSrc;
		icon.style.width = "80%";
		icon.style.height = "80%";
		icon.style.top = "10%";
		icon.style.left = "10%";
		icon.style.position = "absolute";
		button.appendChild(icon);

		y += h + 10;

		return button;
	}

	create()
	{
		this.container.appendChild(this.createButton("./assets/icon/3d.svg", () =>
		{
			this.app.debugDepth = !this.app.debugDepth;
			this.app.depthCanvas.style.display = this.app.debugDepth ? "block" : "none";
		}));

		this.container.appendChild(this.createButton("./assets/icon/ruler.svg", () =>
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
					this.app.measurement = new Measurement([position, position]);
					this.app.scene.add(this.app.measurement);
				}
			}
		}));

		this.container.appendChild(this.createButton("./assets/icon/stopwatch.svg", () =>
		{
			this.app.timeMeter.reset();
			this.app.timeMeterFrame.reset();
		}));

		/* this.container.appendChild(this.createButton("./assets/icon/shadow.svg", () =>
		{
			this.app.nextShadowType();
		})); */

		/* this.container.appendChild(this.createButton("./assets/icon/bug.svg", () =>
		{
			this.app.nextRenderMode();
		})); */

		// this.container.appendChild(this.createButton("./assets/icon/911.svg", () =>
		// {
		// 	if(!this.app.cursor.visible) {return;}
		// 	LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/porsche_911/scene.gltf", new Euler(0, 0, 0), 0.003);
		// }));

		// this.container.appendChild(this.createButton("./assets/icon/bottle.svg", () =>
		// {
		// 	if(!this.app.cursor.visible) {return;}
		// 	LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/WaterBottle.glb", new Euler(0, 0, 0), 1.0);
		// }));

		// this.container.appendChild(this.createButton("./assets/icon/tripod.svg", () =>
		// {
		// 	if(!this.app.cursor.visible) {return;}
		// 	LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/AntiqueCamera.glb", new Euler(0, 0, 0), 0.1);
		// }));

		// this.container.appendChild(this.createButton("./assets/icon/shoe.svg", () =>
		// {
		// 	if(!this.app.cursor.visible) {return;}
		// 	LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/Shoe.glb", new Euler(0, 0, 0), 1.0);
		// }));

		/* this.container.appendChild(this.createButton("./assets/icon/dots.svg", () =>
		{
			if(!this.app.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/MetalRoughSpheresNoTextures.glb", new Euler(0, 0, 0), 100.0);
		})); */

		// this.container.appendChild(this.createButton("./assets/icon/fish.svg", () =>
		// {
		// 	if(!this.app.cursor.visible) {return;}
		// 	LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/BarramundiFish.glb", new Euler(0, 0, 0), 1.0);
		// }));

		// this.container.appendChild(this.createButton("./assets/icon/flower.svg", () =>
		// {
		// 	if(!this.app.cursor.visible) {return;}
		// 	LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/flower/scene.gltf", new Euler(0, 0, 0), 0.007);
		// }));

		/* this.container.appendChild(this.createButton("./assets/icon/toy-car.svg", () =>
		{
			if(!this.app.cursor.visible) {return;}
			LoaderUtils.loadGLTF(this.app.scene, this.app.world, this.app.cursor.matrix, "./assets/3d/ToyCar.glb", new Euler(0, 0, 0), 10.0);
		})); */

		// this.container.appendChild(this.createButton("./assets/icon/rocks.svg", () =>
		// {
		// 	if (this.app.pose !== null)
		// 	{
		// 		var viewOrientation = this.app.pose.transform.orientation;
		// 		var viewPosition = this.app.pose.transform.position;

		// 		var orientation = new Quaternion(viewOrientation.x, viewOrientation.y, viewOrientation.z, viewOrientation.w);

		// 		var speed = 0.0;

		// 		var direction = new Vector3(0.0, 0.0, -1.0);
		// 		direction.applyQuaternion(orientation);
		// 		direction.multiplyScalar(speed);

		// 		var position = new Vector3(viewPosition.x, viewPosition.y, viewPosition.z);

		// 		var geometry = new SphereBufferGeometry(0.05, 24, 24);
		// 		var material = new MeshPhysicalMaterial({
		// 			map: new TextureLoader().load('assets/texture/ball/color.jpg'),
		// 			roughness: 1.0,
		// 			metalness: 0.0,
		// 			roughnessMap: new TextureLoader().load('assets/texture/ball/roughness.jpg'),
		// 			normalMap: new TextureLoader().load('assets/texture/ball/normal.png')
		// 		});

		// 		material = this.app.createAugmentedMaterial(material, this.app.depthDataTexture);

		// 		var shape = new Sphere(0.05);

		// 		var ball = new PhysicsObject(geometry, material, this.app.world);
		// 		ball.castShadow = true;
		// 		ball.receiveShadow = true;
		// 		ball.position.copy(position);
		// 		ball.body.velocity.set(direction.x, direction.y, direction.z);
		// 		ball.addShape(shape);
		// 		ball.initialize();
		// 		this.app.scene.add(ball);
		// 	}
		// }));
	}
}
