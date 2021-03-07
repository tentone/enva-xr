import {Box3, Vector3} from "three";

export class VoxelEnvironment
{
	constructor(world, size)
	{
		/**
		 * Cannon physics world.
		 */
		this.world = world;

		/**
		 * Voxel model bouding box.
		 *
		 * Coordinates in meters.
		 */
		this.box = new Box3(new Vector3(-5, -5, -5), new Vector3(5, 5, 5));

		/**
		 * Precision of the depth system in meters.
		 *
		 * The grid of voxels has the size defined here.
		 */
		this.precision = 0.05;

		/**
		 * Probability value theshold for a voxel to be activated of deactivated.
		 */
		this.threshold = 0.6;

		/**
		 * Box shape shared across all voxels in the environment.
		 */
		this.shape = new Box(new Vec3(-size, -size, -size), new Vec3(size, size, size));

		/**
		 * Grid of voxels organized into a array cube.
		 */
		this.grid = [];
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

		var projectionMatrix = camera.projectionMatrix;

		for (var x = 0; x < width; x++)
		{
			for (var y = 0; y < height; y++)
			{
				var distance = depth.getDepth(x, y);

				var position = new Vector3();
				position.x = x - width / 2;
				position.y = -y + height / 2;
				position.z = distance;
			}
		}
	}

	/**
	 * Update a specific point in the voxel grid.
	 */
	updatePoint()
	{
		// TODO <ADD CODE HERE>
	}


}
