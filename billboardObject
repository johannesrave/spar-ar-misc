const S = require('Scene');
const R = require('Reactive');
const D = require('Diagnostics');
const DeviceMotion = require('DeviceMotion');

const objectName = 'looker';
const placementRefName = 'placementRef';
const pi = Math.PI;

(async function () {
    D.log("Script initialized");

    const [object, placementRef] = await Promise.all([
        S.root.findFirst(objectName),
        S.root.findFirst(placementRefName)
    ]).catch((error) => D.log(error));

    /*
    Construct a quaternion to neutralize the tracked planes rotation
    The axes don't directly map to the world coordinate system,
    but these offsets and switches work for me.
    To leave out one of the axes, just use "0" instead of the
    placementRef rotation for that axis, for example to keep your object from following the planes' z rotation.
    */
    const trackedPlaneRotation = R.quaternionFromEuler(
        placementRef.worldTransform.rotationX.sub(pi/2),
        placementRef.worldTransform.rotationZ.neg(),
        placementRef.worldTransform.rotationY
    )

    /*
    Construct a quaternion to neutralize the device rotation
    from the worldTransform angles of the DeviceMotion
    To leave out one of the axes, just use "0" instead of the DeviceMotion rotation for that axis,
    for example to keep your object from following the device's z rotation like this:

    const deviceRotation = R.quaternionFromEuler(
        DeviceMotion.worldTransform.rotationX,
        DeviceMotion.worldTransform.rotationY,
        0
    )
    */
    const deviceRotation = R.quaternionFromEuler(
        DeviceMotion.worldTransform.rotationX,
        DeviceMotion.worldTransform.rotationY,
        DeviceMotion.worldTransform.rotationZ
    )

    object.transform.rotation = trackedPlaneRotation.mul(deviceRotation);

    /*
    If you want to neutralize all axes of the tracked plane, you can use the "conjugate"
    of its rotation instead of building the counter rotation from the eulerAngles,
    and if you want the object to completely follow the devices rotation you can just use
    object.transform.rotation = placementRef.worldTransform.rotation.conjugate().mul(DeviceMotion.worldTransform.rotation);
    */

    D.log("End of Log");
})();