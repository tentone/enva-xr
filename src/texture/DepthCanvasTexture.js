import {CanvasTexture} from "three";

export class DepthCanvasTexture extends CanvasTexture
{
	constructor(canvas) {
		super(canvas);
	}

	/**
	 * Draw depth data to a canvas, also sets the size of the canvas.
	 *
	 * Uses the camera planes to correctly adjust the values.
	 */
	updateDepth(depth, near, far)
	{
        var canvas = this.image;

		canvas.width = depth.height;
		canvas.height = depth.width;
		canvas.style.width = (2 * canvas.width) + "px";
		canvas.style.height = (2 * canvas.height) + "px";

		var context = canvas.getContext("2d");
		var image = context.getImageData(0, 0, canvas.width, canvas.height);

		for(var x = 0; x < depth.width; x++)
		{
			for(var y = 0; y < depth.height; y++)
			{
				var distance = (depth.getDepth(x, y) - near) / (far - near);
				var j = (x * canvas.width + (canvas.width - y)) * 4;

				if (distance > 1.0) {distance = 1.0;}
				else if (distance < 0.0) {distance = 0.0;}

				image.data[j] = Math.ceil(distance * 256);
				image.data[j + 1] = Math.ceil(distance * 256);
				image.data[j + 2] = Math.ceil(distance * 256);
				image.data[j + 3] = 255;
			}
		}

		context.putImageData(image, 0, 0);
		this.needsUpdate = true;
	}

}
