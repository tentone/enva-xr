import {Box3, Vector3} from "three";
import {Vec3, Box} from "cannon-es";

export class VoxelEnvironment
{
	constructor(world, size, precision)
	{
		if (size === undefined)
		{
			size = 5.0;
		}

		if (precision === undefined)
		{
			precision = 0.05;
		}

		/**
		 * Cannon physics world.
		 */
		this.world = world;

		/**
		 * Voxel model bouding box.
		 *
		 * Coordinates in meters.
		 */
		this.box = new Box3(new Vector3(-size, -size, -size), new Vector3(size, size, size));

		/**
		 * Box shape shared across all voxels in the environment.
		 */
		this.shape = new Box(new Vec3(-precision, -precision, -precision), new Vec3(precision, precision, precision));

		/**
		 * Length of the voxel grid in each direction.
		 */
		this.length = new Vector3(precision / size, precision / size, precision / size);

		/**
		 * Precision of the depth system in meters.
		 *
		 * The grid of voxels has the size defined here.
		 */
		this.precision = precision;

		/**
		 * Probability value theshold for a voxel to be activated of deactivated.
		 */
		this.threshold = 0.6;

		/**
		 * Grid of voxels organized into a array cube.
		 */
		this.grid = [];
	}

	/**
	 * Get the index of a voxel stored in the list from its coordinates.
	 *
	 * @param {number} x X coordinate.
	 * @param {number} y Y coordinate.
	 * @param {number} z Z coordinate.
	 * @return {number} Return the index of the voxel from its coordinates.
	 */
	 getIndex(x, y, z)
	 {
		 var nx = this.nx;
		 var ny = this.ny;
		 var nz = this.nz;

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
	update(camera, depth)
	{
		var width = depth.height;
		var height = depth.width;

		var origin = new Vector3();
		camera.getWorldPosition(origin);

		for (var x = 0; x < width; x++)
		{
			for (var y = 0; y < height; y++)
			{
				var distance = depth.getDepth(x, y);

				var position = new Vector3();
				position.x = x - width / 2;
				position.y = -y + height / 2;
				position.z = distance;
				position.applyMatrix4(camera.matrixWorld);

				// TODO <ADD CODE HERE>
			}
		}
	}
}
