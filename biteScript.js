// @ts-nocheck
const D = require('Diagnostics');
const S = require('Scene');
const R = require('Reactive');
const F = require('FaceTracking');
const P = require('Patches');

let counter = 0;
const tolerance = 0.02;

(async function main() {
    D.log("Script initialized");

    /** @type { SceneObjectBase[] } */
    const targets = getTargetsFromScene();

    /** @type { SceneObjectBase[] } */
    const lipMarkers = getLipMarkersFromScene();

    /** @type { PointSignal[] } */
    const lipPoints = projectFacePointsToFocalPlane(getLipPointsFromFace());

    /** @type { object } */
    const mouthBounds = findBounds2D(lipPoints);

    /** @type { ScalarSignal } */
    const mouthOpenness = F.face(0).mouth.openness;

    moveObjectsToPoints(lipMarkers, lipPoints);

    let isMouthOpen = false;



    mouthOpenness.monitor().subscribe(bite);

    function bite(openness) {
        if (openness.newValue > 0.4 && isMouthOpen === false) {
            isMouthOpen = true;

        } else if (openness.newValue < 0.2 && isMouthOpen === true) {
            isMouthOpen = false;
            let eatenTargetIndex = indexOfTargetInBounds(targets, mouthBounds, tolerance);

            if (eatenTargetIndex === -1) {
                D.log('YOU DIDN\'T EAT ANYTHING');
            } else {
                counter += 1;
                P.inputs.setScalar("counter", counter);
                P.inputs.setPulse("targetEaten" + eatenTargetIndex, R.once());
                D.log("YOU ATE target" + eatenTargetIndex);
            }
        }
    }

    D.watch("maxX:", mouthBounds.maxX);
    D.watch("maxY:", mouthBounds.maxY);
    D.watch("minX:", mouthBounds.minX);
    D.watch("minY:", mouthBounds.minY);
    D.watch("mouth openness: ", mouthOpenness);

    D.log("End of Log");
})()

/** @return { SceneObjectBase[] } */
async function getTargetsFromScene() {
    return await Promise.all(
        [S.root.findFirst("target0"),
        S.root.findFirst("target1"),
        S.root.findFirst("target2"),
        S.root.findFirst("target3"),
        S.root.findFirst("target4"),
        S.root.findFirst("target5")]
    ).catch((error) => D.log(error));
}

/** @return { SceneObjectBase[] } */
async function getLipMarkersFromScene() {
    return await Promise.all([
        S.root.findFirst("lipTop"),
        S.root.findFirst("lipBottom"),
        S.root.findFirst("lipLeft"),
        S.root.findFirst("lipRight")
    ]).catch((error) => D.log(error));
}

/** @return { PointSignal[] }*/
function getLipPointsFromFace() {
    return [
        F.face(0).mouth.upperLipCenter,
        F.face(0).mouth.lowerLipCenter,
        F.face(0).mouth.leftCorner,
        F.face(0).mouth.rightCorner
    ];
}

/** @param { PointSignal[] } points
 *  @return { PointSignal[] } */
function projectFacePointsToFocalPlane(points) {
    return points
        .map(point => F.face(0).cameraTransform.applyToPoint(point))
        .map(point => S.projectToScreen(point))
        .map(point => S.unprojectToFocalPlane(point))
        .map(point => point.neg())
}

/** @return { object } */
function findBounds2D(points){
    if (points.length !== 4){
        D.log("findBounds2D() requires an array of exactly four points.")
        return null;
    }
    // D.log("Trying to find extrema")
    return {
        maxX: findMax('x', points),
        maxY: findMax('y', points),
        minX: findMin('x', points),
        minY: findMin('y', points)
    }
}

/** @return { number } */
function indexOfTargetInBounds(targets, bounds, tolerance) {
    for (const [i, target] of targets.entries()) {
        if (isInside(target.transform.position, bounds, tolerance)){
            D.log("target index: " + i)
            return i;
        }
    }
    return -1;
}

/** @return { boolean } */
function isInside(pos, bounds, tolerance) {
    return pos.x.pinLastValue() < bounds.maxX.pinLastValue() + tolerance &&
        pos.x.pinLastValue() > bounds.minX.pinLastValue() - tolerance &&
        pos.y.pinLastValue() < bounds.maxY.pinLastValue() + tolerance &&
        pos.y.pinLastValue() > bounds.minY.pinLastValue() - tolerance;
}

/** @return { ScalarSignal } */
function findMax(prop, points) {
    let max = points[0][prop];
    points.forEach(point => {
        max = point[prop].max(max)
    });
    return max;
}

/** @return { ScalarSignal } */
function findMin(prop, points) {
    let min = points[0][prop];
    points.forEach(point => {
        min = point[prop].min(min)
    });
    return min;
}

/**
 * @param { SceneObjectBase[] } objects
 * @param { PointSignal[] } points
 * @return { void } */
function moveObjectsToPoints(objects, points) {
    for (const [i, object] of objects.entries()) {

        /** @type { PointSignal } */
        let point = points[i];
        object.transform.x = point.x;
        object.transform.y = point.y;
        object.transform.z = point.z;
    }
}