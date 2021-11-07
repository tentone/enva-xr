export class GUIUtils
{
	/**
	 * Create a button with an icon.
	 *
	 * @param {string} imageSrc - Source of the image used as icon.
	 * @param {Function} onclick - Method to be executed when the button is pressed.
	 */
	static createButton(x, y, w, h, imageSrc, onclick)
	{
		var button = document.createElement("div");
		button.style.width = w + "px";
		button.style.height = h + "px";
		button.style.position = "absolute";
		button.style.left = x + "px";
		button.style.bottom = y + "px";
		button.style.backgroundColor = "#FFFFFF33";
		button.style.borderRadius = "20px";
		button.style.opacity = "0.2";
		button.style.zIndex = "1000";
		button.onclick = onclick;

		var icon = document.createElement("img");
		icon.src = imageSrc;
		icon.style.width = "80%";
		icon.style.height = "80%";
		icon.style.top = "10%";
		icon.style.left = "10%";
		icon.style.position = "absolute";
		button.appendChild(icon);

		return button;
	}
}
