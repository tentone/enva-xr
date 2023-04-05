import {CanvasTexture} from "three";

/**
 * Canvas texture to stored depth data obtained from the WebXR API.
 */
export class DepthCanvasTexture extends CanvasTexture
{
	public constructor(canvas: HTMLCanvasElement | OffscreenCanvas)
	{
		super(canvas);
	}

	/**
	 * Draw depth data to a canvas, also sets the size of the canvas.
	 *
	 * Uses the camera planes to correctly adjust the values.
	 */
	public updateDepth(depthInfo: XRDepthInformation, near: number, far: number): void
	{
		let canvas = this.image;

		canvas.width = depthInfo.height;
		canvas.height = depthInfo.width;

		let context = canvas.getContext("2d");
		let image = context.getImageData(0, 0, canvas.width, canvas.height);

		for (let x = 0; x < depthInfo.width; x++)
		{
			for (let y = 0; y < depthInfo.height; y++)
			{
				let distance = (depthInfo.getDepth(x, y) - near) / (far - near);
				let j = (x * canvas.width + (canvas.width - y)) * 4;

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
