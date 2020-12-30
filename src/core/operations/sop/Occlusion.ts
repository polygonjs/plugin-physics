import {BaseSopOperation} from 'polygonjs-engine/src/core/operations/sop/_Base';
import {DefaultOperationParams} from 'polygonjs-engine/src/core/operations/_Base';
import {CoreGroup} from 'polygonjs-engine/src/core/geometry/Group';
import {InputCloneMode} from 'polygonjs-engine/src/engine/poly/InputCloneMode';

import './geo-ambient-occlusion';
import geoao from 'geo-ambient-occlusion';
import {Float32BufferAttribute} from 'three/src/core/BufferAttribute';
import {CoreObject} from 'polygonjs-engine/src/core/geometry/Object';

interface OcclusionSopParams extends DefaultOperationParams {
	attribName: string;
	samples: number;
	bufferResolution: number;
	bias: number;
}

export class OcclusionSopOperation extends BaseSopOperation {
	static readonly DEFAULT_PARAMS: OcclusionSopParams = {
		attribName: 'occlusion',
		samples: 256,
		bufferResolution: 512,
		bias: 0.01,
	};
	static readonly INPUT_CLONED_STATE = InputCloneMode.FROM_NODE;
	static type(): Readonly<'occlusion'> {
		return 'occlusion';
	}
	cook(input_contents: CoreGroup[], params: OcclusionSopParams) {
		const core_group = input_contents[0];
		const core_objects = core_group.core_objects();

		for (let core_object of core_objects) {
			this._process_occlusion_on_object(core_object, params);
		}

		return core_group;
	}

	private _process_occlusion_on_object(core_object: CoreObject, params: OcclusionSopParams) {
		const geometry = core_object.core_geometry()?.geometry();
		if (!geometry) {
			return;
		}

		const position_array = geometry.attributes.position.array;
		const normal_array = geometry.attributes.normal.array;
		const index_array = geometry.getIndex()?.array;
		const aoSampler = geoao(position_array, {
			cells: index_array,
			normals: normal_array,
			resolution: params.bufferResolution,
			bias: params.bias,
		});

		for (let i = 0; i < params.samples; i++) {
			aoSampler.sample();
		}
		const ao = aoSampler.report();

		geometry.setAttribute(params.attribName, new Float32BufferAttribute(ao, 1));

		aoSampler.dispose();
	}
}
