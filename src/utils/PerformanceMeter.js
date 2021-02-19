/**
 * Auxiliary tools to measure performance of the application.
 *
 * Ticks measurements between frames and provides metrics from the times measured.
 *
 * Can also be used to measure specific time deltas.
 */
export class PerformanceMeter
{
	constructor()
	{
		this.reset();

		this.samples = 100;
	}

	/**
	 * Start a clean measurement.
	 */
	start()
	{
		this.last = performance.now();
	}

	/**
	 * Tick measurement.
	 */
	tick()
	{
		var time = performance.now();
		this.values.push(time - this.last);
		if (this.values.length >= this.samples)
		{
			this.values.shift();
		}
	}

	/**
	 * Get the average value from all samples in the performance meter.
	 */
	average()
	{
		return this.values.reduce(function(a, b) {return a + b;}, 0) / this.values.length;
	}

	/**
	 * Reset the performance meter.
	 */
	reset()
	{
		this.values = [];
		this.last = null;
		this.max = Infinity;
		this.min = -Infinity;
	}
}
