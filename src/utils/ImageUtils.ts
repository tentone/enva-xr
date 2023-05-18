
/**
 * Utils to handler images.
 */
export class ImageUtils 
{
	/**
     * Load an image from URL into a DOM img and get data as bitmap.
     * 
     * @param src - Src of the image, can also be base64 data.
     */
	public static loadBitmap(src: string): Promise<ImageBitmap> 
	{
		return new Promise(function(resolve, reject) 
		{
			const img = document.createElement('img');
			img.src = src;
			img.onload = async function() 
			{
				const bitmap = await createImageBitmap(img);
				resolve(bitmap);
			};
		});

	}
}
