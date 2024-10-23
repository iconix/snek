import { GAME_CONFIG } from './config';
import { DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP } from './direction';

const { INPUT } = GAME_CONFIG;

/**
 * Represents a visual indicator for motion controls.
 */
export class MotionControlIndicator {

    /**
     * @param {HTMLDivElement} container - container element to render the indicator in
     * @param {Object} [options={}] - configuration options for the indicator
     * @param {boolean} [options.showInfo=true] - whether to show additional information
     * @param {string} [options.position='inline'] - position of the indicator ('inline' or 'corner')
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showInfo: true,
            position: 'inline',
            ...options
        };
        this._create();
        this._initialOrientation = null;
    }

    /**
     * Updates the motion control indicator based on the current orientation and direction.
     * @param {{ beta: number, gamma: number }} orientation - current device orientation
     * @param {string|null} direction - current direction of movement (UP, DOWN, LEFT, RIGHT, or null)
     * TODO: sensitivity
     */
    // update(orientation, direction, sensitivity) {
    update(orientation, direction) {
        // initialize reference point if not set
        if (!this._initialOrientation) {
            this._initialOrientation = {
                beta: orientation.beta,
                gamma: orientation.gamma
            };
            return; // skip first update to maintain center position
        }

        const { beta, gamma } = orientation;
        const maxTilt = 30;

        // calculate relative tilt from initial position
        const relativeBeta = beta - this._initialOrientation.beta;
        const relativeGamma = gamma - this._initialOrientation.gamma;

        // clamp the relative values to our maximum tilt range
        const tiltX = Math.min(Math.max(relativeGamma, -maxTilt), maxTilt) / maxTilt;
        const tiltY = Math.min(Math.max(relativeBeta, -maxTilt), maxTilt) / maxTilt;

        const dotPx = this.options.position === 'corner' ? 40 : 60;
        if (this.dot instanceof HTMLDivElement) {
            this.dot.style.transform = `translate(${tiltX * dotPx}px, ${tiltY * dotPx}px)`;
        }

        if (this.arrows) {
            this.arrows.forEach(arrow => arrow.classList.remove('active'));
        }
        if (direction) {
            const activeArrow = this.container.querySelector(`.arrow.${direction.toLowerCase()}`);
            if (activeArrow instanceof HTMLDivElement) {
                activeArrow.classList.add('active')
            }

            if (this.options.showInfo && this.directionValue instanceof HTMLSpanElement) {
                if (this.directionValue.textContent !== direction) {
                    this.directionValue.classList.add('highlight');
                    this.directionValue.textContent = direction;
                    setTimeout(() => {
                        if (this.directionValue instanceof HTMLSpanElement) {
                            this.directionValue.classList.remove('highlight');
                        }
                    }, 300);
                }
            }
        }

        if (this.options.showInfo) {
            if (this.betaValue instanceof HTMLSpanElement) {
                this.betaValue.textContent = beta.toFixed(2);
            }
            if (this.gammaValue instanceof HTMLSpanElement) {
                this.gammaValue.textContent = gamma.toFixed(2);
            }
            // if (this.sensitivityValue instanceof HTMLSpanElement) {
            //     this.sensitivityValue.textContent = sensitivity.toFixed(2);
            // }
        }
    }

    /**
     * Makes the motion control indicator visible, if it exists.
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Hides the motion control indicator, if it exists.
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Creates the DOM elements for the motion control indicator.
     * @private
     */
    _create() {
        this.container.innerHTML = `
            <div class="motion-indicator ${this.options.position}">
                <div class="tilt-indicator ${this.options.position}">
                    <div class="dot"></div>
                    <div class="arrow up ${this.options.position}">\u25B2\uFE0E</div>
                    <div class="arrow down ${this.options.position}">\u25BC\uFE0E</div>
                    <div class="arrow left ${this.options.position}">\u25C0\uFE0E</div>
                    <div class="arrow right ${this.options.position}">\u25B6\uFE0E</div>
                </div>
                ${this.options.showInfo ? `
                <div class="info">
                    <p>Direction: <span class="direction-value">None</span></p>
                    <!-- <p>Sensitivity: <span class="sensitivity-value">1.00</span></p> -->
                    <p>Beta: <span class="beta-value">0.00</span>°</p>
                    <p>Gamma: <span class="gamma-value">0.00</span>°</p>
                </div>
                ` : ''}
            </div>
        `;

        this.dot = this.container.querySelector('.dot');
        this.arrows = this.container.querySelectorAll('.arrow');
        this.directionValue = this.container.querySelector('.direction-value');
        // this.sensitivityValue = this.container.querySelector('.sensitivity-value');
        this.betaValue = this.container.querySelector('.beta-value');
        this.gammaValue = this.container.querySelector('.gamma-value');

        this._addStyles();
    }

    /**
     * Adds the necessary styles for the motion control indicator.
     * @private
     */
    _addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .motion-indicator {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .motion-indicator.corner {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 10px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .tilt-indicator {
                width: 150px;
                height: 150px;
                border: 2px solid #ccc;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
            }
            .tilt-indicator.corner {
                width: 100px;
                height: 100px;
            }
            .dot {
                width: 20px;
                height: 20px;
                background: blue;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                transition: transform 0.1s ease;
            }
            .arrow {
                position: absolute;
                color: #ccc;
                font-size: 24px;
                transition: color 0.3s ease;
            }
            .arrow.up { top: 10px; left: 50%; transform: translateX(-50%); }
            .arrow.down { bottom: 10px; left: 50%; transform: translateX(-50%); }
            .arrow.left { left: 10px; top: 50%; transform: translateY(-50%); }
            .arrow.right { right: 10px; top: 50%; transform: translateY(-50%); }
            .arrow.active { color: green; }
            .arrow.up.corner { top: 5px; }
            .arrow.down.corner { bottom: 5px; }
            .arrow.left.corner { left: 5px; }
            .arrow.right.corner { right: 5px; }
            .info {
                text-align: left;
                margin-left: 20px;
            }
            .info p {
                margin: 5px 0;
            }
            .direction-value {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                transition: background-color 0.3s ease;
            }
            .direction-value.highlight {
                background-color: #ffd700;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Calculates the motion control based on the current and last device orientation,
 * as well as the time between updates to prevent overly frequent updates.
 *
 * @param {{ beta: number, gamma: number }} currentOrientation - current device orientation
 * TODO: initialOrientation
 * @param {{ beta: number, gamma: number }} lastOrientation - last device orientation
 * @param {number} currentUpdateTime - timestamp of the current update
 * @param {number} lastUpdateTime - timestamp of the last update
 * TODO: sensitivityMultiplier
 *
 * @returns {string|null} direction - calculated direction (UP, DOWN, LEFT, RIGHT),
 *                        or null if no significant motion or if the update is too soon
 */
// export function calculateMotionControl(currentOrientation, initialOrientation, lastOrientation, currentUpdateTime, lastUpdateTime, sensitivityMultiplier) {
    export function calculateMotionControl(currentOrientation, initialOrientation, lastOrientation, currentUpdateTime, lastUpdateTime) {
    if (!initialOrientation) {
        // return { direction: null, sensitivity: sensitivityMultiplier };
        // return null on first update to prevent immediate movement
        return null;
    }

    // ensure we are not updating too frequently
    if (currentUpdateTime - lastUpdateTime < INPUT.MOTION_THROTTLE_TIME_MS) {
        // return { direction: null, sensitivity: sensitivityMultiplier };
        return null;
    }

    // calculate change relative to initial orientation
    // const totalChange = {
    //     beta: currentOrientation.beta - initialOrientation.beta,
    //     gamma: currentOrientation.gamma - initialOrientation.gamma
    // };

    // calculate change since last update
    const recentChange = {
        beta: currentOrientation.beta - lastOrientation.beta,
        gamma: currentOrientation.gamma - lastOrientation.gamma
    };

    // update sensitivity based on total change from initial position
    // const magnitudeChange = Math.sqrt(totalChange.beta ** 2 + totalChange.gamma ** 2);
    // const newSensitivityMultiplier = 1 + (magnitudeChange / 45);

    // // apply deadzone to recent change
    // const adjustedDeadzone = INPUT.MOTION_DEADZONE / newSensitivityMultiplier;
    // if (Math.abs(recentChange.beta) <= adjustedDeadzone) recentChange.beta = 0;
    // if (Math.abs(recentChange.gamma) <= adjustedDeadzone) recentChange.gamma = 0;

    // determine dominant direction based on recent change
    // const direction = isSignificantMotion(recentChange, sensitivityMultiplier) ? getDirectionFromOrientation(recentChange) : null;
    // return {
    //     direction,
    //     sensitivity: newSensitivityMultiplier
    // };
    return isSignificantMotion(recentChange) ? getDirectionFromOrientation(recentChange) : null;
}

/**
 * Determines if a change in device orientation is significant enough to trigger a direction change.
 * Filters out small, unintentional device movements so we respond only to deliberate motions.
 * @param {Object} orientationChange - change in device orientation
 * @param {number} orientationChange.beta - change in beta (x-axis rotation) in degrees
 * @param {number} orientationChange.gamma - change in gamma (y-axis rotation) in degrees
    * @returns {boolean} true if the motion is considered significant; false otherwise
 * TODO: sensitivityMultiplier
 * @private
 */
// function isSignificantMotion(orientationChange, sensitivityMultiplier) {
function isSignificantMotion(orientationChange) {
    const threshold = INPUT.MOTION_SENSITIVITY;
    return Math.abs(orientationChange.beta) > threshold || Math.abs(orientationChange.gamma) > threshold;
}

/**
* Determine direction based on orientation change.
* @param {{ beta: number, gamma: number }} orientationChange - the change in device orientation
* @returns {string | null} determined direction or null
* @private
*/
function getDirectionFromOrientation(orientationChange) {
    let direction = null;

    // // determine dominant direction based on recent change
    // const absBeta = Math.abs(orientationChange.beta);
    // const absGamma = Math.abs(orientationChange.gamma);

    // if (absBeta > absGamma && absBeta - absGamma > INPUT.DOMINANT_DIRECTION_THRESHOLD) {
    if (Math.abs(orientationChange.beta) > Math.abs(orientationChange.gamma)) {
        direction = orientationChange.beta < 0 ? DIRECTION_UP : DIRECTION_DOWN;
        // } else if (absGamma > absBeta && absGamma - absBeta > INPUT.DOMINANT_DIRECTION_THRESHOLD) {
    } else {
        direction = orientationChange.gamma < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return direction;
}
