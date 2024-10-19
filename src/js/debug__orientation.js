import { MotionControlIndicator, calculateMotionControl, isSignificantMotion } from './motion';

function initDebugPage() {
    const container = document.getElementById('motionIndicator');
    if (!container) {
        console.error('Motion indicator container not found');
        return;
    }

    const indicator = new MotionControlIndicator(container, {
        showInfo: true,
        position: 'inline'
    });

    let initialOrientation = null;
    let lastOrientation = null;
    let sensitivityMultiplier = 1;

    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const button = document.getElementById('requestPermission');
            button.style.display = 'block';
            button.addEventListener('click', requestOrientationPermission);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    } else {
        showError("Sorry, your browser doesn't support Device Orientation");
    }

    function requestOrientationPermission() {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    hideError();
                    document.getElementById('requestPermission').style.display = 'none';
                } else {
                    showError('Permission to access device orientation was denied.');
                }
            })
            .catch(console.error);
    }

    function handleOrientation(event) {
        const currentOrientation = {
            beta: event.beta || 0,
            gamma: event.gamma || 0
        };

        if (!initialOrientation) {
            initialOrientation = { ...currentOrientation };
            lastOrientation = { ...currentOrientation };
        }

        const { direction, sensitivity, orientationChange } = calculateMotionControl(
            currentOrientation,
            initialOrientation,
            lastOrientation,
            sensitivityMultiplier
        );

        sensitivityMultiplier = sensitivity;

        if (direction && isSignificantMotion(orientationChange, sensitivityMultiplier)) {
            // in the game, this is where we would change the snake's direction
            console.log('Direction change:', direction);
        }

        indicator.update(currentOrientation, direction, sensitivityMultiplier);

        lastOrientation = currentOrientation;
    }

    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', initDebugPage);
