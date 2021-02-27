/**
 * Auxiliary tools to measure performance of the application.
 *
 * Ticks measurements between frames and provides metrics from the times measured.
 *
 * Can also be used to measure specific time deltas.
 */
export class PerformanceMeter
{
	constructor(samples)
	{
		this.reset();

		this.samples = samples ? samples : 400;
	}

	/**
	 * Tick a clean measurement
	 */
	tick()
	{
		this.last = performance.now();
	}

	/**
	 * Finish measurement and add it to the list of measurements..
	 */
	tock()
	{
		var time = performance.now();

		this.values.push(time - this.last);
		if (this.values.length >= this.samples)
		{
			this.values.shift();
		}

		this.last = time;
	}

	/**
	 * Get the average value from all samples in the performance meter.
	 */
	stats()
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
