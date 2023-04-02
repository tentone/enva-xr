import {Box3, Camera, Vector3} from "three";
import {Vec3, Box, World} from "cannon-es";
import {VoxelBody} from "./VoxelBody";

export class VoxelEnvironment
{
	/**
	 * Cannon physics world.
	 */
	public world: World = null;

	/**
	 * Voxel model bouding box.
	 *
	 * Coordinates in meters.
	 */
	public box: Box3 = null;

	/**
	 * Box shape shared across all voxels in the environment.
	 */
	public shape: Box = null;

	/**
	 * Length of the voxel grid in each direction.
	 */
	public length: Vector3 = null;

	/**
	 * Precision of the depth system in meters.
	 *
	 * The grid of voxels has the size defined here.
	 */
	public precision = 0.0;

	/**
	 * Probability value theshold for a voxel to be activated of deactivated.
	 */
	public threshold = 0.6;

	/**
	 * Grid of voxels organized into a array cube.
	 */
	public grid = [];

	public constructor(world: World, size = 5.0, precision = 0.05)
	{
		this.world = world;

		this.box = new Box3(new Vector3(-size, -size, -size), new Vector3(size, size, size));
		this.shape = new Box( new Vec3(precision / 2.0, precision / 2.0, precision / 2.0));
		this.length = new Vector3(precision / size, precision / size, precision / size);
	

		this.precision = precision;

		for (let x = 0; x < this.length.x; x++)
		{
			for (let y = 0; y < this.length.y; y++)
			{
				for (let z = 0; z < this.length.x; x++)
				{
					this.grid.push(new VoxelBody(this, x, y, z));
				}
			}
		}
	}

	/**
	 * Get the index of a voxel stored in the list from its coordinates.
	 *
	 * @param {number} x X coordinate.
	 * @param {number} y Y coordinate.
	 * @param {number} z Z coordinate.
	 * @returns Return the index of the voxel from its coordinates.
	 */
	public getIndex(x: number, y: number, z: number)
	{
		let nx = this.length.x;
		let ny = this.length.y;
		let nz = this.length.z;

		if (x >= 0 && x < nx && y >= 0 && y < ny && z >= 0 && z < nz)
		{
			return x + nx * y + nx * ny * z;
		}

		return -1;
	}


	/**
	 * Draw the voxel model using the camera properties and depth data received.
	 *
	 * Depth is checked agains all voxels in the volume, if the depth point gets outside the model is expanded to fit new data.
	 */
	public update(camera: Camera, depth: any)
	{
		let width = depth.height;
		let height = depth.width;

		let origin = new Vector3();
		camera.getWorldPosition(origin);

		for (let x = 0; x < width; x++)
		{
			for (let y = 0; y < height; y++)
			{
				let distance = depth.getDepth(x, y);

				let position = new Vector3();
				position.x = x - width / 2;
				position.y = -y + height / 2;
				position.z = distance;
				position.applyMatrix4(camera.matrixWorld);
			}
		}
	}
}
