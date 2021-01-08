var w = 70;
var h = 70;
var x = 10;
var y = 10;

export class GUIUtils {
	/**
	 * Create a button with an icon.
	 *
	 * @param {*} imageSrc
	 * @param {*} onclick
	 */
	static createButton(imageSrc, onclick)
	{
		var button = document.createElement("div");
		button.style.width = w + "px";
		button.style.height = h + "px";
		button.style.position = "absolute";
		button.style.left = x + "px";
		button.style.bottom = y + "px";
		button.style.backgroundColor = "#FFFFFF33";
		button.style.borderRadius = "20px";
		button.onclick = onclick;

		var icon = document.createElement("img");
		icon.src = imageSrc;
		icon.style.width = "80%";
		icon.style.height = "80%";
		icon.style.top = "10%";
		icon.style.left = "10%";
		icon.style.position = "absolute";
		button.appendChild(icon);

		y += 80;

		return button;
	}
}
