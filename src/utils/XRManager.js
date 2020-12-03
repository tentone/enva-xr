let currentSession = null;

export class XRManager
{
	/**
	 * Start webxr session for immersive-ar with the provided session configuration.
	 *
	 * @param {*} renderer
	 * @param {*} sessionInit
	 */
	static start(renderer, sessionInit = {})
	{
		function onSessionStarted(session)
		{
			session.addEventListener("end", onSessionEnded);
			renderer.xr.setReferenceSpaceType("local");
			renderer.xr.setSession(session);
			currentSession = session;
		}

		function onSessionEnded( /*event*/ )
		{
			currentSession.removeEventListener("end", onSessionEnded);
			currentSession = null;
		}

		if (currentSession === null)
		{
			navigator.xr.requestSession("immersive-ar", sessionInit).then(onSessionStarted);
		}
		else
		{
			currentSession.end();
		}
	}
}
