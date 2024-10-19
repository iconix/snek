import { GAME_CONFIG } from './config';
import { DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP } from './direction';

const { INPUT } = GAME_CONFIG;

export class MotionControlIndicator {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showInfo: true,
            position: 'inline',
            ...options
        };
        this.create();
    }

    create() {
        this.container.innerHTML = `
            <div class="motion-indicator ${this.options.position}">
                <div class="tilt-indicator ${this.options.position}">
                    <div class="dot"></div>
                    <div class="arrow up ${this.options.position}">▲</div>
                    <div class="arrow down ${this.options.position}">▼</div>
                    <div class="arrow left ${this.options.position}">◀</div>
                    <div class="arrow right ${this.options.position}">▶</div>
                </div>
                ${this.options.showInfo ? `
                <div class="info">
                    <p>Direction: <span class="direction-value">None</span></p>
                    <p>Sensitivity: <span class="sensitivity-value">1.00</span></p>
                    <p>Beta: <span class="beta-value">0.00</span>°</p>
                    <p>Gamma: <span class="gamma-value">0.00</span>°</p>
                </div>
                ` : ''}
            </div>
        `;

        this.dot = this.container.querySelector('.dot');
        this.arrows = this.container.querySelectorAll('.arrow');
        this.directionValue = this.container.querySelector('.direction-value');
        this.sensitivityValue = this.container.querySelector('.sensitivity-value');
        this.betaValue = this.container.querySelector('.beta-value');
        this.gammaValue = this.container.querySelector('.gamma-value');

        this.addStyles();
    }

    addStyles() {
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
        `;
        document.head.appendChild(style);
    }

    update(orientation, direction, sensitivity) {
        const { beta, gamma } = orientation;
        const maxTilt = 30;
        const tiltX = Math.min(Math.max(gamma, -maxTilt), maxTilt) / maxTilt;
        const tiltY = Math.min(Math.max(beta, -maxTilt), maxTilt) / maxTilt;

        const dotPx = this.options.position === 'corner' ? 40 : 60;
        this.dot.style.transform = `translate(${tiltX * dotPx}px, ${tiltY * dotPx}px)`;

        this.arrows.forEach(arrow => arrow.classList.remove('active'));
        if (direction) {
            this.container.querySelector(`.arrow.${direction.toLowerCase()}`).classList.add('active');
        }

        if (this.options.showInfo) {
            this.directionValue.textContent = direction || 'None';
            this.sensitivityValue.textContent = sensitivity.toFixed(2);
            this.betaValue.textContent = beta.toFixed(2);
            this.gammaValue.textContent = gamma.toFixed(2);
        }
    }
}

export function calculateMotionControl(currentOrientation, initialOrientation, lastOrientation, sensitivityMultiplier) {
    if (!initialOrientation) {
        return { direction: null, sensitivity: 1, orientationChange: { beta: 0, gamma: 0 } };
    }

    // calculate change relative to initial orientation
    const totalChange = {
        beta: currentOrientation.beta - initialOrientation.beta,
        gamma: currentOrientation.gamma - initialOrientation.gamma
    };

    // calculate change since last update
    const recentChange = {
        beta: currentOrientation.beta - lastOrientation.beta,
        gamma: currentOrientation.gamma - lastOrientation.gamma
    };

    // update sensitivity based on total change from initial position
    const magnitudeChange = Math.sqrt(totalChange.beta ** 2 + totalChange.gamma ** 2);
    const newSensitivityMultiplier = 1 + (magnitudeChange / 45);

    // apply deadzone to recent change
    const adjustedDeadzone = INPUT.MOTION_DEADZONE / newSensitivityMultiplier;
    if (Math.abs(recentChange.beta) <= adjustedDeadzone) recentChange.beta = 0;
    if (Math.abs(recentChange.gamma) <= adjustedDeadzone) recentChange.gamma = 0;

    // determine dominant direction based on recent change
    const direction = getDirectionFromOrientation(recentChange);

    return {
        direction,
        sensitivity: newSensitivityMultiplier,
        orientationChange: recentChange
    };
}

export function isSignificantMotion(orientationChange, sensitivityMultiplier) {
    const threshold = INPUT.MOTION_SENSITIVITY / sensitivityMultiplier;
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

    // determine dominant direction based on recent change
    const absBeta = Math.abs(orientationChange.beta);
    const absGamma = Math.abs(orientationChange.gamma);

    if (absBeta > absGamma && absBeta - absGamma > INPUT.DOMINANT_DIRECTION_THRESHOLD) {
        direction = orientationChange.beta < 0 ? DIRECTION_UP : DIRECTION_DOWN;
    } else if (absGamma > absBeta && absGamma - absBeta > INPUT.DOMINANT_DIRECTION_THRESHOLD) {
        direction = orientationChange.gamma < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }

    return direction;
}
