import {Box3, Vector3} from "three";

export class VoxelEnvironment
{
	constructor(world)
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
		this.shape = new Box(new Vec3(this.precision / 2, this.precision / 2, this.precision / 2));

		/**
		 * Grid of voxels organized into a array cube. 
		 */
		this.grid = [];
	}

	/**
	 * Get all voxels that are inside of the camera frustum.
	 * 
	 * @param {Camera} camera Camera object
	 */
	getVoxelInFrustum(camera)
	{
		var voxels = [];

		// TODO <ADD CODE HERE>

		return voxels;
	}


	/**
	 * Update a specific point in the voxel grid.
	 */
	updatePoint()
	{
		// TODO <ADD CODE HERE>
	}

	/**
	 * Draw the voxel model using the camera properties and depth data received.
	 * 
	 * Depth is checked agains all voxels in the volume, if the depth point gets outside the model is expanded to fit new data.
	 */
	updateDepth(camera, depth)
	{
		var width = depth.height;
		var height = depth.width;

		for (var x = 0; x < width; x++)
		{
			for (var y = 0; y < height; y++)
			{
				var distance = depth.getDepth(x, y);
				
				// TODO <Project distance and check collision>
			}
		}
	}
}
