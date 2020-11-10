const S = require('Scene');
const R = require('Reactive');
const D = require('Diagnostics');
const DeviceMotion = require('DeviceMotion');
const Patches = require('Patches');

const numberFormat = 'Time: {0}';


// Enter look-at-target and object that needs to look at the target here
const objectName = 'julesBase';
const pivotName = 'placer';
const targetName = 'Camera';
const trackedPlaneName = 'planeTracker0';

(async function () {
    D.log("Script activated");

    /** @type { SceneObjectBase[] } */
        // @ts-ignore
    let [object, pivot, trackedPlane, target] = await Promise.all([
        S.root.findFirst(objectName),
        S.root.findFirst(pivotName),
        S.root.findFirst(trackedPlaneName),
        S.root.findFirst(targetName)])
        .catch((error) => D.log(error));

    let deviceTransform = DeviceMotion.worldTransform;
    let pivotTransform = pivot.worldTransform;
    let objectWorldTransform = object.worldTransform;

    let lookFromPoint = R.vector(pivotTransform.x, pivotTransform.y, pivotTransform.z);
    let lookAtPoint = R.point(
        deviceTransform.x.sub(objectWorldTransform.x),
        deviceTransform.z.sub(objectWorldTransform.y),
        deviceTransform.y.sub(objectWorldTransform.z));

    Patches.inputs.setVector('cameraPosition', R.vector(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z));
    let trackedPlaneRotation = await Patches.outputs.getVector('trackedPlaneRotation');
    let trackedPlaneFound = await Patches.outputs.getBoolean('trackedPlaneFound');

    object.transform.rotation = R.quaternionFromEuler(0, degToRad(trackedPlaneRotation.z.neg()), 0).mul(deviceTransform.rotation);
    // object.transform.rotation = deviceTransform.rotation.mul(R.quaternionFromEuler(0, degToRad(trackedPlaneRotation.z), 0));
    // object.transform.rotation = R.quaternionLookAt(lookAtPoint, R.vector(0,0,1));

    // trackedPlane.
    // object.transform.position = pivotTransform.position;
    /*
    object.transform.rotation = R.quaternionFromEuler(
        deviceTransform.rotation.eulerAngles.x,
        deviceTransform.rotation.eulerAngles.y,
        deviceTransform.rotation.eulerAngles.z,
    );
    */

    /*
    object.transform.rotationZ = deviceTransform.rotationZ.sub(Math.PI/2);
    object.transform.rotationX = deviceTransform.rotationX.add(1);
    object.transform.rotationY = deviceTransform.rotationY.mul(-1).sub(pivotTransform.rotationY);
    */

    // object.transform.rotationX = deviceTransform.rotation.eulerAngles.x;
    // object.transform.rotationZ = deviceTransform.rotation.eulerAngles.z;
    // object.transform.rotationY = deviceTransform.rotation.eulerAngles.y

    // object.transform.rotation = pivotTransform.rotation(pivotTransform.rotation, R.vector(0,1,0));



    let numberFormat = "{:2f}";
    // let numberFormat = "{:02f}";
    /** @type {import('ReactiveModule').StringSignal} */
    let debugString = "";
    debugString = R.concat(debugString, "DeviceMotion (x,y,z):");
    debugString = debugString.concat("\n");
    debugString = debugString.concat(radToDeg(deviceTransform.rotation.eulerAngles.x).format(numberFormat));
    debugString = debugString.concat("\n");
    debugString = debugString.concat(radToDeg(deviceTransform.rotation.eulerAngles.y).format(numberFormat));
    debugString = debugString.concat("\n");
    debugString = debugString.concat(radToDeg(deviceTransform.rotation.eulerAngles.z).format(numberFormat));

    debugString = debugString.concat("\n");
    debugString = debugString.concat("Tracked plane rotation:");
    debugString = debugString.concat("\n");
    debugString = debugString.concat(trackedPlaneRotation.x.format(numberFormat));
    debugString = debugString.concat("\n");
    debugString = debugString.concat(trackedPlaneRotation.y.format(numberFormat));
    debugString = debugString.concat("\n");
    debugString = debugString.concat(trackedPlaneRotation.z.format(numberFormat));

    debugString = debugString.concat("\n");
    debugString = debugString.concat("Object rotation:");
    debugString = debugString.concat("\n");
    debugString = debugString.concat(radToDeg(object.transform.rotation.eulerAngles.x).format(numberFormat));
    debugString = debugString.concat("\n");
    debugString = debugString.concat(radToDeg(object.transform.rotation.eulerAngles.y).format(numberFormat));
    debugString = debugString.concat("\n");
    debugString = debugString.concat(radToDeg(object.transform.rotation.eulerAngles.z).format(numberFormat));
    // debugString = debugString.concat(deviceTransform.rotation.eulerAngles.z.format(numberFormat));
    // debugString = debugString.concat("\n");
    // debugString = debugString.concat(deviceTransform.rotation.eulerAngles.x.pinLastValue());

    await Patches.inputs.setString('debugText', debugString);

    D.watch("device x eulerangle:", deviceTransform.rotation.eulerAngles.y);


    D.log("End of Log");
})();

function degToRad(degrees)
{
    var pi = Math.PI;
    return degrees.mul(pi/180);
}

function radToDeg(radians)
{
    var pi = Math.PI;
    return radians.mul(180/pi);
}