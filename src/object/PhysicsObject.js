import {Body, Shape} from "cannon";
import {Vector3, Mesh, Quaternion, Matrix4} from "three";

/**
 * Wrapper for cannon.js physics objects.
 *
 * The editor includes tools to create cannon shapes from three.js geometry objects.
 *
 * Documentation for cannon.js physics available here http:// schteppe.github.io/cannon.js/docs/
 */
export class PhysicsObject extends Mesh
{
	constructor(geometry, material, world)
	{
		super(geometry, material);

		this.frustumCulled = false;

		/**
		 * Physics body contains the following attributes:
		 */
		this.body = new Body();
		this.body.type = Body.DYNAMIC;
		this.body.mass = 1.0;

		/**
		 * Physics object position mode, indicates how coordinates from the physics engine are transformed into object coordinates.
		 */
		this.mode = PhysicsObject.LOCAL;

		/**
		 * Refenrece to the physics world.
		 */
		this.world = world;
		this.world.addBody(this.body);
	}

	/**
	 * Intialize physics object and add it to the scene physics world.
	 */
	initialize()
	{
		if (this.mode === PhysicsObject.LOCAL)
		{
			this.body.position.copy(this.position);
			this.body.quaternion.copy(this.quaternion);
		}
		else if (this.mode === PhysicsObject.WORLD)
		{
			var position = new Vector3();
			this.getWorldPosition(position);
			this.body.position.copy(position);

			var quaternion = new Quaternion();
			this.getWorldQuaternion(quaternion);
			this.body.quaternion.copy(quaternion);
		}
	};

	/**
	 * Update object position and rotation based on cannon.js body.
	 */
	onBeforeRender(renderer, scene, camera, geometry, material, group)
	{
		if (this.mode === PhysicsObject.LOCAL)
		{
			this.position.copy(this.body.position);
			if (!this.body.fixedRotation)
			{
				this.quaternion.copy(this.body.quaternion);
			}
		}
		else if (this.mode === PhysicsObject.WORLD)
		{

			// Physics transform matrix
			var transform = new Matrix4();
			if (this.body.fixedRotation)
			{
				transform.setPosition(this.body.position.x, this.body.position.y, this.body.position.z);
			}
			else
			{
				var quaternion = new Quaternion();
				quaternion.copy(this.body.quaternion);
				transform.makeRotationFromQuaternion(quaternion);
				transform.setPosition(this.body.position.x, this.body.position.y, this.body.position.z);
			}


			// Get inverse of the world matrix
			var inverse = new Matrix4();
			inverse.getInverse(this.parent.matrixWorld);

			// Get position, scale and quaternion
			var scale = new Vector3();
			inverse.multiply(transform);
			inverse.decompose(this.position, this.quaternion, scale);
		}
	};

	/**
	 * Add shape to physics object body.
	 */
	addShape(shape)
	{
		if (!(shape instanceof Shape))
		{
			throw new Error("Shape received is not of CANNON.Shape type");
		}

		this.body.addShape(shape);
	};
}

/**
 * The position of the object is copied directly from the body.
 *
 * Ignores the world tranforms inherited from parent objects.
 *
 * Faster but the physics object should not carry any world transformations.
 */
PhysicsObject.LOCAL = 100;

/**
 * The position of the object is adjusted to follow the parent object transformation.
 *
 * This mode should be used for objects placed inside others.
 */
PhysicsObject.WORLD = 101;
