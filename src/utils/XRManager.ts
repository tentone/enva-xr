
/**
 * XR manager is used to manage wich XR session is currently running and prevent multiple sessions from running concorrently.
 */
export class XRManager
{
	/**
	 * XR session running.
	 */
	public static session = null;

	/**
	 * Start webxr session for immersive-ar with the provided session configuration.
	 * 
	 * If there is a session already running the method will throw an error.
	 *
	 * @param {WebGLRenderer} renderer - WebGL renderer object.
	 * @param {any} sessionInit - Session initialization data.
	 * @param {Function} onError - Callback method called if an error occurs.
	 */
	static start(renderer, sessionInit = {}, onError = function() {})
	{
		if (XRManager.session === null)
		{
			function onSessionStarted(session)
			{
				session.addEventListener("end", onSessionEnded);
				renderer.xr.setReferenceSpaceType("local");
				renderer.xr.setSession(session);
				XRManager.session = session;
			}

			function onSessionEnded(event)
			{
				XRManager.session.removeEventListener("end", onSessionEnded);
				XRManager.session = null;
			}

			navigator.xr.requestSession("immersive-ar", sessionInit).then(onSessionStarted).catch(onError);
		}
	}

	/**
	 * End the session.
	 */
	static end()
	{
		if (!XRManager.session === null)
		{
			XRManager.session.end();
			XRManager.session = null;
		}
	}
}
