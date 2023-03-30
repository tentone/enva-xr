
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
	 */
	static async start(renderer, sessionInit = {}): Promise<void>
	{
		if (XRManager.session)
		{
			throw new Error("XR Session already running.");
		}

		XRManager.session = await navigator.xr.requestSession("immersive-ar", sessionInit);

		const onSessionEnded = (event) =>
		{
			XRManager.session.removeEventListener("end", onSessionEnded);
			XRManager.session = null;
		};

		XRManager.session.addEventListener("end", onSessionEnded);
		renderer.xr.setReferenceSpaceType("local");
		renderer.xr.setSession(XRManager.session);
	}

	/**
	 * End the session.
	 */
	static end()
	{
		if (!XRManager.session) {
			throw new Error("No XR Session running.");
		}

		XRManager.session.end();
		XRManager.session = null;
	}
}
