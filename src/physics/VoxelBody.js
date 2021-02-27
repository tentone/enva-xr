import {Body} from "cannon-es";

export class VoxelBody extends Body
{
	constructor(manager, x, y, z)
	{
		super();

		/**
		 * Voxel enviroment manager to wich this voxel body belongs.
		 */
		this.manager = manager;

		/**
		 * Current probability of this voxel belonging to the enviroment.
		 */
		this.probability = 0.0;

		this.type = Body.STATIC;
		this.position.set(x, y, z);
		this.velocity.set(0, 0, 0);
		this.addShape(this.manager.shape);
	}

	/**
	 * Update the voxel internal probability.
	 *
	 * If the probability of the voxels goes bellow the threshold the voxel is deactivated.
	 *
	 * @param {number} hit If the 1 the voxel is occupied by depth, otherwise is not occupied. A value inbetween can be used for antialiasing like calculation.
	 * @param {number} factor The update factor based on the the time elapsed between frames and the update probability
	 */
	update(hit, factor)
	{
		this.probability = this.probability * (1 - factor) + factor * hit;

		if (this.probability > 1)
		{
			this.probability = 1.0;
		}
		else if (this.probability < 0)
		{
			this.probability = 0.0;
		}

		if (this.probability > this.manager.threshold)
		{
			// TODO <ADD CODE HERE ACTIVATE VOXEL>
		}
		else
		{
			// TODO <ADD CODE HERE DEACTIVATE VOXEL>
		}
	}
}
