import {AllRegister} from 'polygonjs-engine/src/engine/poly/registers/All';
AllRegister.run();
import {polyPluginPhysics} from '../src/index';
import {Poly} from 'polygonjs-engine/src/engine/Poly';
Poly.registerPlugin(polyPluginPhysics);

import './helpers/setup';
import './tests';

QUnit.start();
