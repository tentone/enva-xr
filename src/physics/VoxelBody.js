import {Body, Box} from "cannon-es";

export class VoxelBody extends Body
{
	constructor(manager, x, y, z)
	{
		super();

		this.manager = manager;

		this.type = Body.STATIC;
		this.position.set(x, y, z);
		this.velocity.set(0, 0, 0);
		this.addShape(new Box());
	}
}
