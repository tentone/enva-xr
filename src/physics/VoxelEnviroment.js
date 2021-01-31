import {Box3} from "three";

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
		 */
		this.box = new Box3();
		
		/**
		 * Precision of the depth system in mm.
		 * 
		 * The grid of voxels has the size defined here.
		 */
		this.precision = 50;
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
