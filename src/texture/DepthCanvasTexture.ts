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
	 * 
	 * @param depthInfo - Depth info obtained from XR.
	 * @param near - Near plane of camera.
	 * @param far - Far plane of camera.
	 */
	public updateDepth(depthInfo: XRCPUDepthInformation, near: number, far: number): void
	{
		// Adjust size of the canvas to match depth information
		let canvas = this.image;
		
		// // Portrait
		// if (depthInfo.width > depthInfo.height) {
		// 	canvas.width = depthInfo.height;
		// 	canvas.height = depthInfo.width;
		// }
		// // Landscape
		// else
		// {
		// 	canvas.width = depthInfo.width;
		// 	canvas.height = depthInfo.height;
		// }

		// Get image data
		let context: CanvasRenderingContext2D = canvas.getContext("2d");
		let image: ImageData = context.getImageData(0, 0, canvas.width, canvas.height);
		
		// Raw depth data.
		// let data = new Int16Array(depthInfo.data);
		// let matrix = new Matrix().fromArray(normDepthBufferFromNormView.matrix);

		for (let x = 0; x < canvas.width; x++)
		{
			for (let y = 0; y < canvas.height; y++)
			{
				// Transform distance into values inside of the [near, far] range.
				let depth = depthInfo.getDepthInMeters(x / canvas.width, y / canvas.height);

				// Clamp values
				let distance = (depth - near) / (far - near);
				if (distance > 1.0) {distance = 1.0;}
				else if (distance < 0.0) {distance = 0.0;}

				// Display depth information as RGB
				let idx = (x * canvas.width + (canvas.width - y)) * 4;
				image.data[idx] = Math.ceil(distance * 256);
				image.data[idx + 1] = Math.ceil(distance * 256);
				image.data[idx + 2] = Math.ceil(distance * 256);
				image.data[idx + 3] = 255;
			}
		}

		// Update canvas content
		context.putImageData(image, 0, 0);
		this.needsUpdate = true;
	}

}
