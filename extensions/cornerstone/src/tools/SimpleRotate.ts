// import { BaseTool } from '@cornerstonejs/tools/src/tools/base/index';
// import { getEnabledElement } from '@cornerstonejs/core';
// import type { Types } from '@cornerstonejs/core';

import { BaseVolumeViewport, getEnabledElement, Types as CoreTypes } from '@cornerstonejs/core';
import { EventTypes } from '@cornerstonejs/core/dist/types/types';
import { BaseTool } from '@cornerstonejs/tools';
import { PublicToolProps, ToolProps } from '@cornerstonejs/tools/dist/types/types';

import { vec3, mat4 } from 'gl-matrix';
// import { EventTypes, PublicToolProps, ToolProps } from '@cornerstonejs/tools/src/types/index';

/**
 * Tool that pans the camera in the plane defined by the viewPlaneNormal and the viewUp.
 */
class SimpleRotate extends BaseTool {
  static toolName;
  constructor(
    toolProps: PublicToolProps = {},
    defaultToolProps: ToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  touchDragCallback(evt: EventTypes.InteractionEventType) {
    this._dragCallback(evt);
  }

  mouseDragCallback(evt: EventTypes.InteractionEventType) {
    this._dragCallback(evt);
  }

  _dragCallback(evt: EventTypes.InteractionEventType) {
    const { element, deltaPoints } = evt.detail;
    const enabledElement = getEnabledElement(element);
    const { viewport } = enabledElement;
    const originalCamera = viewport.getCamera();

    try {
      const deltaPointsWorld = deltaPoints.world;

      let rotation = 0;
      if (deltaPointsWorld[1] > 0) {
        //console.log('El mouse se movió hacia abajo.');
        rotation = 1;
      } else if (deltaPointsWorld[1] < 0) {
        //console.log('El mouse se movió hacia arriba.');
        rotation = -1;
      } else {
        //console.log('El mouse no se movió verticalmente.');
      }
      const camera = viewport.getCamera();
      const rotAngle = (rotation * Math.PI) / 180;
      const rotMat = mat4.identity(new Float32Array(16));
      mat4.rotate(rotMat, rotMat, rotAngle, camera.viewPlaneNormal);
      const rotatedViewUp = vec3.transformMat4(vec3.create(), camera.viewUp, rotMat);
      viewport.setCamera({ viewUp: rotatedViewUp as CoreTypes.Point3 });
      viewport.render();
    } catch (error) {
      console.error('Ocurrió un error durante la rotación:', error);
      viewport.setCamera(originalCamera);
      viewport.render();
      console.log('Se ha restaurado la cámara original.');
    }
  }
}

SimpleRotate.toolName = 'SimpleRotate';
export default SimpleRotate;
