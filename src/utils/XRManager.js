/**
 * XR session running.
 */
let currentSession = null;

export class XRManager
{
	/**
	 * Start webxr session for immersive-ar with the provided session configuration.
	 *
	 * @param {*} renderer
	 * @param {*} sessionInit
	 * @param {*} onError
	 */
	static start(renderer, sessionInit = {}, onError = function() {})
	{
		if (currentSession === null)
		{
			function onSessionStarted(session)
			{
				session.addEventListener("end", onSessionEnded);
				renderer.xr.setReferenceSpaceType("local");
				renderer.xr.setSession(session);
				currentSession = session;
			}

			function onSessionEnded(event)
			{
				currentSession.removeEventListener("end", onSessionEnded);
				currentSession = null;
			}

			navigator.xr.requestSession("immersive-ar", sessionInit).then(onSessionStarted).catch(onError);
		}
	}

	static end()
	{
		if (!currentSession === null)
		{
			currentSession.end();
			currentSession = null;
		}
	}
}
