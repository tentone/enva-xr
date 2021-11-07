import {Mesh, Vector3, MeshBasicMaterial, DoubleSide, Triangle, Shape, ShapeBufferGeometry, BufferGeometry} from 'three';

/**
 * Area is used to represent a measurement between two points.
 */
class Area extends Mesh {
	constructor(point) {
        if (!point)
		{
			point = new Vector3(0, 0, 0);
		}

		super(new BufferGeometry(), new MeshBasicMaterial(
        {
            color: 0x00FF00,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            polygonOffset: false,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -4.0,
            opacity: 0.3,
            side: DoubleSide
        }));

		/**
		 * List of points that compose the measurement.
		 */
         this.points = [point.clone()];

		/**
		 * Text used to display the measurement value.
		 */
         this.text = new Text();
         this.text.fontSize = 0.1;
         this.text.color = 0xFFFFFF;
         this.text.anchorX = "center";
         this.text.anchorY = "middle";
         this.text.rotation.set(Math.PI, Math.PI, Math.PI);
         this.add(this.text);
	}

	/**
	 * Get the area of this based on its geometry.
	 */
	getArea() {
		if (!this.geometry.isBufferGeometry) {
			return;
		}

		const vertex = this.geometry.attributes.position;
		const faces = this.geometry.index.array;

		let area = 0;
		if (faces.length < 3) {
			console.warn('Not enough points to calculate area.');
			return;
		}

		const a = new Vector3(), b = new Vector3(), c = new Vector3();

		for (let i = 0; i < faces.length; i += 3) {
			a.set(vertex.getX(faces[i]), vertex.getY(faces[i]), vertex.getZ(faces[i]));
			b.set(vertex.getX(faces[i + 1]), vertex.getY(faces[i + 1]), vertex.getZ(faces[i + 1]));
			c.set(vertex.getX(faces[i + 2]), vertex.getY(faces[i + 2]), vertex.getZ(faces[i + 2]));

			const triangle = new Triangle(a, b, c);
			const value = triangle.getArea();
			area += value;
		}
        
		return area;
	}

	onValueUpdate() {
        this.updateGeometry();
        this.updateText();
	}

    /**
     * Update geometry of the area object.
     */
    updateGeometry() {
        // Has enough points for a area
        if (this.points.length < 2) {
            return;
        }
        
        const center = new Vector3(0, 0, 0);
        const shape = new Shape();

        for (let i = 0; i < points.length; i++) {
            if (i === 0) {
                shape.moveTo(points[i].x, points[i].z);
            } else {
                shape.lineTo(points[i].x, points[i].z);
            }

            center.add(points[i]);
        }

        shape.lineTo(points[0].x, points[0].z);
        center.divideScalar(points.length);

        this.geometry = new ShapeBufferGeometry(shape);

        const array = this.geometry.attributes.position.array;
    
        for (let i = 0; i < array.length; i += 3) {
            array[i + 2] = array[i + 1];
            array[i + 1] = 0;

            for (let j = 0; j < points.length; j++) {
                if (Math.floor(array[i]) === Math.floor(points[j].x) && Math.floor(array[i + 2]) === Math.floor(points[j].z)) {
                    array[i + 1] = points[j].y;
                    break;
                }
            }
        }
    }
    
	/**
	 * Update the text of the measurement.
	 */
	updateText()
	{
		if (this.points.length < 3)
		{
			this.text.visible = false;
			return;
		}

		var center = new Vector3();
		for (var i = 0; i < this.points.length; i++)
		{
			center.add(this.points[i]);
		}
		center.divideScalar(this.points.length);

		this.text.visible = true;
		this.text.position.copy(center);
		this.text.position.y += 0.1;
		this.text.text = this.getArea() + " m2";
		this.text.sync();
	}
}

export {Area};
