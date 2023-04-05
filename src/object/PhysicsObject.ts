import {Body, Shape, World} from "cannon-es";
import {Vector3, Mesh, Quaternion, Matrix4, Material, BufferGeometry} from "three";

/**
 * Wrapper for cannon.js physics objects.
 *
 * The editor includes tools to create cannon shapes from three.js geometry objects.
 *
 * Documentation for cannon.js physics available here http:// schteppe.github.io/cannon.js/docs/
 */
export class PhysicsObject extends Mesh
{
	/**
	 * The position of the object is copied directly from the body.
	 *
	 * Ignores the world tranforms inherited from parent objects.
	 *
	 * Faster but the physics object should not carry any world transformations.
	 */
	public static LOCAL = 100;

	/**
	 * The position of the object is adjusted to follow the parent object transformation.
	 *
	 * This mode should be used for objects placed inside others.
	 */
	public static WORLD = 101;

	/**
	 * Physics body contains the following attributes:
	 */
	public body: Body;

	/**
	 * Physics object position mode, indicates how coordinates from the physics engine are transformed into object coordinates.
	 */
	public mode: number;

	/**
	 * Refenrece to the physics world.
	 */
	public world: World = null;

	/**
	 * @param geometry - Geometry of the object. 
	 * @param material - Material used to render the object. 
	 * @param world - Physics world where the object will be placed at.
	 */
	public constructor(geometry: BufferGeometry, material: Material, world: World)
	{
		super(geometry, material);

		this.frustumCulled = false;

		this.body = new Body();
		this.body.type = Body.DYNAMIC;
		this.body.mass = 1.0;

		this.mode = PhysicsObject.LOCAL;

		this.world = world;
		this.world.addBody(this.body);
	}

	/**
	 * Intialize physics object and add it to the scene physics world.
	 */
	public initialize(): void
	{
		if (this.mode === PhysicsObject.LOCAL)
		{
			// @ts-ignore
			this.body.position.copy(this.position);
			// @ts-ignore
			this.body.quaternion.copy(this.quaternion);
		}
		else if (this.mode === PhysicsObject.WORLD)
		{
			let position = new Vector3();
			this.getWorldPosition(position);
			// @ts-ignore
			this.body.position.copy(position);

			let quaternion = new Quaternion();
			this.getWorldQuaternion(quaternion);
			// @ts-ignore
			this.body.quaternion.copy(quaternion);
		}
	}

	/**
	 * Update object position and rotation based on cannon.js body.
	 */
	// @ts-ignore
	public onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group)
	{
		if (this.mode === PhysicsObject.LOCAL)
		{
			// @ts-ignore
			this.position.copy(this.body.position);
			if (!this.body.fixedRotation)
			{
				// @ts-ignore
				this.quaternion.copy(this.body.quaternion);
			}
		}
		else if (this.mode === PhysicsObject.WORLD)
		{

			// Physics transform matrix
			let transform = new Matrix4();
			if (this.body.fixedRotation)
			{
				transform.setPosition(this.body.position.x, this.body.position.y, this.body.position.z);
			}
			else
			{
				let quaternion = new Quaternion();

				// @ts-ignore
				quaternion.copy(this.body.quaternion);
				transform.makeRotationFromQuaternion(quaternion);
				transform.setPosition(this.body.position.x, this.body.position.y, this.body.position.z);
			}


			// Get inverse of the world matrix
			let inverse = new Matrix4();
			inverse.getInverse(this.parent.matrixWorld);

			// Get position, scale and quaternion
			let scale = new Vector3();
			inverse.multiply(transform);
			inverse.decompose(this.position, this.quaternion, scale);
		}
	}

	/**
	 * Add shape to physics object body.
	 */
	public addShape(shape: Shape): void
	{
		if (!(shape instanceof Shape))
		{
			throw new Error("Shape received is not of CANNON.Shape type");
		}

		this.body.addShape(shape);
	}
}


