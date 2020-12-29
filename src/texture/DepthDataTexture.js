import {DataTexture} from "three";

/**
 * Stores the raw depth values in a 16 bit value packed texture.
 *
 * The distance to the camera is stored in millimeters.
 */
export class DepthDataTexture extends DataTexture
{
	constructor(canvas) {
		super(canvas);
	}

	updateDepth(depth)
	{
		for(var x = 0; x < depth.width; x++)
		{
			for(var y = 0; y < depth.height; y++)
			{
				var distance = depth.getDepth(x, y);

				// TODO <ADD CODE HERE>
			}
		}

	}

}
