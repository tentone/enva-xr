import {WebGLRenderer} from "three";

/**
 * XR manager is used to manage wich XR session is currently running and prevent multiple sessions from running concorrently.
 */
export class XRManager
{
	/**
	 * XR session running.
	 */
	public static session: XRSession = null;

	/**
	 * Start webxr session for immersive-ar with the provided session configuration.
	 * 
	 * If there is a session already running the method will throw an error.
	 *
	 * @param renderer - WebGL renderer object.
	 * @param sessionInit - Session initialization data.
	 * @returns The XR session created.
	 */
	static async start(renderer: WebGLRenderer, sessionInit: XRSessionInit = {}): Promise<XRSession>
	{
		if (XRManager.session)
		{
			throw new Error("XR Session already running.");
		}

		XRManager.session = await navigator.xr.requestSession("immersive-ar", sessionInit);

		renderer.xr.setReferenceSpaceType('local');
		renderer.xr.setSession(XRManager.session);

		return XRManager.session;
	}

	/**
	 * End the session.
	 */
	static async end(): Promise<void>
	{
		if (!XRManager.session) 
		{
			throw new Error("No XR Session running.");
		}

		await XRManager.session.end();
		XRManager.session = null;
	}
}
