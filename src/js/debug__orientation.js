import { MotionControlIndicator, calculateMotionControl } from './motion';

function initDebugPage() {
    const container = document.getElementById('motionIndicator');
    if (!(container instanceof HTMLDivElement)) {
        console.error('motion indicator container not found');
        return;
    }

    const indicator = new MotionControlIndicator(container, {
        showInfo: true,
        position: 'inline'
    });

    let initialOrientation = null;
    let lastOrientation = null;
    let lastOrientationUpdateTime = null;
    let snakeDirection = null;
    // let sensitivityMultiplier = 1;

    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const button = document.getElementById('requestPermission');
            if (button instanceof HTMLButtonElement) {
                button.style.display = 'block';
                button.addEventListener('click', requestOrientationPermission);
            }
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    } else {
        showError("sorry, your browser doesn't support Device Orientation");
    }

    function requestOrientationPermission() {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    hideError();

                    const button = document.getElementById('requestPermission');
                    if (button instanceof HTMLButtonElement) {
                        button.style.display = 'none';
                    }
                } else {
                    showError('permission to access device orientation was denied.');
                }
            })
            .catch(console.error);
    }

    function handleOrientation(event) {
        const currentUpdateTime = Date.now();
        const currentOrientation = {
            beta: event.beta || 0,
            gamma: event.gamma || 0
        };

        if (!initialOrientation) {
            initialOrientation = { ...currentOrientation };
            lastOrientation = { ...currentOrientation };
        }

        // const { direction, sensitivity } = calculateMotionControl(
        const direction = calculateMotionControl(
            currentOrientation,
            initialOrientation,
            lastOrientation,
            currentUpdateTime,
            lastOrientationUpdateTime
        );

        // sensitivityMultiplier = sensitivity;

        if (direction) {
            snakeDirection = direction;
            console.log('direction changed:', snakeDirection);

            lastOrientationUpdateTime = currentUpdateTime;
            lastOrientation = currentOrientation;
        }

        // indicator.update(currentOrientation, snakeDirection, sensitivityMultiplier);
        indicator.update(currentOrientation, snakeDirection);
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
