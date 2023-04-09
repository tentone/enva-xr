import {CanvasTexture} from "three";

/**
 * Canvas texture to stored depth data obtained from the WebXR API.
 */
export class DepthCanvasTexture extends CanvasTexture
{
	public constructor(canvas?: HTMLCanvasElement | OffscreenCanvas)
	{
		super(canvas || new OffscreenCanvas(1, 1));
	}

	/**
	 * Draw depth data to a canvas, also sets the size of the canvas.
	 *
	 * Uses the camera planes to correctly adjust the values.
	 * 
	 * @param depthInfo - Depth info obtained from XR.
	 * @param near - Near plane of camera.
	 * @param far - Far plane of camera.
	 */
	public updateDepth(depthInfo: XRCPUDepthInformation, near: number, far: number): void
	{
		// Adjust size of the canvas to match depth information
		let canvas = this.image;
		canvas.width = depthInfo.height;
		canvas.height = depthInfo.width;

		// Get image data
		let context = canvas.getContext("2d");
		let image = context.getImageData(0, 0, canvas.width, canvas.height);

		for (let x = 0; x < depthInfo.width; x++)
		{
			for (let y = 0; y < depthInfo.height; y++)
			{
				// Transform distance into values inside of the [near, far] range.
				let distance = (depthInfo.getDepthInMeters(x, y) - near) / (far - near);
				let j = (x * canvas.width + (canvas.width - y)) * 4;

				// Clam values
				if (distance > 1.0) {distance = 1.0;}
				else if (distance < 0.0) {distance = 0.0;}

				// Display depth information as RGB
				image.data[j] = Math.ceil(distance * 256);
				image.data[j + 1] = Math.ceil(distance * 256);
				image.data[j + 2] = Math.ceil(distance * 256);
				image.data[j + 3] = 255;
			}
		}

		// Update canvas content
		context.putImageData(image, 0, 0);
		this.needsUpdate = true;
	}

}
